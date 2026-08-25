'use client';

import { useState, useEffect } from 'react';
import StudentSidebar from '@/components/layout/StudentSidebar';
import { Star, Sparkles, Send, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useLearningStore } from '@/lib/store/useLearningStore';
import { useAuthStore } from '@/lib/store/useAuthStore';
import Link from 'next/link';

type SurveyQuestion = {
  id: string;
  question_text: string;
  type: 'rating' | 'text';
};

export default function StudentSurveyPage() {
  const { user: authUser } = useAuthStore();
  const { surveyCompleted, completeSurvey } = useLearningStore();
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [studentProfile, setStudentProfile] = useState<any>(null);

  useEffect(() => {
    async function fetchQuestionsAndProfile() {
      setLoading(true);
      
      const { data: qData } = await supabase.from('survey_questions').select('*').order('created_at', { ascending: true });
      if (qData) setQuestions(qData);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: pData } = await supabase.from('students').select('*').eq('id', user.id).single();
        if (pData) setStudentProfile(pData);
      }
      
      setLoading(false);
    }
    fetchQuestionsAndProfile();
  }, []);

  const handleRatingChange = (qId: string, rating: number) => {
    setAnswers(prev => ({ ...prev, [qId]: rating }));
  };

  const handleTextChange = (qId: string, text: string) => {
    setAnswers(prev => ({ ...prev, [qId]: text }));
  };

  const handleSubmit = async () => {
    // Check if all questions are answered
    if (Object.keys(answers).length < questions.length) {
      alert('กรุณาตอบแบบประเมินให้ครบทุกข้อครับ');
      return;
    }

    setIsSubmitting(true);
    const user_id = authUser?.id || studentProfile?.id || 's-101';
    const student_name = studentProfile ? `${studentProfile.first_name} ${studentProfile.last_name}` : authUser?.full_name || 'ไม่ระบุชื่อ';

    const { error } = await supabase.from('survey_responses').insert([{
      user_id,
      student_name,
      responses: answers
    }]);

    if (!error) {
      completeSurvey(); // Update Zustand store to unlock certificate
    } else {
      alert('เกิดข้อผิดพลาดในการส่งข้อมูล: ' + error.message);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen md:flex md:h-screen bg-[#F8FAFC] md:overflow-hidden font-sans">
      <StudentSidebar />

      <div className="flex-1 flex flex-col md:h-full overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-3xl mx-auto space-y-6 pb-20">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-8 text-white shadow-soft-sm relative overflow-hidden">
              <div className="relative z-10">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-bold shadow-sm mb-4">
                  <Star className="w-4 h-4 text-yellow-300 fill-yellow-300" /> ขั้นตอนสุดท้าย
                </span>
                <h1 className="text-3xl font-black mb-2">แบบประเมินความพึงพอใจ</h1>
                <p className="text-blue-100 font-medium text-sm">
                  ความคิดเห็นของคุณมีค่ามาก! ช่วยเราพัฒนาบทเรียนให้ดียิ่งขึ้นไปอีก
                </p>
              </div>
              <Sparkles className="absolute -right-6 -bottom-6 w-32 h-32 text-white/10" />
            </div>

            {/* Form Container */}
            {surveyCompleted ? (
              <div className="bg-white rounded-3xl shadow-soft-lg border border-slate-100 p-10 text-center space-y-6">
                <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                </div>
                <h2 className="text-2xl font-black text-slate-800">ขอบคุณสำหรับคำประเมินครับ! 🎉</h2>
                <p className="text-slate-500 font-bold max-w-md mx-auto">
                  ระบบได้บันทึกคำตอบของคุณเรียบร้อยแล้ว ตอนนี้คุณสามารถไปรับใบเกียรติบัตรได้เลย
                </p>
                <Link 
                  href="/student/certificate" 
                  className="inline-block mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-2xl font-black shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all"
                >
                  ไปรับเกียรติบัตร ➔
                </Link>
              </div>
            ) : (
              <div className="bg-white rounded-3xl shadow-soft-lg border border-slate-100 p-6 md:p-8 space-y-8">
                
                {loading ? (
                  <div className="py-20 text-center text-slate-400 font-bold">กำลังโหลดคำถาม...</div>
                ) : questions.length === 0 ? (
                  <div className="py-20 text-center text-slate-400 font-bold bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                    ยังไม่มีคำถามแบบประเมินในระบบ
                  </div>
                ) : (
                  <div className="space-y-8">
                    {questions.map((q, index) => (
                      <div key={q.id} className="space-y-4 bg-slate-50 p-6 rounded-3xl border border-slate-100 hover:border-blue-200 transition-colors">
                        <h3 className="font-bold text-slate-800 text-base md:text-lg flex gap-3">
                          <span className="shrink-0 text-blue-500">{index + 1}.</span>
                          {q.question_text}
                        </h3>
                        
                        {q.type === 'rating' ? (
                          <div className="flex gap-2 justify-center py-4 bg-white rounded-2xl border border-slate-100 shadow-soft-sm">
                            {[1, 2, 3, 4, 5].map((rating) => (
                              <button
                                key={rating}
                                onClick={() => handleRatingChange(q.id, rating)}
                                className={`p-2 transition-transform hover:scale-110 focus:outline-none`}
                              >
                                <Star 
                                  className={`w-10 h-10 ${
                                    (answers[q.id] as number) >= rating 
                                      ? 'text-amber-400 fill-amber-400' 
                                      : 'text-slate-200'
                                  }`} 
                                />
                              </button>
                            ))}
                          </div>
                        ) : (
                          <textarea
                            className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none shadow-soft-sm"
                            rows={4}
                            placeholder="พิมพ์ข้อเสนอแนะของคุณที่นี่..."
                            value={(answers[q.id] as string) || ''}
                            onChange={(e) => handleTextChange(q.id, e.target.value)}
                          ></textarea>
                        )}
                      </div>
                    ))}
                    
                    <div className="pt-4 border-t border-slate-100 flex justify-end">
                      <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white px-8 py-3.5 rounded-2xl font-black text-sm transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 flex items-center gap-2"
                      >
                        {isSubmitting ? 'กำลังส่งข้อมูล...' : <><Send className="w-5 h-5" /> ส่งแบบประเมิน</>}
                      </button>
                    </div>
                  </div>
                )}
                
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
