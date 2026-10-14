import React from 'react';
import { Search, Bookmark, Send, Sparkles } from 'lucide-react';
import { ViewMode } from '../types';

interface NavbarProps {
  currentView: ViewMode;
  onNavigate: (view: ViewMode) => void;
  enrollmentCount: number;
  onOpenSearch: () => void;
  onOpenTelegram: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  enrollmentCount,
  onOpenSearch,
  onOpenTelegram,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-[#0a0a0a]/90 backdrop-blur-md border-b border-zinc-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-6 sm:gap-8">
        {/* Zone 1: Brand Wordmark */}
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-3 text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-lg shrink-0 cursor-pointer"
        >
          <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden border border-amber-500/40 shadow-md shadow-amber-500/10 group-hover:scale-105 transition-transform bg-zinc-950">
            <img
              src="/logo.png"
              alt="GB STUDY Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-lg sm:text-xl font-black tracking-tight text-white font-heading whitespace-nowrap flex items-center gap-1.5">
              GB <span className="text-amber-400">STUDY</span>
            </span>
          </div>
        </button>

        {/* Zone 2: Navigation Links (single-line, clean typography) */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-300">
          <button
            onClick={() => onNavigate('home')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer ${
              currentView === 'home'
                ? 'text-amber-400 font-semibold'
                : 'hover:text-white'
            }`}
          >
            All Batches
          </button>

          <button
            onClick={() => onNavigate('enrollments')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 flex items-center gap-2 cursor-pointer ${
              currentView === 'enrollments'
                ? 'text-amber-400 font-semibold'
                : 'hover:text-white'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>My Enrollments</span>
            {enrollmentCount > 0 && (
              <span className="px-1.5 py-0.5 text-xs font-bold bg-amber-400 text-black rounded-full font-mono tabular-nums leading-none">
                {enrollmentCount}
              </span>
            )}
          </button>

          <button
            onClick={onOpenTelegram}
            className="whitespace-nowrap shrink-0 text-zinc-300 hover:text-amber-400 transition-colors py-1 flex items-center gap-1.5 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5 text-amber-400" />
            <span>Telegram Channel</span>
          </button>
        </nav>

        {/* Zone 3: Search & Primary Action */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <button
            onClick={onOpenSearch}
            aria-label="Search courses and classes"
            className="p-2 sm:px-3 sm:py-2 text-zinc-400 hover:text-white bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 rounded-xl transition-colors flex items-center gap-2 text-xs cursor-pointer"
          >
            <Search className="w-4 h-4 text-zinc-400" />
            <span className="hidden sm:inline text-zinc-400">Search batches...</span>
            <kbd className="hidden lg:inline px-1.5 py-0.5 text-[10px] font-mono bg-zinc-800 text-zinc-400 rounded border border-zinc-700">⌘K</kbd>
          </button>

          <button
            onClick={onOpenTelegram}
            className="flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-bold text-black bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 rounded-xl shadow-md shadow-amber-500/10 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden xs:inline">Join Free</span>
            <span>Telegram</span>
          </button>
        </div>
      </div>
    </header>
  );
};
