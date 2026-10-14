import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { BatchCard } from './components/BatchCard';
import { CourseView } from './components/CourseView';
import { VideoPlayerModal } from './components/VideoPlayerModal';
import { PdfViewerModal } from './components/PdfViewerModal';
import { TelegramModal } from './components/TelegramModal';
import { SearchModal } from './components/SearchModal';
import { MobileNav } from './components/MobileNav';
import { Footer } from './components/Footer';
import { Batch, Lecture, ViewMode } from './types';
import { getBatches, categorizeBatch } from './services/api';
import { Bookmark, Sparkles, AlertCircle } from 'lucide-react';

const CATEGORIES = ['All', 'CTET', 'KVS & NVS', 'BPSC TRE', 'UP Teaching', 'State TET'];

export default function App() {
  const [batches] = useState<Batch[]>(() => getBatches());
  const [currentView, setCurrentView] = useState<ViewMode>('home');
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Enrollments persisted in localStorage
  const [enrollments, setEnrollments] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('gb_study_enrollments');
      if (stored) return JSON.parse(stored);
      // Also check old studybee_wishlist if user had previous storage
      const oldStored = localStorage.getItem('studybee_wishlist');
      if (oldStored) return JSON.parse(oldStored);
    } catch (e) {
      console.warn('Error reading enrollments from storage', e);
    }
    return [];
  });

  // Telegram Popup Modal - opens on initial website load per requirements
  const [isTelegramOpen, setIsTelegramOpen] = useState<boolean>(true);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);

  // Active Video Player modal
  const [activeVideo, setActiveVideo] = useState<{
    courseId: string;
    lecture: Lecture;
    playlist: Lecture[];
  } | null>(null);

  // Active PDF Viewer modal
  const [activePdf, setActivePdf] = useState<{ url: string; title: string } | null>(null);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2500);
  }, []);

  // Save enrollments
  useEffect(() => {
    try {
      localStorage.setItem('gb_study_enrollments', JSON.stringify(enrollments));
    } catch (e) {
      console.warn('Error saving enrollments', e);
    }
  }, [enrollments]);

  // Handle URL parameters for direct batch / video linking
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id') || params.get('course_id');
    const videoId = params.get('video_id');

    if (id) {
      const b = batches.find((item) => String(item.id) === String(id));
      if (b) {
        setSelectedBatch(b);
        setCurrentView('course');

        if (videoId) {
          setActiveVideo({
            courseId: id,
            lecture: { id: videoId, Title: 'Video Class' },
            playlist: [],
          });
        }
      }
    }
  }, [batches]);

  // Keyboard shortcut for search (Cmd+K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Toggle batch enrollment
  const handleToggleEnroll = (batchId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const idStr = String(batchId);
    setEnrollments((prev) => {
      const exists = prev.includes(idStr);
      if (exists) {
        showToast('Removed from your enrollments');
        return prev.filter((id) => id !== idStr);
      } else {
        showToast('Successfully enrolled in batch! Access anytime in My Enrollments.');
        return [...prev, idStr];
      }
    });
  };

  // Open batch course view
  const handleSelectBatch = (batch: Batch) => {
    setSelectedBatch(batch);
    setCurrentView('course');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const url = new URL(window.location.href);
    url.searchParams.set('id', batch.id);
    window.history.pushState({}, '', url.toString());
  };

  // Back to batches view
  const handleBackToBatches = () => {
    setSelectedBatch(null);
    setCurrentView('home');
    const url = new URL(window.location.href);
    url.searchParams.delete('id');
    window.history.pushState({}, '', url.toString());
  };

  // Filter batches by category and search
  const filteredBatches = useMemo(() => {
    return batches.filter((batch) => {
      const matchesCategory =
        selectedCategory === 'All' || categorizeBatch(batch.title) === selectedCategory;
      const matchesSearch =
        !searchQuery.trim() ||
        batch.title.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        batch.id.includes(searchQuery.trim());

      return matchesCategory && matchesSearch;
    });
  }, [batches, selectedCategory, searchQuery]);

  // Enrolled batches
  const enrolledBatches = useMemo(() => {
    return batches.filter((b) => enrollments.includes(String(b.id)));
  }, [batches, enrollments]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 flex flex-col font-sans selection:bg-amber-400 selection:text-black">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#18181b] border border-amber-400/40 text-white px-5 py-2.5 rounded-full shadow-2xl text-xs sm:text-sm font-semibold flex items-center gap-2 animate-fade-in"
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navbar */}
      <Navbar
        currentView={currentView}
        onNavigate={(view) => {
          if (view === 'home') setSelectedBatch(null);
          setCurrentView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        enrollmentCount={enrollments.length}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenTelegram={() => setIsTelegramOpen(true)}
      />

      {/* Main Content Areas */}
      <main className="flex-1">
        {currentView === 'course' && selectedBatch ? (
          <CourseView
            batch={selectedBatch}
            onBackToBatches={handleBackToBatches}
            onOpenVideo={(lecture, playlist) =>
              setActiveVideo({
                courseId: selectedBatch.id,
                lecture,
                playlist,
              })
            }
            onOpenPdf={(url, title) => setActivePdf({ url, title })}
            isEnrolled={enrollments.includes(String(selectedBatch.id))}
            onToggleEnroll={handleToggleEnroll}
          />
        ) : currentView === 'enrollments' ? (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-zinc-800">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white font-heading">
                  My Enrolled Batches
                </h1>
                <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                  Batches saved for your ongoing study preparation.
                </p>
              </div>
              <button
                onClick={() => setCurrentView('home')}
                className="self-start sm:self-auto px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
              >
                Browse All Batches
              </button>
            </div>

            {enrolledBatches.length === 0 ? (
              <div className="py-20 text-center bg-zinc-900/30 rounded-3xl border border-zinc-800/80 p-8 max-w-xl mx-auto">
                <Bookmark className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-white mb-1">No Batches Enrolled Yet</h3>
                <p className="text-xs sm:text-sm text-zinc-400 mb-6">
                  Click the "+ ENROLL" button on any batch to save it here for fast, one-click access.
                </p>
                <button
                  onClick={() => setCurrentView('home')}
                  className="px-5 py-2.5 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-pink-600/30 transition-transform active:scale-95 cursor-pointer"
                >
                  Explore Free Batches
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {enrolledBatches.map((batch) => (
                  <BatchCard
                    key={batch.id}
                    batch={batch}
                    isEnrolled={true}
                    onToggleEnroll={handleToggleEnroll}
                    onSelectBatch={handleSelectBatch}
                  />
                ))}
              </div>
            )}
          </section>
        ) : (
          /* Home View */
          <div>
            {/* Hero Section with Search */}
            <HeroSection
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onOpenTelegram={() => setIsTelegramOpen(true)}
              batchCount={batches.length}
            />

            {/* Batches Catalog Section */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
              <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-6">
                <div>
                  <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold mb-1">
                    <span>Curated Batches</span>
                    <span className="text-zinc-600">·</span>
                    <span className="font-mono tabular-nums">{filteredBatches.length} Available</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white font-heading">
                    Explore Preparation Batches
                  </h2>
                </div>

                {/* Category Filter Tabs (Interactive Filter Controls as functional buttons) */}
                <div className="flex items-center gap-1.5 p-1 bg-zinc-900 border border-zinc-800 rounded-xl overflow-x-auto max-w-full hide-scrollbar">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        selectedCategory === cat
                          ? 'bg-amber-400 text-black shadow-sm'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Batches Grid */}
              {filteredBatches.length === 0 ? (
                <div className="py-20 text-center bg-zinc-900/30 rounded-3xl border border-zinc-800/80 p-8">
                  <AlertCircle className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
                  <h3 className="text-base font-bold text-white mb-1">No Batches Found</h3>
                  <p className="text-xs text-zinc-400 mb-4">
                    No batches match your selected category or query "{searchQuery}".
                  </p>
                  <button
                    onClick={() => {
                      setSelectedCategory('All');
                      setSearchQuery('');
                    }}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl cursor-pointer"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {filteredBatches.map((batch) => (
                    <BatchCard
                      key={batch.id}
                      batch={batch}
                      isEnrolled={enrollments.includes(String(batch.id))}
                      onToggleEnroll={handleToggleEnroll}
                      onSelectBatch={handleSelectBatch}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer
        onOpenTelegram={() => setIsTelegramOpen(true)}
        onNavigateHome={() => {
          setSelectedBatch(null);
          setCurrentView('home');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Mobile Navigation Bar */}
      <MobileNav
        currentView={currentView}
        onNavigate={(view) => {
          if (view === 'home') setSelectedBatch(null);
          setCurrentView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        enrollmentCount={enrollments.length}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenTelegram={() => setIsTelegramOpen(true)}
      />

      {/* Telegram Popup Modal (per requirements) */}
      <TelegramModal
        isOpen={isTelegramOpen}
        onClose={() => setIsTelegramOpen(false)}
      />

      {/* Global Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        batches={batches}
        onSelectBatch={handleSelectBatch}
        onOpenVideo={(courseId, lecture) => {
          setActiveVideo({
            courseId,
            lecture,
            playlist: [],
          });
        }}
      />

      {/* Video Player Modal */}
      {activeVideo && (
        <VideoPlayerModal
          courseId={activeVideo.courseId}
          lecture={activeVideo.lecture}
          onClose={() => setActiveVideo(null)}
          onOpenPdf={(url, title) => setActivePdf({ url, title })}
          playlist={activeVideo.playlist}
          onSelectLecture={(newLecture) =>
            setActiveVideo({
              ...activeVideo,
              lecture: newLecture,
            })
          }
        />
      )}

      {/* Notes & PDF Viewer Modal */}
      {activePdf && (
        <PdfViewerModal
          pdfUrl={activePdf.url}
          title={activePdf.title}
          onClose={() => setActivePdf(null)}
        />
      )}
    </div>
  );
}
