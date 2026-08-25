'use client';

import { useState, useMemo, useEffect } from 'react';
import StudentSidebar from '@/components/layout/StudentSidebar';
import { useLearningStore } from '@/lib/store/useLearningStore';
import { useStudentAuth } from '@/lib/hooks/useStudentAuth';
import { useQuestions } from '@/lib/hooks/useSupabaseContent';
import { FileCheck2, Clock, CheckCircle, ArrowRight, Lock, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

const testTitles = {
  pre_knowledge: 'แบบทดสอบก่อนเรียน (วัดความรู้)',
  pre_skill: 'แบบทดสอบก่อนเรียน (วัดทักษะ)',
  post_knowledge: 'แบบทดสอบหลังเรียน (วัดความรู้)',
  post_skill: 'แบบทดสอบหลังเรียน (วัดทักษะ)',
};

const lockConfig: Record<string, { reason: string; ctaLabel: string; ctaHref: string }> = {
  pre_skill: {
    reason: 'ต้องทำแบบทดสอบก่อนเรียน (ความรู้) ให้เสร็จก่อนค่ะ',
    ctaLabel: 'ไปทำ Pre-test ความรู้',
    ctaHref: '/student/tests/pre_knowledge',
  },
  post_knowledge: {
    reason: 'ต้องเล่น Digital Board Game ให้ผ่านก่อนค่ะ',
    ctaLabel: 'ไปเล่นบอร์ดเกม',
    ctaHref: '/student/game',
  },
  post_skill: {
    reason: 'ต้องทำแบบทดสอบหลังเรียน (ความรู้) ให้เสร็จก่อนค่ะ',
    ctaLabel: 'ไปทำ Post-test ความรู้',
    ctaHref: '/student/tests/post_knowledge',
  },
};

export default function TestPage() {
  const params = useParams();
  const router = useRouter();
  const { isHydrated } = useStudentAuth();
  const testTypeStr = params.type as string;

  const isValidType =
    testTypeStr === 'pre_knowledge' ||
    testTypeStr === 'pre_skill' ||
    testTypeStr === 'post_knowledge' ||
    testTypeStr === 'post_skill';
  const testType = testTypeStr as 'pre_knowledge' | 'pre_skill' | 'post_knowledge' | 'post_skill';

  const {
    preKnowledgeResult,
    preSkillResult,
    postKnowledgeResult,
    postSkillResult,
    gameResult,
    saveTestResult,
    partialTestAnswers,
    savePartialTestAnswers,
  } = useLearningStore();

  // Redirect invalid type after hydration
  useEffect(() => {
    if (isHydrated && !isValidType) {
      router.push('/student/dashboard');
    }
  }, [isHydrated, isValidType, router]);

  const existingResult = useMemo(() => {
    if (testType === 'pre_knowledge') return preKnowledgeResult;
    if (testType === 'pre_skill') return preSkillResult;
    if (testType === 'post_knowledge') return postKnowledgeResult;
    if (testType === 'post_skill') return postSkillResult;
    return null;
  }, [testType, preKnowledgeResult, preSkillResult, postKnowledgeResult, postSkillResult]);

  // Compute lock state ONLY after hydration — no race condition
  const isLocked = useMemo(() => {
    if (!isHydrated) return false; // ยังไม่รู้ → ไม่ล็อก
    if (testType === 'pre_skill' && !preKnowledgeResult) return true;
    if (testType === 'post_knowledge' && !gameResult) return true;
    if (testType === 'post_skill' && !postKnowledgeResult) return true;
    return false;
  }, [isHydrated, testType, preKnowledgeResult, gameResult, postKnowledgeResult]);

  const { questions: allQuestions, loading } = useQuestions(isValidType ? testType : undefined);

  const questions = useMemo(() => {
    return allQuestions.slice(0, 20).map((q, idx) => ({
      ...q,
      id: `${testType}-q-${idx + 1}`,
      question_text: `ข้อที่ ${idx + 1}: ${q.question_text}`,
    }));
  }, [allQuestions, testType]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([]);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (questions.length > 0 && userAnswers.length === 0) {
      const savedAnswers = partialTestAnswers[testType];
      if (savedAnswers && savedAnswers.length === questions.length) {
        setUserAnswers(savedAnswers);
        const firstUnanswered = savedAnswers.findIndex((a) => a === null);
        if (firstUnanswered !== -1) setCurrentIndex(firstUnanswered);
      } else {
        setUserAnswers(Array(questions.length).fill(null));
      }
    }
  }, [questions.length, userAnswers.length, partialTestAnswers, testType]);

  const handleSelectOption = (optionIndex: number) => {
    if (submitted) return;
    const updated = [...userAnswers];
    updated[currentIndex] = optionIndex;
    setUserAnswers(updated);
    savePartialTestAnswers(testType, updated);
  };

  const handleSubmitTest = () => {
    let calculatedScore = 0;
    questions.forEach((q, idx) => {
      if (userAnswers[idx] === q.correct_option_index) calculatedScore += 1;
    });

    setSubmitted(true);

    saveTestResult(testType, {
      id: `${testType}-${Date.now()}`,
      user_id: 's-001',
      score: calculatedScore,
      total_questions: questions.length,
      answers: userAnswers.map((a) => a ?? -1),
      time_spent_sec: 0,
      completed_at: new Date().toISOString(),
    });

    savePartialTestAnswers(testType, []);
  };

  const answeredCount = userAnswers.filter((a) => a !== null).length;
  const isAllAnswered = answeredCount === questions.length;
  const title = isValidType ? testTitles[testType] : '';

  return (
    <div className="min-h-screen md:flex md:h-screen bg-[#F8FAFC] md:overflow-hidden font-sans">
      <StudentSidebar />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">

        {/* Loading — รอ hydration */}
        {!isHydrated && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-sm font-bold text-slate-500">กำลังโหลดข้อมูล...</p>
          </div>
        )}

        {/* Locked UI — สวยงามแทน alert popup */}
        {isHydrated && isLocked && isValidType && (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-10 max-w-md w-full text-center space-y-6">
              <div className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center mx-auto">
                <Lock className="w-10 h-10 text-amber-500" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-black text-slate-800">ยังเข้าไม่ได้ค่ะ</h2>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">
                  {lockConfig[testType]?.reason}
                </p>
              </div>
              <Link
                href={lockConfig[testType]?.ctaHref ?? '/student/dashboard'}
                className="inline-flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-slate-900 text-white font-black text-sm hover:bg-slate-700 transition-colors"
              >
                {lockConfig[testType]?.ctaLabel} <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/student/dashboard"
                className="block text-xs text-slate-400 hover:text-slate-600 font-bold"
              >
                กลับหน้าหลัก
              </Link>
            </div>
          </div>
        )}

        {/* Main Test Content */}
        {isHydrated && !isLocked && isValidType && (
          <>
            {/* Banner */}
            <div className="p-8 md:p-10 rounded-3xl bg-slate-900 text-white shadow-sm flex items-center justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-slate-800 rounded-full blur-3xl opacity-50 -mr-20 -mt-20" />
              <div className="space-y-3 relative z-10">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-slate-200 font-medium text-xs tracking-wider">
                  <Clock className="w-3.5 h-3.5" /> เวลาทำข้อสอบ: ไม่จำกัด
                </span>
                <h1 className="text-3xl md:text-4xl font-black tracking-tight">{title}</h1>
                <p className="text-sm font-medium text-slate-400">
                  ทดสอบทักษะการคิดเชิงตรรกะ ({questions.length} ข้อ)
                </p>
              </div>
              <div className="hidden md:flex w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md items-center justify-center border border-white/20 relative z-10">
                <FileCheck2 className="w-8 h-8 text-white" />
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center p-12 text-slate-400 font-bold gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-primary" /> กำลังโหลดข้อสอบ...
              </div>
            ) : existingResult ? (
              /* Already Done */
              <div className="p-8 md:p-12 rounded-4xl bg-white border border-slate-100 shadow-soft-xl text-center space-y-6 max-w-2xl mx-auto">
                <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle className="w-12 h-12 text-emerald-600" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-black text-slate-800">ส่งคำตอบเรียบร้อย!</h2>
                  <p className="text-sm text-slate-500 font-bold">คุณทำแบบทดสอบนี้ไปแล้ว</p>
                </div>
                <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">คะแนนของคุณ</p>
                  <p className="text-5xl font-black text-primary">
                    {existingResult.score}{' '}
                    <span className="text-2xl text-slate-400">/ {existingResult.total_questions}</span>
                  </p>
                </div>
                <Link
                  href="/student/dashboard"
                  className="inline-flex items-center justify-center w-full py-4 rounded-2xl bg-slate-900 text-white font-black text-sm hover:bg-slate-800 transition-colors"
                >
                  กลับสู่หน้าหลัก
                </Link>
              </div>
            ) : questions.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-3xl border border-slate-100 shadow-soft-sm text-slate-500 font-bold">
                ยังไม่มีข้อสอบในชุดนี้
              </div>
            ) : (
              /* Quiz */
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3 space-y-4">
                  <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-soft-sm space-y-6">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                      <h3 className="font-extrabold text-slate-800 text-lg">
                        ข้อที่ {currentIndex + 1}{' '}
                        <span className="text-slate-400 text-sm">/ {questions.length}</span>
                      </h3>
                    </div>

                    <p className="text-base md:text-lg font-bold text-slate-800 leading-relaxed min-h-[80px]">
                      {questions[currentIndex].question_text}
                    </p>

                    <div className="space-y-3">
                      {questions[currentIndex].options.map((opt, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSelectOption(idx)}
                          disabled={submitted}
                          className={`w-full text-left p-4 md:p-5 rounded-2xl border-2 transition-all font-bold text-sm flex items-center justify-between ${
                            userAnswers[currentIndex] === idx
                              ? 'border-primary bg-primary-light/30 text-primary'
                              : 'border-slate-200 bg-white hover:border-primary/50 text-slate-700'
                          }`}
                        >
                          <span className="flex-1">
                            {String.fromCharCode(65 + idx)}. {opt}
                          </span>
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                              userAnswers[currentIndex] === idx ? 'border-primary' : 'border-slate-300'
                            }`}
                          >
                            {userAnswers[currentIndex] === idx && (
                              <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-3xl bg-white border border-slate-100 shadow-soft-sm">
                    <button
                      onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                      disabled={currentIndex === 0 || submitted}
                      className="px-5 py-3 rounded-2xl font-bold text-xs text-slate-500 hover:bg-slate-50 disabled:opacity-30 transition-colors"
                    >
                      ← ข้อก่อนหน้า
                    </button>
                    <button
                      onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                      disabled={currentIndex === questions.length - 1 || submitted}
                      className="px-5 py-3 rounded-2xl font-bold text-xs text-slate-500 hover:bg-slate-50 disabled:opacity-30 transition-colors"
                    >
                      ข้อถัดไป →
                    </button>
                  </div>
                </div>

                {/* Sidebar Status */}
                <div className="space-y-4">
                  <div className="p-5 rounded-3xl bg-white border border-slate-100 shadow-soft-sm space-y-4 sticky top-6">
                    <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" /> สถานะการทำ
                    </h4>
                    <div className="grid grid-cols-5 gap-2">
                      {questions.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentIndex(idx)}
                          disabled={submitted}
                          className={`aspect-square rounded-xl text-[10px] font-black transition-all ${
                            currentIndex === idx
                              ? 'bg-slate-800 text-white shadow-md scale-110'
                              : userAnswers[idx] !== null
                              ? 'bg-primary-light text-primary border border-primary/20'
                              : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                          }`}
                        >
                          {idx + 1}
                        </button>
                      ))}
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                      {submitted ? (
                        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-center text-emerald-800 font-bold text-xs">
                          ส่งคำตอบแล้ว
                        </div>
                      ) : (
                        <button
                          onClick={handleSubmitTest}
                          disabled={!isAllAnswered}
                          className="btn-minimal-primary w-full py-3.5 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          ส่งคำตอบ
                        </button>
                      )}
                      {!isAllAnswered && !submitted && (
                        <p className="text-center text-[10px] text-rose-500 font-bold mt-2">
                          *กรุณาตอบให้ครบทุกข้อ ({answeredCount}/{questions.length})
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
