import React, { useState } from 'react';
import { ArrowRight, Check, Plus, BookOpen } from 'lucide-react';
import { Batch } from '../types';
import { categorizeBatch } from '../services/api';

interface BatchCardProps {
  batch: Batch;
  isEnrolled: boolean;
  onToggleEnroll: (id: string, e: React.MouseEvent) => void;
  onSelectBatch: (batch: Batch) => void;
}

export const BatchCard: React.FC<BatchCardProps> = ({
  batch,
  isEnrolled,
  onToggleEnroll,
  onSelectBatch,
}) => {
  const [imgError, setImgError] = useState(false);
  const category = categorizeBatch(batch.title);

  return (
    <div
      onClick={() => onSelectBatch(batch)}
      className="group relative flex flex-col bg-[#121214] border border-zinc-800/80 hover:border-amber-400/50 rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/50 cursor-pointer text-left"
    >
      {/* Thumbnail Container (16:9 ratio) */}
      <div className="relative w-full aspect-video overflow-hidden bg-zinc-950 border-b border-zinc-800/60">
        {!imgError && batch.thumbnail ? (
          <img
            src={batch.thumbnail}
            alt={batch.title}
            onError={() => setImgError(true)}
            referrerPolicy="no-referrer"
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-95 group-hover:opacity-100"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-zinc-900 to-zinc-950 p-4 text-center">
            <BookOpen className="w-10 h-10 text-amber-400/60 mb-2" />
            <span className="text-xs font-semibold text-zinc-400">{category} Batch</span>
          </div>
        )}

        {/* Scrim Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#121214] via-transparent to-transparent opacity-80" />

        {/* Free Tag */}
        <div className="absolute top-3 right-3 bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-black tracking-widest uppercase text-emerald-400 shadow-sm">
          FREE BATCH
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 sm:p-5 flex flex-col flex-1">
        {/* Unboxed Metadata (Zero-Pill discipline) */}
        <div className="flex items-center gap-2 text-xs text-zinc-400 mb-2">
          <span className="text-amber-400 font-semibold">{category}</span>
          <span aria-hidden="true" className="text-zinc-600">·</span>
          <span>Batch #{batch.id}</span>
          <span aria-hidden="true" className="text-zinc-600">·</span>
          <span>Full Syllabus</span>
        </div>

        {/* Title */}
        <h3 className="text-sm sm:text-base font-bold text-zinc-100 leading-snug line-clamp-2 group-hover:text-amber-300 transition-colors mb-4">
          {batch.title}
        </h3>

        {/* Actions Row */}
        <div className="mt-auto pt-3.5 border-t border-zinc-800/80 flex items-center justify-between gap-2">
          {/* Enroll Button in Pink */}
          <button
            onClick={(e) => onToggleEnroll(batch.id, e)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95 ${
              isEnrolled
                ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40 hover:bg-pink-500/30'
                : 'bg-pink-600 hover:bg-pink-500 text-white shadow-md shadow-pink-600/30'
            }`}
          >
            {isEnrolled ? (
              <>
                <Check className="w-3.5 h-3.5 text-pink-300" />
                <span>ENROLLED</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>ENROLL</span>
              </>
            )}
          </button>

          {/* Let's Study Button in Pink */}
          <button
            onClick={() => onSelectBatch(batch)}
            className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors active:scale-95 shadow-md shadow-pink-500/30 cursor-pointer"
          >
            <span>Let's Study</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};
