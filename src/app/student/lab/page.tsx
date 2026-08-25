'use client';
import { useStudentAuth } from '@/lib/hooks/useStudentAuth';

import { useState } from 'react';
import StudentSidebar from '@/components/layout/StudentSidebar';
import { useLabs } from '@/lib/hooks/useSupabaseContent';
import { useLearningStore } from '@/lib/store/useLearningStore';
import { FlaskConical, CheckCircle2, XCircle, Sparkles, Info, ArrowRight, Loader2 } from 'lucide-react';

export default function LogicalLabPage() {
  useStudentAuth();
  const { saveLabResult } = useLearningStore();
  const { labs: MOCK_LABS, loading } = useLabs();
  // Map useContentStore LabItem format to lab page format
  const labsFormatted = MOCK_LABS.map((l) => ({
    id: l.id,
    lab_code: l.lab_code,
    title: l.title,
    difficulty: l.difficulty,
    config: {
      scenario: l.scenario_text,
      puzzle: l.scenario_text,
      options: l.options,
      correct: l.correct_index,
      explanation: l.explanation,
    },
  }));

  const [activeLabIndex, setActiveLabIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const currentLab = labsFormatted[activeLabIndex];

  const handleSelectOption = (idx: number) => {
    if (isSubmitted) return;
    setSelectedOption(idx);
  };

  const handleCheckAnswer = () => {
    if (!currentLab) return;
    setIsSubmitted(true);
    const isCorrect = selectedOption === currentLab.config.correct;

    saveLabResult(currentLab.id, {
      id: `labres-${Date.now()}`,
      user_id: 's-001',
      lab_id: currentLab.id,
      score: isCorrect ? 100 : 0,
      time_spent_sec: 0,
      attempts: 1,
      completed: true,
    });
  };

  const handleNextLab = () => {
    setIsSubmitted(false);
    setSelectedOption(null);
    setActiveLabIndex((prev) => (prev + 1) % labsFormatted.length);
  };

  const isCorrect = currentLab ? selectedOption === currentLab.config.correct : false;

  return (
    <div className="min-h-screen md:flex md:h-screen bg-[#F8FAFC] md:overflow-hidden font-sans">
      <StudentSidebar />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-soft-sm flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
              <FlaskConical className="w-6 h-6 text-primary" /> Logical Thinking Lab
            </h1>
            <p className="text-xs text-slate-500 mt-1">ฝึกฝนความคิดเชิงตรรกะผ่านสถานการณ์จำลองและปริศนา</p>
          </div>
          <span className="px-3 py-1 rounded-full bg-accent text-amber-900 font-bold text-xs">
            ฐานที่ {labsFormatted.length > 0 ? activeLabIndex + 1 : 0}/{labsFormatted.length}
          </span>
        </div>

        {/* No Labs State */}
        {loading ? (
          <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : labsFormatted.length === 0 && (
          <div className="p-8 rounded-4xl bg-amber-50 border-2 border-amber-200 flex items-start gap-3 text-xs text-amber-900">
            <Info className="w-5 h-5 shrink-0 mt-0.5 text-amber-500" />
            <div>
              <p className="font-extrabold">ยังไม่มีกิจกรรม Lab ในระบบ</p>
              <p className="font-medium mt-0.5 opacity-80">
                ส่งโจทย์ปริศนาหรือสถานการณ์จำลองมาให้ผม แล้วจะเพิ่มเข้าในระบบให้ทันที
              </p>
            </div>
          </div>
        )}

        {/* Active Lab */}
        {currentLab && (
          <div className="p-6 sm:p-8 rounded-4xl bg-white border border-slate-100 shadow-soft-lg space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 flex-wrap gap-2">
              <div>
                <span className="text-[10px] font-mono font-bold bg-primary-light text-primary px-2.5 py-1 rounded-full">
                  {currentLab.lab_code}
                </span>
                <h2 className="text-lg font-extrabold text-slate-800 mt-1">{currentLab.title}</h2>
              </div>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-xl">
                ระดับ: {currentLab.difficulty}
              </span>
            </div>

            {/* Scenario / Puzzle */}
            <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200/80 space-y-2">
              <h3 className="font-bold text-xs text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary" /> โจทย์สืบสวนเชิงตรรกะ
              </h3>
              <p className="text-sm font-semibold text-slate-800 leading-relaxed whitespace-pre-line">
                {currentLab.config.scenario || currentLab.config.puzzle}
              </p>
            </div>

            {/* Options */}
            <div className="space-y-3">
              <h3 className="font-bold text-xs text-slate-700">เลือกข้อสรุปทางตรรกศาสตร์ที่ถูกต้อง:</h3>
              {currentLab.config.options?.map((opt: string, idx: number) => {
                const isSelected = selectedOption === idx;
                const isThisCorrect = idx === currentLab.config.correct;

                let style = 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700';
                if (isSubmitted) {
                  if (isThisCorrect) style = 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold';
                  else if (isSelected) style = 'bg-rose-50 border-rose-400 text-rose-900 font-bold';
                } else if (isSelected) {
                  style = 'bg-primary text-white border-primary-hover font-bold shadow-soft-sm';
                }

                return (
                  <button
                    key={idx}
                    disabled={isSubmitted}
                    onClick={() => handleSelectOption(idx)}
                    className={`w-full text-left p-4 rounded-2xl border text-xs transition-all flex items-center justify-between ${style}`}
                  >
                    <span>{opt}</span>
                    {isSubmitted && isThisCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 ml-2" />}
                    {isSubmitted && isSelected && !isThisCorrect && <XCircle className="w-5 h-5 text-rose-500 shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>

            {/* Feedback */}
            {isSubmitted && (
              <div className={`p-5 rounded-3xl border text-xs leading-relaxed space-y-1 animate-in fade-in ${isCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'}`}>
                <p className="font-bold text-sm">{isCorrect ? '🎉 คำตอบถูกต้อง!' : '❌ ยังไม่ถูกต้อง'}</p>
                <p className="text-xs opacity-90">💡 <span className="font-bold">เฉลย:</span> {currentLab.config.explanation}</p>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                disabled={activeLabIndex === 0}
                onClick={() => { setIsSubmitted(false); setSelectedOption(null); setActiveLabIndex((p) => p - 1); }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeLabIndex === 0 ? 'opacity-40 cursor-not-allowed text-slate-400' : 'text-slate-500 hover:bg-slate-100'}`}
              >
                ◀ ก่อนหน้า
              </button>

              {!isSubmitted ? (
                <button
                  disabled={selectedOption === null}
                  onClick={handleCheckAnswer}
                  className={`px-6 py-3 rounded-2xl text-xs font-bold transition-all ${selectedOption === null ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-primary text-white hover:bg-primary-hover shadow-soft-md'}`}
                >
                  ตรวจสอบคำตอบ
                </button>
              ) : (
                <button
                  onClick={handleNextLab}
                  className="px-6 py-3 rounded-2xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition-all shadow-soft-md flex items-center gap-1.5"
                >
                  ฐานถัดไป <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
