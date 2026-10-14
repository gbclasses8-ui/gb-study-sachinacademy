import React from 'react';
import { Search, GraduationCap, Video, FileText, Send } from 'lucide-react';
import heroImg from '../assets/images/gb_study_hero_banner_1791941312677.jpg';

interface HeroSectionProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenTelegram: () => void;
  batchCount: number;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  searchQuery,
  onSearchChange,
  onOpenTelegram,
  batchCount,
}) => {
  return (
    <section className="relative w-full overflow-hidden border-b border-zinc-800/80 bg-zinc-950">
      {/* Background Graphic with gradient overlay */}
      <div className="absolute inset-0 opacity-25 mix-blend-luminosity">
        <img
          src={heroImg}
          alt="GB STUDY Learning Studio"
          className="w-full h-full object-cover object-center"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent" />
      <div className="absolute inset-0 bg-radial-at-c from-amber-500/10 via-transparent to-transparent pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-12 sm:pt-16 sm:pb-16 flex flex-col items-center text-center">
        {/* Editorial Subtitle */}
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-amber-400 mb-4 tracking-wide uppercase">
          <GraduationCap className="w-4 h-4" />
          <span>India's Leading Free Preparation Portal</span>
          <span className="text-zinc-600">·</span>
          <span>100% Free Batches</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white font-heading tracking-tight max-w-4xl leading-[1.15] text-balance">
          Master Your Teaching Exams with <span className="bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500 bg-clip-text text-transparent">GB STUDY</span>
        </h1>

        {/* Subhead */}
        <p className="mt-4 text-sm sm:text-base text-zinc-400 max-w-2xl leading-relaxed">
          Comprehensive, unlockable courses, live chapter classes, and authentic PDF notes for CTET, KVS, NVS, BPSC TRE, UP SuperTET, and State Teacher Eligibility Tests.
        </p>

        {/* Hero Search Box */}
        <div className="mt-8 w-full max-w-xl">
          <div className="relative flex items-center">
            <Search className="absolute left-4 w-5 h-5 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search batches, e.g. CTET, KVS, BPSC, SuperTET..."
              className="w-full pl-12 pr-4 py-3.5 bg-zinc-900/90 border border-zinc-700/80 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 text-white rounded-2xl text-sm placeholder:text-zinc-500 shadow-xl transition-all outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-4 text-xs text-zinc-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Proof & Feature Strip (single full row below hero) */}
        <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 w-full max-w-4xl text-left">
          <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-400/10 text-amber-400 flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="text-base sm:text-lg font-bold text-white font-mono tabular-nums leading-none">
                {batchCount}+ Batches
              </div>
              <div className="text-[11px] text-zinc-400 mt-1">Teaching & State Exams</div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-400/10 text-amber-400 flex items-center justify-center shrink-0">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <div className="text-base sm:text-lg font-bold text-white font-mono tabular-nums leading-none">
                HD Lectures
              </div>
              <div className="text-[11px] text-zinc-400 mt-1">Chapterwise Classes</div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-400/10 text-amber-400 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="text-base sm:text-lg font-bold text-white font-mono tabular-nums leading-none">
                Official Notes
              </div>
              <div className="text-[11px] text-zinc-400 mt-1">Free PDF Downloads</div>
            </div>
          </div>

          <div 
            onClick={onOpenTelegram}
            className="p-3.5 rounded-xl bg-gradient-to-br from-amber-950/40 to-zinc-900/60 border border-amber-500/30 flex items-center gap-3 cursor-pointer hover:border-amber-400 transition-colors"
          >
            <div className="w-9 h-9 rounded-lg bg-amber-400 text-black flex items-center justify-center shrink-0">
              <Send className="w-4 h-4 transform -rotate-12 translate-x-0.5" />
            </div>
            <div>
              <div className="text-base sm:text-lg font-bold text-amber-400 font-mono tabular-nums leading-none">
                @GBFreestudy
              </div>
              <div className="text-[11px] text-zinc-400 mt-1">Telegram Community</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
