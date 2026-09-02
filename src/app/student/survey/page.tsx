'use client';

import { useState, useEffect } from 'react';
import StudentSidebar from '@/components/layout/StudentSidebar';
import { Star, Sparkles, Send, CheckCircle2, Lock, ArrowRight, BookOpen, Gamepad2, FileCheck2, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { saveSurveyToDB } from '@/lib/supabase/db';
import { useLearningStore } from '@/lib/store/useLearningStore';
import { useLessons } from '@/lib/hooks/useSupabaseContent';
import { useStudentAuth } from '@/lib/hooks/useStudentAuth';
import { INITIAL_SURVEY_CONFIG, SurveyConfig, SurveyQuestionItem } from '@/lib/constants/surveyData';
import Link from 'next/link';

const RATING_LABELS: Record<number, string> = {
  5: 'มากที่สุด',
  4: 'มาก',
  3: 'ปานกลาง',
  2: 'น้อย',
  1: 'น้อยที่สุด',
};

export default function StudentSurveyPage() {
  const { isHydrated } = useStudentAuth();
  const { 
    surveyCompleted, 
    completeSurvey,
    preKnowledgeResult,
    preSkillResult,
    completedLessons,
    gameResult,
    postKnowledgeResult,
    postSkillResult,
  } = useLearningStore();

  const { lessons: allLessons, loading: lessonsLoading } = useLessons();
  const publishedLessons = allLessons.filter((l) => l.published);

  // Learning progression check
  const isPreTestsCompleted = !!preKnowledgeResult && !!preSkillResult;
  const allLessonsDone = publishedLessons.length > 0 
    ? publishedLessons.every((l) => completedLessons.includes(l.id))
    : completedLessons.length >= 1;
  const isAllActivitiesCompleted =
    isPreTestsCompleted &&
    allLessonsDone &&
    !!gameResult &&
    !!postKnowledgeResult &&
    !!postSkillResult;

  const [config, setConfig] = useState<SurveyConfig>(INITIAL_SURVEY_CONFIG);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [feedbackText, setFeedbackText] = useState('');
  const [studentProfile, setStudentProfile] = useState<any>(null);

  useEffect(() => {
    async function fetchConfigAndProfile() {
      setLoadingConfig(true);
      
      try {
        const { data: qData } = await supabase
          .from('survey_questions')
          .select('*')
          .eq('id', 'survey_global_config')
          .maybeSingle();

        if (qData?.question_text) {
          const parsed = JSON.parse(qData.question_text);
          if (parsed.dimensions && parsed.dimensions.length > 0) {
            setConfig(parsed);
          }
        }
      } catch (e) {
        // use default config
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: pData } = await supabase.from('students').select('*').eq('id', user.id).single();
        if (pData) setStudentProfile(pData);
      }
      
      setLoadingConfig(false);
    }
    fetchConfigAndProfile();
  }, []);

  const handleRatingChange = (qId: string, rating: number) => {
    setAnswers((prev) => ({ ...prev, [qId]: rating }));
  };

  const allQuestions: SurveyQuestionItem[] = config.dimensions.flatMap((d) => d.questions);
  const answeredCount = Object.keys(answers).length;
  const totalQuestionsCount = allQuestions.length;

  const handleSubmit = async () => {
    if (answeredCount < totalQuestionsCount) {
      alert(`กรุณาตอบแบบประเมินให้ครบทุกข้อก่อนส่งนะคะ (ตอบแล้ว ${answeredCount}/${totalQuestionsCount} ข้อ)`);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    const user_id = user?.id || studentProfile?.id || 's-guest';

    setIsSubmitting(true);
    const submissionPayload = {
      ...answers,
      feedback_text: feedbackText.trim(),
    };

    try {
      await saveSurveyToDB(user_id, submissionPayload);
    } catch (e) {}

    completeSurvey();
    setIsSubmitting(false);
  };

  // Find next step for CTA if locked
  const getNextStepHref = () => {
    if (!preKnowledgeResult) return '/student/tests/pre_knowledge';
    if (!preSkillResult) return '/student/tests/pre_skill';
    if (!allLessonsDone) return '/student/lessons';
    if (!gameResult) return '/student/game';
    if (!postKnowledgeResult) return '/student/tests/post_knowledge';
    if (!postSkillResult) return '/student/tests/post_skill';
    return '/student/dashboard';
  };

  const getNextStepLabel = () => {
    if (!preKnowledgeResult) return 'ไปทำ Pre-test (ความรู้)';
    if (!preSkillResult) return 'ไปทำ Pre-test (ทักษะ)';
    if (!allLessonsDone) return 'ไปเรียนบทเรียนตรรกศาสตร์';
    if (!gameResult) return 'ไปเล่น Digital Board Game';
    if (!postKnowledgeResult) return 'ไปทำ Post-test (ความรู้)';
    if (!postSkillResult) return 'ไปทำ Post-test (ทักษะ)';
    return 'กลับสู่แดชบอร์ด';
  };

  return (
    <div className="min-h-screen md:flex md:h-screen bg-[#F8FAFC] md:overflow-hidden font-sans">
      <StudentSidebar />

      <div className="flex-1 flex flex-col md:h-full overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto space-y-6 pb-20">
            
            {/* Loading */}
            {!isHydrated || lessonsLoading || loadingConfig ? (
              <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-xs font-bold text-slate-400">กำลังโหลดแบบประเมิน...</p>
              </div>
            ) : !isAllActivitiesCompleted && !surveyCompleted ? (
              /* Locked Screen: Must complete all learning stages first */
              <div className="p-8 sm:p-12 rounded-4xl bg-white border-2 border-amber-200 shadow-soft-lg text-center space-y-6 max-w-xl mx-auto my-8">
                <div className="w-20 h-20 rounded-3xl bg-amber-50 text-amber-500 mx-auto flex items-center justify-center shadow-inner">
                  <Lock className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-black text-slate-800">แบบประเมินยังถูกล็อกอยู่! ⭐</h2>
                  <p className="text-sm text-slate-600 font-medium leading-relaxed max-w-md mx-auto">
                    แบบประเมินความพึงพอใจเป็น <strong>ขั้นตอนสุดท้าย</strong> ของการเรียน กรุณาทำแบบทดสอบก่อนเรียน, เรียนบทเรียน, เล่นเกมกระดาน และทำแบบทดสอบหลังเรียนให้ครบทุกขั้นตอนก่อนนะคะ
                  </p>
                </div>

                {/* Stages Checklist */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left text-xs font-bold pt-2">
                  <div className={`p-3 rounded-xl border flex items-center justify-between ${preKnowledgeResult ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                    <span>1. Pre-test ความรู้</span>
                    <span>{preKnowledgeResult ? '✓ ผ่าน' : '⏳'}</span>
                  </div>
                  <div className={`p-3 rounded-xl border flex items-center justify-between ${preSkillResult ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                    <span>2. Pre-test ทักษะ</span>
                    <span>{preSkillResult ? '✓ ผ่าน' : '⏳'}</span>
                  </div>
                  <div className={`p-3 rounded-xl border flex items-center justify-between ${allLessonsDone ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                    <span>3. บทเรียนตรรกศาสตร์</span>
                    <span>{allLessonsDone ? '✓ ครบ' : '⏳'}</span>
                  </div>
                  <div className={`p-3 rounded-xl border flex items-center justify-between ${gameResult ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                    <span>4. Digital Board Game</span>
                    <span>{gameResult ? '✓ ผ่าน' : '⏳'}</span>
                  </div>
                  <div className={`p-3 rounded-xl border flex items-center justify-between ${postKnowledgeResult ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                    <span>5. Post-test ความรู้</span>
                    <span>{postKnowledgeResult ? '✓ ผ่าน' : '⏳'}</span>
                  </div>
                  <div className={`p-3 rounded-xl border flex items-center justify-between ${postSkillResult ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                    <span>6. Post-test ทักษะ</span>
                    <span>{postSkillResult ? '✓ ผ่าน' : '⏳'}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    href={getNextStepHref()}
                    className="btn-3d-primary inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl text-white font-black text-sm shadow-soft-md"
                  >
                    {getNextStepLabel()} <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ) : surveyCompleted ? (
              /* Already Completed State */
              <div className="bg-white rounded-3xl shadow-soft-lg border border-slate-100 p-10 text-center space-y-6 max-w-2xl mx-auto my-6">
                <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                </div>
                <h2 className="text-2xl font-black text-slate-800">ขอบคุณสำหรับคำประเมินครับ! 🎉</h2>
                <p className="text-slate-500 font-bold max-w-md mx-auto text-sm leading-relaxed">
                  ระบบได้บันทึกความคิดเห็นของคุณเรียบร้อยแล้ว ตอนนี้คุณสามารถไปรับใบเกียรติบัตรออนไลน์ได้เลยครับ
                </p>
                <div className="pt-2">
                  <Link 
                    href="/student/certificate" 
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3.5 rounded-2xl font-black text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
                  >
                    ไปรับเกียรติบัตรออนไลน์ <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ) : (
              /* Unlocked Survey Form */
              <div className="space-y-6">
                
                {/* Header Banner */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-bold text-xs">
                      ⭐ ขั้นตอนสุดท้าย
                    </span>
                    <span className="text-xs text-slate-400 font-bold">
                      ตอบแล้ว {answeredCount} จาก {totalQuestionsCount} ข้อ
                    </span>
                  </div>

                  <h1 className="text-xl sm:text-2xl font-black text-slate-800">
                    {config.title}
                  </h1>

                  <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 text-xs text-slate-700 font-medium leading-relaxed">
                    {config.description}
                  </div>
                </div>

                {/* 5 Dimension Cards */}
                {config.dimensions.map((dim) => (
                  <div key={dim.id} className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 space-y-6">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                      <div className="w-9 h-9 rounded-2xl bg-blue-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-sm">
                        {dim.id}
                      </div>
                      <div>
                        <h2 className="text-base font-extrabold text-slate-800">{dim.title}</h2>
                        {dim.subtitle && (
                          <p className="text-xs text-slate-400 font-medium">{dim.subtitle}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-6">
                      {dim.questions.map((q, idx) => {
                        const currentRating = answers[q.id];
                        return (
                          <div key={q.id} className="space-y-3 p-4 rounded-2xl bg-[#F8FAFC] border border-slate-100 hover:border-blue-200 transition-colors">
                            <p className="font-bold text-slate-800 text-sm leading-relaxed">
                              {q.text}
                            </p>

                            {/* 5-Star Rating Buttons */}
                            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                              <div className="flex items-center gap-1.5 sm:gap-2">
                                {[1, 2, 3, 4, 5].map((star) => {
                                  const isSelected = (currentRating || 0) >= star;
                                  return (
                                    <button
                                      key={star}
                                      type="button"
                                      onClick={() => handleRatingChange(q.id, star)}
                                      className={`p-2 rounded-xl transition-all cursor-pointer ${
                                        isSelected 
                                          ? 'bg-amber-50 text-amber-500 scale-105' 
                                          : 'bg-white text-slate-300 hover:bg-slate-100'
                                      }`}
                                      title={`${star} คะแนน (${RATING_LABELS[star]})`}
                                    >
                                      <Star className={`w-6 h-6 sm:w-7 sm:h-7 ${isSelected ? 'fill-amber-400 text-amber-400' : ''}`} />
                                    </button>
                                  );
                                })}
                              </div>

                              {currentRating ? (
                                <span className="text-xs font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                                  {currentRating} คะแนน ({RATING_LABELS[currentRating]})
                                </span>
                              ) : (
                                <span className="text-[11px] font-bold text-slate-400">
                                  กรุณาเลือกคะแนน 1-5
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Additional Suggestions */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 space-y-3">
                  <h3 className="text-sm font-extrabold text-slate-800">
                    ข้อเสนอแนะเพิ่มเติม (Optional)
                  </h3>
                  <textarea
                    rows={4}
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="พิมพ์ข้อเสนอแนะหรือความคิดเห็นเพิ่มเติมเพื่อการพัฒนาระบบที่ดียิ่งขึ้น..."
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl p-4 text-xs font-medium text-slate-700 leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                  />
                </div>

                {/* Submit Action Bar */}
                <div className="sticky bottom-6 z-20 bg-white/95 backdrop-blur-md rounded-2xl p-4 border border-slate-200 shadow-soft-lg flex items-center justify-between gap-4">
                  <div className="text-xs font-bold text-slate-600">
                    ความคืบหน้า: <span className="text-blue-600 font-black">{answeredCount} / {totalQuestionsCount}</span> ข้อ
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className={`px-8 py-3.5 rounded-xl font-black text-xs transition-all flex items-center gap-2 cursor-pointer shadow-soft-sm ${
                      answeredCount === totalQuestionsCount
                        ? 'bg-blue-600 hover:bg-blue-700 text-white active:scale-95'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> กำลังส่งข้อมูล...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" /> ส่งแบบประเมิน
                      </>
                    )}
                  </button>
                </div>

              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
