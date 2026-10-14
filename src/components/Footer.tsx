import React from 'react';
import { Send, GraduationCap, ArrowUp } from 'lucide-react';
import { TELEGRAM_URL } from './TelegramModal';

interface FooterProps {
  onOpenTelegram: () => void;
  onNavigateHome: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenTelegram, onNavigateHome }) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="border-t border-zinc-800/80 bg-zinc-950 text-zinc-400 py-12 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        {/* Brand & Purpose */}
        <div className="space-y-3 max-w-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg overflow-hidden border border-amber-500/40 bg-black">
              <img src="/logo.png" alt="GB STUDY" className="w-full h-full object-cover" />
            </div>
            <span className="text-lg font-black text-white font-heading tracking-tight">
              GB <span className="text-amber-400">STUDY</span>
            </span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Free educational portal providing unlockable courses, video lectures, and verified study material for teaching and government examinations across India.
          </p>
        </div>

        {/* Telegram Promotion Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-zinc-900/60 border border-zinc-800 p-4 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-black flex items-center justify-center shrink-0">
              <Send className="w-5 h-5 transform -rotate-12 translate-x-0.5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Join Telegram Channel</h4>
              <p className="text-xs text-zinc-400">Get PDFs & Live Class Links Daily</p>
            </div>
          </div>
          <a
            href={TELEGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-bold text-xs rounded-xl shadow-md transition-all whitespace-nowrap"
          >
            Join @GBFreestudy
          </a>
        </div>

        {/* Quick Links & Back to top */}
        <div className="flex items-center gap-6 text-xs text-zinc-400">
          <button
            onClick={onNavigateHome}
            className="hover:text-amber-400 transition-colors cursor-pointer"
          >
            All Batches
          </button>
          <button
            onClick={onOpenTelegram}
            className="hover:text-amber-400 transition-colors cursor-pointer"
          >
            Telegram
          </button>
          <button
            onClick={scrollToTop}
            className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
          >
            <span>Top</span>
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-400">
        <p>© {new Date().getFullYear()} GB STUDY. Dedicated to free quality education.</p>
        <div className="flex items-center gap-2 text-zinc-400">
          <GraduationCap className="w-4 h-4 text-amber-400" />
          <span>Prepare with Confidence</span>
        </div>
      </div>
    </footer>
  );
};
