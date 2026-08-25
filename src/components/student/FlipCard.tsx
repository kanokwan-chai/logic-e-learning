'use client';

import { useState } from 'react';
import { HelpCircle, RefreshCw } from 'lucide-react';

interface FlipCardProps {
  title: string;
  front: string;
  back: string;
}

export default function FlipCard({ title, front, back }: FlipCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div
      onClick={() => setIsFlipped(!isFlipped)}
      className="my-4 cursor-pointer perspective group"
    >
      <div
        className={`w-full min-h-[140px] p-6 rounded-3xl transition-all duration-500 transform-style-3d border ${
          isFlipped
            ? 'bg-gradient-to-br from-primary-light to-white border-primary/30 shadow-soft-md'
            : 'bg-white border-slate-200/80 shadow-soft-sm hover:border-primary/50'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-primary flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-primary" /> {title}
          </span>
          <span className="text-[10px] text-slate-400 flex items-center gap-1 group-hover:text-primary">
            <RefreshCw className="w-3 h-3 animate-spin-slow" /> พลิกการ์ด
          </span>
        </div>

        <div className="mt-3">
          {!isFlipped ? (
            <p className="text-sm font-semibold text-slate-800 leading-relaxed">{front}</p>
          ) : (
            <div className="animate-in fade-in zoom-in-95 duration-300">
              <p className="text-sm font-medium text-slate-700 leading-relaxed bg-white/80 p-3 rounded-2xl border border-primary/20">
                💡 {back}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
