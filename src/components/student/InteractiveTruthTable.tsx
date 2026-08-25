'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, RotateCcw, Sparkles } from 'lucide-react';

interface RowState {
  p: boolean;
  q: boolean;
  userAnswer: boolean | null;
}

export default function InteractiveTruthTable() {
  const [rows, setRows] = useState<RowState[]>([
    { p: true, q: true, userAnswer: null },
    { p: true, q: false, userAnswer: null },
    { p: false, q: true, userAnswer: null },
    { p: false, q: false, userAnswer: null },
  ]);

  const [submitted, setSubmitted] = useState(false);

  const toggleAnswer = (index: number) => {
    if (submitted) return;
    const updated = [...rows];
    const current = updated[index].userAnswer;
    updated[index].userAnswer = current === null ? true : current === true ? false : null;
    setRows(updated);
  };

  const resetTable = () => {
    setRows(rows.map((r) => ({ ...r, userAnswer: null })));
    setSubmitted(false);
  };

  // Expected answer for p AND q (p ∧ q)
  const isCorrect = (r: RowState) => r.userAnswer === (r.p && r.q);

  const allFilled = rows.every((r) => r.userAnswer !== null);
  const totalCorrect = rows.filter(isCorrect).length;

  return (
    <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-soft-sm my-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" /> ตารางค่าความจริงเชิงโต้ตอบ: p ∧ q (p และ q)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">คลิกที่ช่องในคอลัมน์ผลลัพธ์เพื่อเลือก T (จริง) หรือ F (เท็จ)</p>
        </div>
        <button
          onClick={resetTable}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          title="รีเซ็ต"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-center text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-700 border-b border-slate-200">
              <th className="py-3 px-4 rounded-tl-xl font-bold">p</th>
              <th className="py-3 px-4 font-bold">q</th>
              <th className="py-3 px-4 rounded-tr-xl font-bold text-primary">p ∧ q (และ)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row, idx) => {
              const correct = submitted && isCorrect(row);

              return (
                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold">{row.p ? 'T (1)' : 'F (0)'}</td>
                  <td className="py-3 px-4 font-mono font-bold">{row.q ? 'T (1)' : 'F (0)'}</td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => toggleAnswer(idx)}
                      className={`px-4 py-2 rounded-xl font-mono font-bold text-xs transition-all border ${
                        row.userAnswer === null
                          ? 'bg-slate-100 text-slate-400 border-dashed border-slate-300 hover:border-primary hover:text-primary'
                          : row.userAnswer
                          ? 'bg-emerald-500 text-white border-emerald-600 shadow-soft-sm'
                          : 'bg-rose-500 text-white border-rose-600 shadow-soft-sm'
                      }`}
                    >
                      {row.userAnswer === null ? '? เลือก' : row.userAnswer ? 'T (จริง)' : 'F (เท็จ)'}
                    </button>

                    {submitted && (
                      <span className="inline-block ml-2 align-middle">
                        {correct ? (
                          <CheckCircle className="w-4 h-4 text-emerald-500 inline" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-500 inline" />
                        )}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <button
          disabled={!allFilled || submitted}
          onClick={() => setSubmitted(true)}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
            !allFilled
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : submitted
              ? 'bg-emerald-100 text-emerald-700 cursor-default'
              : 'bg-primary text-white hover:bg-primary-hover shadow-soft-sm'
          }`}
        >
          {submitted ? `ตรวจคำตอบแล้ว (${totalCorrect}/4 ถูกต้อง)` : 'ตรวจสอบคำตอบ'}
        </button>

        {submitted && totalCorrect === 4 && (
          <p className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 animate-bounce">
            🎉 ยอดเยี่ยมมาก! คุณไขรหัสตารางค่าความจริงได้ถูกต้อง 100%
          </p>
        )}
      </div>
    </div>
  );
}
