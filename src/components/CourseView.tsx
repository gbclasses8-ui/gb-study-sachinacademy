import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Share2,
  Folder,
  Play,
  FileText,
  Clock,
  Calendar,
  ChevronRight,
  Search,
  BookOpen,
  Sparkles,
  Check
} from 'lucide-react';
import { Batch, Subject, Topic, Lecture } from '../types';
import { fetchSubjects, fetchTopics, fetchLectures } from '../services/api';

interface CourseViewProps {
  batch: Batch;
  onBackToBatches: () => void;
  onOpenVideo: (lecture: Lecture, playlist: Lecture[]) => void;
  onOpenPdf: (pdfUrl: string, title: string) => void;
  isEnrolled: boolean;
  onToggleEnroll: (id: string, e: React.MouseEvent) => void;
}

type HierarchyLevel = 'root' | 'subject' | 'topic';

interface NavState {
  level: HierarchyLevel;
  subject?: Subject;
  topic?: Topic;
}

export const CourseView: React.FC<CourseViewProps> = ({
  batch,
  onBackToBatches,
  onOpenVideo,
  onOpenPdf,
  isEnrolled,
  onToggleEnroll,
}) => {
  const [navState, setNavState] = useState<NavState>({ level: 'root' });
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'video' | 'pdf'>('all');

  // Load Subjects on mount
  useEffect(() => {
    let cancelled = false;
    async function loadSubjects() {
      setLoading(true);
      const data = await fetchSubjects(batch.id);
      if (!cancelled) {
        setSubjects(data);
        setLoading(false);
      }
    }
    loadSubjects();
    return () => {
      cancelled = true;
    };
  }, [batch.id]);

  // Load Topics when subject selected
  useEffect(() => {
    if (navState.level !== 'subject' || !navState.subject) return;
    let cancelled = false;
    async function loadTopics() {
      setLoading(true);
      const data = await fetchTopics(batch.id, navState.subject!.subjectid);
      if (!cancelled) {
        setTopics(data);
        setLoading(false);
      }
    }
    loadTopics();
    return () => {
      cancelled = true;
    };
  }, [batch.id, navState.level, navState.subject]);

  // Load Lectures when topic selected
  useEffect(() => {
    if (navState.level !== 'topic' || !navState.subject || !navState.topic) return;
    let cancelled = false;
    async function loadLectures() {
      setLoading(true);
      const data = await fetchLectures(
        batch.id,
        navState.subject!.subjectid,
        navState.topic!.topicid
      );
      if (!cancelled) {
        setLectures(data);
        setLoading(false);
      }
    }
    loadLectures();
    return () => {
      cancelled = true;
    };
  }, [batch.id, navState.level, navState.subject, navState.topic]);

  // Navigation handlers
  const handleSelectSubject = (subject: Subject) => {
    setSearchQuery('');
    setNavState({ level: 'subject', subject });
  };

  const handleSelectTopic = (topic: Topic) => {
    setSearchQuery('');
    setNavState({ ...navState, level: 'topic', topic });
  };

  const handleGoBack = () => {
    if (navState.level === 'topic') {
      setNavState({ level: 'subject', subject: navState.subject });
    } else if (navState.level === 'subject') {
      setNavState({ level: 'root' });
    } else {
      onBackToBatches();
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Filtered lists based on search
  const filteredSubjects = subjects.filter((s) =>
    s.subject_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTopics = topics.filter((t) =>
    t.topic_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredLectures = lectures.filter((l) => {
    const title = (l.Title || l.title || '').toLowerCase();
    const matchesSearch = title.includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    const isPdfOnly =
      l.material_type === 'PDF' ||
      l.material_type === 'NOTES' ||
      (!l.file_link && l.pdf_link);

    if (filterType === 'video') return !isPdfOnly;
    if (filterType === 'pdf') return isPdfOnly || Boolean(l.pdf_link);
    return true;
  });

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 pb-20">
      {/* Course Hero Banner */}
      <div className="relative border-b border-zinc-800/80 bg-zinc-950 overflow-hidden">
        <div className="absolute inset-0 opacity-15">
          <img
            src={batch.thumbnail}
            alt={batch.title}
            className="w-full h-full object-cover blur-md"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {/* Top Row: Back button & Share */}
          <div className="flex items-center justify-between gap-4 mb-4">
            <button
              onClick={handleGoBack}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>
                {navState.level === 'topic'
                  ? 'Back to Topics'
                  : navState.level === 'subject'
                  ? 'Back to Subjects'
                  : 'Back to All Batches'}
              </span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={(e) => onToggleEnroll(batch.id, e)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer active:scale-95 ${
                  isEnrolled
                    ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40'
                    : 'bg-pink-600 hover:bg-pink-500 text-white shadow-md shadow-pink-600/30'
                }`}
              >
                {isEnrolled ? '✓ Enrolled' : '+ Enroll'}
              </button>

              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-xs font-semibold transition-colors cursor-pointer"
                title="Share Course Link"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{copied ? 'Copied!' : 'Share'}</span>
              </button>
            </div>
          </div>

          {/* Hero Content Split */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            <div className="w-24 sm:w-36 aspect-video sm:aspect-square rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 shrink-0 shadow-lg">
              <img
                src={batch.thumbnail}
                alt={batch.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>GB STUDY Premium Unlocked Batch</span>
                <span className="text-zinc-600">·</span>
                <span className="text-emerald-400">100% Free</span>
              </div>
              <h1 className="text-lg sm:text-2xl md:text-3xl font-extrabold text-white font-heading leading-tight">
                {batch.title}
              </h1>
              <div className="mt-2 text-xs text-zinc-400 flex flex-wrap items-center gap-2">
                <span>Batch #{batch.id}</span>
                <span className="text-zinc-700">/</span>
                <span>{subjects.length} Subjects Available</span>
                <span className="text-zinc-700">/</span>
                <span>Video Lectures & Class Notes</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        {/* Breadcrumb Path (Zero-Pill discipline) */}
        <div className="flex items-center flex-wrap gap-2 text-xs sm:text-sm text-zinc-400 mb-6 pb-3 border-b border-zinc-800/80">
          <button
            onClick={() => setNavState({ level: 'root' })}
            className={`hover:text-amber-400 transition-colors cursor-pointer ${
              navState.level === 'root' ? 'text-amber-400 font-bold' : ''
            }`}
          >
            Subjects
          </button>

          {navState.subject && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
              <button
                onClick={() => setNavState({ level: 'subject', subject: navState.subject })}
                className={`hover:text-amber-400 transition-colors cursor-pointer ${
                  navState.level === 'subject' ? 'text-amber-400 font-bold' : ''
                }`}
              >
                {navState.subject.subject_name}
              </button>
            </>
          )}

          {navState.topic && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
              <span className="text-amber-400 font-bold truncate max-w-xs">
                {navState.topic.topic_name}
              </span>
            </>
          )}
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                navState.level === 'root'
                  ? 'Filter subjects (e.g. CDP, Hindi, Math)...'
                  : navState.level === 'subject'
                  ? 'Filter chapters & topics...'
                  : 'Filter lectures and notes...'
              }
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 focus:border-amber-400 rounded-xl text-xs sm:text-sm text-white placeholder:text-zinc-500 outline-none"
            />
          </div>

          {/* Interactive filter control (allowed button segmented tabs) */}
          {navState.level === 'topic' && (
            <div className="flex items-center gap-1 p-1 bg-zinc-900 border border-zinc-800 rounded-xl shrink-0">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  filterType === 'all'
                    ? 'bg-amber-400 text-black font-bold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                All Content
              </button>
              <button
                onClick={() => setFilterType('video')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  filterType === 'video'
                    ? 'bg-amber-400 text-black font-bold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Videos Only
              </button>
              <button
                onClick={() => setFilterType('pdf')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  filterType === 'pdf'
                    ? 'bg-amber-400 text-black font-bold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                PDF Notes
              </button>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-20 flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs text-zinc-400">Loading course materials...</p>
          </div>
        )}

        {/* LEVEL 1: Subjects Grid */}
        {!loading && navState.level === 'root' && (
          <div>
            {filteredSubjects.length === 0 ? (
              <div className="py-16 text-center bg-zinc-900/40 rounded-2xl border border-zinc-800">
                <BookOpen className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
                <p className="text-sm text-zinc-400">No subjects matching "{searchQuery}"</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
                {filteredSubjects.map((sub) => (
                  <div
                    key={sub.subjectid}
                    onClick={() => handleSelectSubject(sub)}
                    className="p-4 rounded-xl bg-[#121214] border border-zinc-800/80 hover:border-amber-400/50 flex items-center justify-between gap-3 group hover:-translate-y-0.5 transition-all cursor-pointer shadow-sm hover:shadow-lg"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {sub.subject_logo ? (
                        <div className="w-11 h-11 rounded-xl bg-zinc-950 border border-zinc-800 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                          <img
                            src={sub.subject_logo}
                            alt={sub.subject_name}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-11 h-11 rounded-xl bg-amber-400/10 text-amber-400 flex items-center justify-center shrink-0">
                          <Folder className="w-5 h-5" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-white truncate group-hover:text-amber-300 transition-colors">
                          {sub.subject_name}
                        </h3>
                        <p className="text-xs text-zinc-400 mt-0.5">Explore chapters & classes</p>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400 group-hover:text-white group-hover:bg-amber-400/20 transition-colors shrink-0">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* LEVEL 2: Topics Grid */}
        {!loading && navState.level === 'subject' && (
          <div>
            {filteredTopics.length === 0 ? (
              <div className="py-16 text-center bg-zinc-900/40 rounded-2xl border border-zinc-800">
                <BookOpen className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
                <p className="text-sm text-zinc-400">No chapters found for this subject.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {filteredTopics.map((top) => (
                  <div
                    key={top.topicid}
                    onClick={() => handleSelectTopic(top)}
                    className="p-4 rounded-xl bg-[#121214] border border-zinc-800/80 hover:border-amber-400/50 flex items-center justify-between gap-3 group hover:-translate-y-0.5 transition-all cursor-pointer shadow-sm hover:shadow-lg"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-amber-400/10 text-amber-400 flex items-center justify-center shrink-0">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-white truncate group-hover:text-amber-300 transition-colors">
                          {top.topic_name}
                        </h3>
                        <p className="text-xs text-zinc-400 mt-0.5">Watch lectures & notes</p>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400 group-hover:text-white group-hover:bg-amber-400/20 transition-colors shrink-0">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* LEVEL 3: Lectures & Notes List */}
        {!loading && navState.level === 'topic' && (
          <div>
            {filteredLectures.length === 0 ? (
              <div className="py-16 text-center bg-zinc-900/40 rounded-2xl border border-zinc-800">
                <BookOpen className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
                <p className="text-sm text-zinc-400">No lectures found matching your criteria.</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {filteredLectures.map((lec) => {
                  const isPdfOnly =
                    lec.material_type === 'PDF' ||
                    lec.material_type === 'NOTES' ||
                    (!lec.file_link && !lec.duration && lec.pdf_link);

                  const pdfUrl = lec.pdf_link || lec.file_link || lec.download_link;
                  const dateStr = lec.date_and_time || lec.event_date || 'Class Session';
                  const durationStr = lec.duration
                    ? `${Math.round(parseInt(lec.duration) / 60)} mins`
                    : '';

                  return (
                    <div
                      key={lec.id}
                      className="p-3.5 sm:p-4 rounded-xl bg-[#121214] border border-zinc-800/80 hover:border-zinc-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all"
                    >
                      <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                        {/* Thumbnail or Icon */}
                        <div className="relative w-24 sm:w-28 aspect-video rounded-lg overflow-hidden bg-zinc-950 border border-zinc-800 shrink-0">
                          {lec.thumbnail ? (
                            <img
                              src={lec.thumbnail}
                              alt={lec.Title || 'Class'}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-500">
                              {isPdfOnly ? <FileText className="w-6 h-6 text-amber-400/50" /> : <Play className="w-6 h-6 text-amber-400/50" />}
                            </div>
                          )}

                          {durationStr && !isPdfOnly && (
                            <span className="absolute bottom-1 right-1 bg-black/80 text-white font-mono text-[9px] font-bold px-1 py-0.5 rounded">
                              {durationStr}
                            </span>
                          )}
                        </div>

                        {/* Title and details */}
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-bold text-white line-clamp-2 leading-snug">
                            {lec.Title || lec.title || 'Untitled Lecture'}
                          </h3>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 mt-1.5">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-zinc-500" />
                              <span>{dateStr}</span>
                            </span>
                            {durationStr && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-zinc-500" />
                                <span>{durationStr}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        {!isPdfOnly && (
                          <button
                            onClick={() => onOpenVideo(lec, filteredLectures)}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-pink-600 hover:bg-pink-500 text-white shadow-md shadow-pink-600/30 active:scale-95 transition-all cursor-pointer"
                          >
                            <Play className="w-3.5 h-3.5 fill-white" />
                            <span>Watch Class</span>
                          </button>
                        )}

                        {pdfUrl && (
                          <a
                            href={`/pdf?url=${encodeURIComponent(pdfUrl)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center gap-1.5 ${
                              isPdfOnly
                                ? 'px-3.5 py-2 rounded-lg text-xs font-bold bg-pink-600 hover:bg-pink-500 text-white shadow-md shadow-pink-600/30'
                                : 'px-3 py-2 rounded-lg text-xs font-bold bg-zinc-800/90 hover:bg-zinc-700 text-pink-300 border border-pink-500/30'
                            } active:scale-95 transition-all cursor-pointer`}
                          >
                            <FileText className={`w-3.5 h-3.5 ${isPdfOnly ? 'text-white' : 'text-pink-400'}`} />
                            <span>{isPdfOnly ? 'Open PDF' : 'Notes'}</span>
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
