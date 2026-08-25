'use client';

import { useState } from 'react';
import { MessageSquarePlus, Check } from 'lucide-react';

interface ReflectionBoxProps {
  question: string;
}

export default function ReflectionBox({ question }: ReflectionBoxProps) {
  const [answer, setAnswer] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (!answer.trim()) return;
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="p-6 rounded-3xl bg-secondary-light/40 border border-secondary/40 my-6">
      <div className="flex items-center gap-2 mb-2">
        <MessageSquarePlus className="w-4 h-4 text-primary" />
        <h4 className="font-bold text-xs text-slate-800">คำถามชวนคิด (Reflection Question)</h4>
      </div>

      <p className="text-xs font-semibold text-slate-700 mb-3">{question}</p>

      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="พิมพ์มุมมองหรือคำตอบเชิงวิเคราะห์ของคุณที่นี่..."
        rows={3}
        className="w-full p-3.5 rounded-2xl bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all resize-none"
      />

      <div className="mt-3 flex justify-end">
        <button
          onClick={handleSave}
          disabled={!answer.trim()}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            saved
              ? 'bg-emerald-500 text-white'
              : !answer.trim()
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-primary text-white hover:bg-primary-hover shadow-soft-sm'
          }`}
        >
          {saved ? (
            <>
              <Check className="w-3.5 h-3.5" /> บันทึกแล้ว
            </>
          ) : (
            'ส่งสะท้อนความคิด'
          )}
        </button>
      </div>
    </div>
  );
}
