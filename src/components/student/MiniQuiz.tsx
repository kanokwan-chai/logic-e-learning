'use client';

import { useState } from 'react';
import { CheckCircle2, XCircle, HelpCircle } from 'lucide-react';

interface MiniQuizProps {
  title: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export default function MiniQuiz({ title, options, correctIndex, explanation }: MiniQuizProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const isSubmitted = selectedIndex !== null;
  const isCorrect = selectedIndex === correctIndex;

  return (
    <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-soft-sm my-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="p-1.5 rounded-xl bg-accent text-amber-800">
          <HelpCircle className="w-4 h-4" />
        </span>
        <h4 className="font-bold text-sm text-slate-800">{title}</h4>
      </div>

      <div className="space-y-2.5 mt-4">
        {options.map((opt, idx) => {
          const isSelected = selectedIndex === idx;
          const isThisCorrect = idx === correctIndex;

          let btnStyle = 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700';
          if (isSubmitted) {
            if (isThisCorrect) {
              btnStyle = 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold';
            } else if (isSelected) {
              btnStyle = 'bg-rose-50 border-rose-300 text-rose-800 font-bold';
            }
          }

          return (
            <button
              key={idx}
              disabled={isSubmitted}
              onClick={() => setSelectedIndex(idx)}
              className={`w-full text-left p-3.5 rounded-2xl border text-xs font-medium transition-all flex items-center justify-between ${btnStyle}`}
            >
              <span>{opt}</span>
              {isSubmitted && isThisCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 ml-2" />}
              {isSubmitted && isSelected && !isThisCorrect && <XCircle className="w-4 h-4 text-rose-500 shrink-0 ml-2" />}
            </button>
          );
        })}
      </div>

      {isSubmitted && (
        <div className={`mt-4 p-4 rounded-2xl text-xs leading-relaxed border ${isCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'}`}>
          <p className="font-bold flex items-center gap-1.5 mb-1">
            {isCorrect ? '✨ คำตอบถูกต้อง!' : '❌ ยังไม่ถูกต้อง'}
          </p>
          <p className="text-[11px] opacity-90">💡 คำอธิบาย: {explanation}</p>
        </div>
      )}
    </div>
  );
}
