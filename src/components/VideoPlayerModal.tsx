import React, { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import {
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  RotateCw,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Download
} from 'lucide-react';
import { Lecture, VideoDetails } from '../types';
import { fetchVideoDetails } from '../services/api';

interface VideoPlayerModalProps {
  courseId: string;
  lecture: Lecture | null;
  onClose: () => void;
  onOpenPdf: (pdfUrl: string, title: string) => void;
  playlist?: Lecture[];
  onSelectLecture?: (lecture: Lecture) => void;
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
  courseId,
  lecture,
  onClose,
  onOpenPdf,
  playlist = [],
  onSelectLecture,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [videoDetails, setVideoDetails] = useState<VideoDetails | null>(null);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [selectedQuality, setSelectedQuality] = useState<string>('auto');
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const controlsTimeoutRef = useRef<any>(null);

  const hideControlsLater = useCallback(() => {
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    setShowControls(true);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3500);
  }, [isPlaying]);

  // Load video details whenever lecture changes
  useEffect(() => {
    if (!lecture) return;
    let isCancelled = false;
    setLoading(true);
    setError(null);
    setAutoplayBlocked(false);

    async function loadData() {
      try {
        const details = await fetchVideoDetails(courseId, String(lecture?.id || ''));
        if (isCancelled) return;
        setVideoDetails(details);
        setLoading(false);
      } catch (err: any) {
        if (isCancelled) return;
        console.warn('[GB STUDY] Could not fetch extra video details:', err);
        setLoading(false);
      }
    }

    loadData();
    return () => {
      isCancelled = true;
    };
  }, [courseId, lecture]);

  // Determine stream URL prioritizing working transcoded qualities
  const getStreamUrl = useCallback(() => {
    if (!lecture) return null;

    // 1. If YouTube video ID
    const rawLink = videoDetails?.decoded_video_link || lecture.file_link || '';
    if (rawLink && !rawLink.includes('http') && rawLink.length === 11) {
      return { type: 'youtube', url: `https://www.youtube.com/embed/${rawLink}?autoplay=1&rel=0` };
    }
    if (rawLink && (rawLink.includes('youtube.com') || rawLink.includes('youtu.be'))) {
      const match = rawLink.match(/(?:embed\/|v=|vi=|\.be\/)([^&?]+)/);
      if (match) {
        return { type: 'youtube', url: `https://www.youtube.com/embed/${match[1]}?autoplay=1&rel=0` };
      }
    }

    // 2. Direct MP4 check
    if (rawLink.toLowerCase().includes('.mp4')) {
      return { type: 'mp4', url: rawLink };
    }
    if (lecture.file_link && lecture.file_link.toLowerCase().includes('.mp4')) {
      return { type: 'mp4', url: lecture.file_link };
    }

    // 3. Authenticated transcoded Qualities array (Highest reliability)
    if (videoDetails?.qualities && videoDetails.qualities.length > 0) {
      if (selectedQuality !== 'auto') {
        const matched = videoDetails.qualities.find((q) => q.quality === selectedQuality);
        if (matched && matched.url) {
          return { type: 'hls', url: matched.url };
        }
      }
      const topQuality = videoDetails.qualities[0].url;
      if (topQuality) {
        return { type: 'hls', url: topQuality };
      }
    }

    // 4. Fallback streams
    if (videoDetails?.decoded_video_link) {
      return { type: 'hls', url: videoDetails.decoded_video_link };
    }
    if (lecture.file_link) {
      return { type: 'hls', url: lecture.file_link };
    }
    if (lecture.download_links && lecture.download_links.length > 0) {
      return { type: 'hls', url: lecture.download_links[0].path };
    }

    return null;
  }, [videoDetails, lecture, selectedQuality]);

  const streamInfo = getStreamUrl();

  // Attach Video & Initialize Player
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !streamInfo || streamInfo.type === 'youtube') return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const streamUrl = streamInfo.url;
    setError(null);

    // Direct MP4
    if (streamInfo.type === 'mp4') {
      video.src = streamUrl;
      video.play().catch(() => setAutoplayBlocked(true));
      return;
    }

    // HLS Stream
    const proxyUrl = `/api/video?url=${encodeURIComponent(streamUrl)}`;

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
      });
      hlsRef.current = hls;

      hls.loadSource(proxyUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {
          setAutoplayBlocked(true);
        });
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          console.warn('[GB STUDY] HLS stream fatal error:', data.type, data.details);
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            hls.startLoad();
          } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            hls.recoverMediaError();
          } else {
            // Try loading direct stream URL as backup
            hls.loadSource(streamUrl);
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // iOS / Native HLS
      video.src = proxyUrl;
      video.play().catch(() => setAutoplayBlocked(true));
    } else {
      video.src = streamUrl;
      video.play().catch(() => setAutoplayBlocked(true));
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [streamInfo?.url, streamInfo?.type]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === ' ' || e.key === 'k') {
        e.preventDefault();
        togglePlay();
      }
      if (e.key === 'ArrowLeft') seekRelative(-10);
      if (e.key === 'ArrowRight') seekRelative(10);
      if (e.key === 'm') toggleMute();
      if (e.key === 'f') toggleFullscreen();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isPlaying]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    setAutoplayBlocked(false);
    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch((e) => console.log('Play blocked', e));
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const seekRelative = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(video.currentTime + seconds, video.duration || 0));
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const time = parseFloat(e.target.value);
    video.currentTime = time;
    setCurrentTime(time);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    const video = videoRef.current;
    if (!video) return;
    video.volume = val;
    setVolume(val);
    setIsMuted(val === 0);
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;
    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const changeSpeed = (rate: number) => {
    const video = videoRef.current;
    if (video) video.playbackRate = rate;
    setPlaybackRate(rate);
    setShowSettings(false);
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) {
      return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    }
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Next / Prev lecture in topic
  const currentIndex = playlist.findIndex((l) => String(l.id) === String(lecture?.id));
  const prevLecture = currentIndex > 0 ? playlist[currentIndex - 1] : null;
  const nextLecture = currentIndex >= 0 && currentIndex < playlist.length - 1 ? playlist[currentIndex + 1] : null;

  const pdfUrl = videoDetails?.decoded_pdf_link || lecture?.pdf_link || null;

  if (!lecture) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="GB STUDY Lecture Player"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-1 sm:p-4 lg:p-6"
    >
      <div
        ref={containerRef}
        onMouseMove={hideControlsLater}
        className="relative w-full max-w-6xl h-full max-h-[96vh] bg-black rounded-2xl overflow-hidden border border-zinc-800 flex flex-col shadow-2xl"
      >
        {/* Top Header Bar */}
        <div className="absolute top-0 inset-x-0 z-40 bg-gradient-to-b from-black/90 via-black/60 to-transparent p-3 sm:p-4 flex items-center justify-between text-white pointer-events-auto">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 pr-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-pink-600 text-white uppercase tracking-wider shrink-0 shadow-sm">
              GB STUDY
            </span>
            <h2 className="text-xs sm:text-base font-bold truncate text-zinc-100">
              {lecture.Title || lecture.title || 'Live Video Class'}
            </h2>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Notes Button */}
            {pdfUrl && (
              <a
                href={`/pdf?url=${encodeURIComponent(pdfUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold bg-pink-500/20 text-pink-300 hover:bg-pink-500/30 border border-pink-500/40 transition-colors cursor-pointer"
                title="Open Notes PDF in new tab"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Notes PDF</span>
              </a>
            )}

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors cursor-pointer"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Video Stage */}
        <div className="relative flex-1 w-full bg-black flex items-center justify-center overflow-hidden">
          {/* Loading Overlay */}
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-30">
              <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-xs sm:text-sm font-semibold text-zinc-300">Connecting to GB STUDY Stream...</p>
              <p className="text-[11px] text-zinc-500 mt-1">Decrypting authentic lecture video</p>
            </div>
          )}

          {/* Fatal Error Fallback */}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-30 p-4 text-center">
              <AlertCircle className="w-10 h-10 text-pink-500 mb-2" />
              <p className="text-sm text-pink-400 font-semibold mb-3">{error}</p>
              <div className="flex items-center justify-center">
                <button
                  onClick={() => {
                    setError(null);
                    setLoading(true);
                  }}
                  className="px-5 py-2.5 bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs rounded-xl cursor-pointer shadow-lg active:scale-95 transition-all"
                >
                  Retry Lecture
                </button>
              </div>
            </div>
          )}

          {/* YouTube Embed Player */}
          {streamInfo?.type === 'youtube' ? (
            <iframe
              src={streamInfo.url}
              title={lecture.Title || 'Video Lecture'}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full border-0"
            />
          ) : (
            <>
              {/* HTML5 Video Element */}
              <video
                ref={videoRef}
                onClick={togglePlay}
                onTimeUpdate={() => {
                  if (videoRef.current) {
                    setCurrentTime(videoRef.current.currentTime);
                    setDuration(videoRef.current.duration || 0);
                  }
                }}
                onPlay={() => {
                  setIsPlaying(true);
                  setAutoplayBlocked(false);
                }}
                onPause={() => setIsPlaying(false)}
                className="w-full h-full object-contain cursor-pointer"
                playsInline
              />

              {/* Autoplay Blocked or Ready to Play Touch Overlay */}
              {autoplayBlocked && (
                <div
                  onClick={togglePlay}
                  className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-35 cursor-pointer backdrop-blur-[2px]"
                >
                  <div className="w-20 h-20 rounded-full bg-pink-600 hover:bg-pink-500 text-white flex items-center justify-center shadow-[0_0_40px_rgba(236,72,153,0.7)] animate-pulse mb-3">
                    <Play className="w-10 h-10 fill-white translate-x-1" />
                  </div>
                  <span className="text-base font-bold text-white drop-shadow-md">
                    Tap to Start Class
                  </span>
                  <span className="text-xs text-pink-300 mt-1">High Definition Audio & Video</span>
                </div>
              )}

              {/* Central Play Indicator when Paused */}
              {!isPlaying && !loading && !autoplayBlocked && (
                <button
                  onClick={togglePlay}
                  className="absolute inset-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-pink-600/90 hover:bg-pink-500 text-white flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all z-20 cursor-pointer"
                >
                  <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-white translate-x-0.5" />
                </button>
              )}

              {/* Bottom Custom Controls Overlay */}
              <div
                className={`absolute bottom-0 inset-x-0 z-40 bg-gradient-to-t from-black/95 via-black/75 to-transparent p-3 sm:p-4 transition-opacity duration-300 ${
                  showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
              >
                {/* Progress Slider */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[11px] font-mono tabular-nums text-zinc-300 w-12 text-right">
                    {formatTime(currentTime)}
                  </span>
                  <input
                    type="range"
                    min="0"
                    max={duration || 100}
                    value={currentTime}
                    onChange={handleSeek}
                    className="flex-1 h-1.5 bg-zinc-700/60 rounded-lg appearance-none cursor-pointer accent-pink-500"
                  />
                  <span className="text-[11px] font-mono tabular-nums text-zinc-400 w-12">
                    {formatTime(duration)}
                  </span>
                </div>

                {/* Bottom Buttons Bar */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 sm:gap-4">
                    {/* Play / Pause */}
                    <button
                      onClick={togglePlay}
                      className="p-1.5 text-white hover:text-pink-400 transition-colors cursor-pointer"
                      title={isPlaying ? 'Pause' : 'Play'}
                    >
                      {isPlaying ? <Pause className="w-5 h-5 sm:w-6 sm:h-6" /> : <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-white" />}
                    </button>

                    {/* Skip -10s */}
                    <button
                      onClick={() => seekRelative(-10)}
                      className="p-1.5 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                      title="-10 seconds"
                    >
                      <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>

                    {/* Skip +10s */}
                    <button
                      onClick={() => seekRelative(10)}
                      className="p-1.5 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                      title="+10 seconds"
                    >
                      <RotateCw className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>

                    {/* Volume */}
                    <div className="hidden sm:flex items-center gap-2">
                      <button onClick={toggleMute} className="text-zinc-300 hover:text-white cursor-pointer">
                        {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={isMuted ? 0 : volume}
                        onChange={handleVolumeChange}
                        className="w-16 h-1 bg-zinc-700 rounded-lg accent-pink-500 cursor-pointer"
                      />
                    </div>

                    {/* Prev / Next in Playlist */}
                    {prevLecture && onSelectLecture && (
                      <button
                        onClick={() => onSelectLecture(prevLecture)}
                        className="p-1.5 text-zinc-400 hover:text-white flex items-center gap-1 text-xs cursor-pointer"
                        title="Previous Lecture"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span className="hidden md:inline">Prev</span>
                      </button>
                    )}

                    {nextLecture && onSelectLecture && (
                      <button
                        onClick={() => onSelectLecture(nextLecture)}
                        className="p-1.5 text-zinc-400 hover:text-white flex items-center gap-1 text-xs cursor-pointer"
                        title="Next Lecture"
                      >
                        <span className="hidden md:inline">Next</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Right side controls */}
                  <div className="flex items-center gap-2 sm:gap-3">
                    {/* Quality Selector */}
                    {videoDetails?.qualities && videoDetails.qualities.length > 0 && (
                      <div className="relative">
                        <select
                          value={selectedQuality}
                          onChange={(e) => setSelectedQuality(e.target.value)}
                          className="bg-zinc-900 border border-zinc-700 text-xs font-bold text-pink-400 rounded-lg px-2 py-1 outline-none cursor-pointer hover:border-pink-500"
                        >
                          <option value="auto">Auto Quality</option>
                          {videoDetails.qualities.map((q) => (
                            <option key={q.quality} value={q.quality}>
                              {q.quality}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Settings / Speed Popup Button */}
                    <div className="relative">
                      <button
                        onClick={() => setShowSettings(!showSettings)}
                        className="p-1.5 text-zinc-300 hover:text-white flex items-center gap-1 text-xs font-semibold cursor-pointer"
                        title="Playback Speed"
                      >
                        <Settings className="w-4 h-4" />
                        <span className="hidden sm:inline">{playbackRate}x</span>
                      </button>

                      {showSettings && (
                        <div className="absolute bottom-9 right-0 bg-zinc-900 border border-zinc-700 rounded-xl p-2 shadow-2xl flex flex-col gap-1 w-28 z-50">
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider px-2 py-1 border-b border-zinc-800">
                            Speed
                          </span>
                          {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                            <button
                              key={rate}
                              onClick={() => changeSpeed(rate)}
                              className={`px-2 py-1 text-xs text-left rounded-lg transition-colors cursor-pointer ${
                                playbackRate === rate
                                  ? 'bg-pink-600 text-white font-bold'
                                  : 'text-zinc-300 hover:bg-zinc-800'
                              }`}
                            >
                              {rate === 1 ? '1x (Normal)' : `${rate}x`}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Fullscreen Button */}
                    <button
                      onClick={toggleFullscreen}
                      className="p-1.5 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                      title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                    >
                      {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
