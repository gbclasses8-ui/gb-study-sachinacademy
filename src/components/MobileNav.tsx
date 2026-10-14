import React from 'react';
import { LayoutGrid, Bookmark, Search, Send } from 'lucide-react';
import { ViewMode } from '../types';

interface MobileNavProps {
  currentView: ViewMode;
  onNavigate: (view: ViewMode) => void;
  enrollmentCount: number;
  onOpenSearch: () => void;
  onOpenTelegram: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  currentView,
  onNavigate,
  enrollmentCount,
  onOpenSearch,
  onOpenTelegram,
}) => {
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#0a0a0a]/95 backdrop-blur-lg border-t border-zinc-800/80 px-2 py-1.5 flex items-center justify-around h-14">
      {/* Batches */}
      <button
        onClick={() => onNavigate('home')}
        className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer ${
          currentView === 'home' ? 'text-amber-400 font-bold' : 'text-zinc-400 hover:text-white'
        }`}
      >
        <LayoutGrid className="w-5 h-5" />
        <span className="text-[10px] mt-0.5">Batches</span>
      </button>

      {/* Enrollments */}
      <button
        onClick={() => onNavigate('enrollments')}
        className={`relative flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer ${
          currentView === 'enrollments' ? 'text-amber-400 font-bold' : 'text-zinc-400 hover:text-white'
        }`}
      >
        <div className="relative">
          <Bookmark className="w-5 h-5" />
          {enrollmentCount > 0 && (
            <span className="absolute -top-1 -right-2 px-1 text-[9px] font-bold bg-amber-400 text-black rounded-full leading-tight font-mono">
              {enrollmentCount}
            </span>
          )}
        </div>
        <span className="text-[10px] mt-0.5">Enrolled</span>
      </button>

      {/* Search */}
      <button
        onClick={onOpenSearch}
        className="flex flex-col items-center justify-center flex-1 py-1 text-zinc-400 hover:text-white transition-colors cursor-pointer"
      >
        <Search className="w-5 h-5" />
        <span className="text-[10px] mt-0.5">Search</span>
      </button>

      {/* Telegram */}
      <button
        onClick={onOpenTelegram}
        className="flex flex-col items-center justify-center flex-1 py-1 text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
      >
        <Send className="w-5 h-5" />
        <span className="text-[10px] mt-0.5 font-semibold">Telegram</span>
      </button>
    </nav>
  );
};
