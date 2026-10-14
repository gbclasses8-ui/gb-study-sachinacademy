import React from 'react';
import { Send, X, CheckCircle, FileText, Bell, Video } from 'lucide-react';
import telegramBanner from '../assets/images/gb_study_telegram_banner_1791941312650.jpg';

interface TelegramModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TELEGRAM_URL = 'https://t.me/GBFreestudy';

export const TelegramModal: React.FC<TelegramModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleJoin = () => {
    window.open(TELEGRAM_URL, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="telegram-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
    >
      <div 
        className="relative w-full max-w-lg bg-[#121214] border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden text-zinc-100 transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Banner Image */}
        <div className="relative h-44 sm:h-48 w-full overflow-hidden bg-zinc-950">
          <img
            src={telegramBanner}
            alt="GB STUDY Telegram Channel"
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#121214] via-[#121214]/40 to-transparent" />
          
          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 hover:bg-black/90 text-zinc-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Telegram badge */}
          <div className="absolute bottom-3 left-5 flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg text-black">
              <Send className="w-5 h-5 transform -rotate-12 translate-x-0.5" />
            </div>
            <div>
              <span className="text-xs uppercase tracking-wider font-semibold text-amber-400">Official Channel</span>
              <p className="text-sm font-bold text-white tracking-wide">@GBFreestudy</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4">
          <div>
            <h2 id="telegram-modal-title" className="text-xl sm:text-2xl font-bold font-heading text-white">
              Join GB STUDY Telegram Channel
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 leading-relaxed">
              Never miss a class! Get instant access to daily live lecture links, complete PDF notes, question banks, and batch announcements directly on Telegram.
            </p>
          </div>

          {/* Highlights */}
          <div className="grid grid-cols-2 gap-2.5 py-1 text-xs text-zinc-300">
            <div className="flex items-center gap-2 bg-zinc-900/80 border border-zinc-800 rounded-lg p-2.5">
              <FileText className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Daily Class Notes PDFs</span>
            </div>
            <div className="flex items-center gap-2 bg-zinc-900/80 border border-zinc-800 rounded-lg p-2.5">
              <Video className="w-4 h-4 text-amber-400 shrink-0" />
              <span>New Batch Lectures</span>
            </div>
            <div className="flex items-center gap-2 bg-zinc-900/80 border border-zinc-800 rounded-lg p-2.5">
              <Bell className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Exam Alerts & Updates</span>
            </div>
            <div className="flex items-center gap-2 bg-zinc-900/80 border border-zinc-800 rounded-lg p-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>100% Free Forever</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={handleJoin}
              className="flex-1 flex items-center justify-center gap-2.5 py-3 px-5 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Join Telegram</span>
            </button>
            <button
              onClick={onClose}
              className="py-3 px-5 rounded-xl font-semibold text-sm bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 active:scale-[0.98] transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
