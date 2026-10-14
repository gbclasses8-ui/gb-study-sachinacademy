import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, X, BookOpen, Play, ChevronRight } from 'lucide-react';
import { Batch, Lecture } from '../types';
import rawPreload from '../data/preloaded_courses.json';
import { categorizeBatch } from '../services/api';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  batches: Batch[];
  onSelectBatch: (batch: Batch) => void;
  onOpenVideo: (courseId: string, lecture: Lecture) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  batches,
  onSelectBatch,
  onOpenVideo,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Precomputed index of all preloaded lectures
  const allLecturesWithCourse = useMemo(() => {
    const list: { courseId: string; lecture: Lecture; courseTitle: string }[] = [];
    const cache = rawPreload as any;
    if (cache.lectures) {
      Object.entries(cache.lectures).forEach(([key, lecs]: [string, any]) => {
        const parts = key.split('_');
        const courseId = parts[0];
        const parentBatch = batches.find((b) => b.id === courseId);
        const courseTitle = parentBatch?.title || `Batch #${courseId}`;
        if (Array.isArray(lecs)) {
          lecs.forEach((lec) => {
            list.push({ courseId, lecture: lec, courseTitle });
          });
        }
      });
    }
    return list;
  }, [batches]);

  const filteredBatches = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return batches.filter(
      (b) => b.title.toLowerCase().includes(q) || b.id.includes(q)
    );
  }, [batches, query]);

  const filteredLectures = useMemo(() => {
    if (!query.trim() || query.length < 2) return [];
    const q = query.toLowerCase().trim();
    return allLecturesWithCourse
      .filter((item) => {
        const title = (item.lecture.Title || item.lecture.title || '').toLowerCase();
        return title.includes(q);
      })
      .slice(0, 8);
  }, [allLecturesWithCourse, query]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search"
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/80 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[#121214] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-4 border-b border-zinc-800 flex items-center gap-3 bg-zinc-950">
          <Search className="w-5 h-5 text-amber-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search batches, subjects, and video classes..."
            className="w-full bg-transparent text-white placeholder:text-zinc-500 text-sm sm:text-base outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-full text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2.5 py-1 text-xs text-zinc-400 hover:text-white border border-zinc-800 rounded-lg"
          >
            Esc
          </button>
        </div>

        {/* Results Area */}
        <div className="overflow-y-auto p-4 space-y-5">
          {!query.trim() && (
            <div className="py-8 text-center text-xs text-zinc-400">
              <p>Type to search across all 20+ GB STUDY batches, subjects, and video classes.</p>
              <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
                {['CTET 2026', 'KVS PRT', 'BPSC TRE', 'UP SuperTET', 'CDP', 'Hindi'].map((term) => (
                  <button
                    key={term}
                    onClick={() => setQuery(term)}
                    className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-amber-400 hover:border-amber-400/30 text-xs transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Batches Section */}
          {filteredBatches.length > 0 && (
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 mb-2 block">
                Batches ({filteredBatches.length})
              </span>
              <div className="space-y-2">
                {filteredBatches.map((b) => (
                  <div
                    key={b.id}
                    onClick={() => {
                      onSelectBatch(b);
                      onClose();
                    }}
                    className="p-3 rounded-xl bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800 hover:border-amber-400/40 flex items-center justify-between gap-3 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-8 rounded-lg overflow-hidden bg-black shrink-0">
                        <img
                          src={b.thumbnail}
                          alt={b.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-amber-300">
                          {b.title}
                        </h4>
                        <div className="text-[11px] text-zinc-400">
                          <span>{categorizeBatch(b.title)}</span>
                          <span className="mx-1">·</span>
                          <span>Batch #{b.id}</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-amber-400 shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lectures Section */}
          {filteredLectures.length > 0 && (
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 mb-2 block">
                Video Classes ({filteredLectures.length})
              </span>
              <div className="space-y-2">
                {filteredLectures.map((item) => (
                  <div
                    key={item.lecture.id}
                    onClick={() => {
                      onOpenVideo(item.courseId, item.lecture);
                      onClose();
                    }}
                    className="p-3 rounded-xl bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800 hover:border-amber-400/40 flex items-center justify-between gap-3 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-amber-400/10 text-amber-400 flex items-center justify-center shrink-0">
                        <Play className="w-4 h-4 fill-amber-400" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-amber-300">
                          {item.lecture.Title || item.lecture.title}
                        </h4>
                        <p className="text-[11px] text-zinc-400 truncate">
                          In {item.courseTitle}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-amber-400 shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {query.trim() && filteredBatches.length === 0 && filteredLectures.length === 0 && (
            <div className="py-12 text-center text-zinc-400 text-sm">
              <BookOpen className="w-8 h-8 mx-auto text-zinc-600 mb-2" />
              <p>No matching courses or lectures found for "{query}".</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
