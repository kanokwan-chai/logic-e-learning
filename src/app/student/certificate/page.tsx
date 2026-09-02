'use client';
import { useStudentAuth } from '@/lib/hooks/useStudentAuth';

import StudentSidebar from '@/components/layout/StudentSidebar';
import CertificateCanvas from '@/components/student/CertificateCanvas';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useLearningStore } from '@/lib/store/useLearningStore';
import Link from 'next/link';
import { FileBadge, ShieldCheck, Lock, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function CertificatePage() {
  useStudentAuth();
  const { user: authUser } = useAuthStore();
  const { completedLessons, preKnowledgeResult, preSkillResult, postKnowledgeResult, postSkillResult, gameResult, surveyCompleted } = useLearningStore();

  const [studentProfile, setStudentProfile] = useState<{ first_name: string; last_name: string; number: number; class_name: string } | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('students').select('*').eq('id', user.id).single();
        if (data) {
          setStudentProfile(data);
        }
      }
    }
    fetchProfile();
  }, []);

  // Define 7 Main Quests
  const quests = [
    { id: 1, title: 'สอบก่อนเรียน (ความรู้)', isDone: preKnowledgeResult !== null, href: '/student/tests/pre_knowledge' },
    { id: 2, title: 'สอบก่อนเรียน (ทักษะ)', isDone: preSkillResult !== null, href: '/student/tests/pre_skill' },
    { id: 3, title: 'เรียนผ่านบทเรียนตรรกศาสตร์', isDone: completedLessons.length >= 1, href: '/student/lessons' },
    { id: 4, title: 'เคลียร์ Digital Board Game', isDone: gameResult !== null, href: '/student/game' },
    { id: 5, title: 'สอบหลังเรียน (ความรู้)', isDone: postKnowledgeResult !== null, href: '/student/tests/post_knowledge' },
    { id: 6, title: 'สอบหลังเรียน (ทักษะ)', isDone: postSkillResult !== null, href: '/student/tests/post_skill' },
    { id: 7, title: 'แบบประเมินความพึงพอใจ', isDone: surveyCompleted === true, href: '/student/survey' },
  ];

  const completedQuestsCount = quests.filter((q) => q.isDone).length;
  const isAllQuestsDone = completedQuestsCount === 7;

  // Demo bypass toggle so the user can preview the certificate anytime
  const [demoBypass, setDemoBypass] = useState(false);
  const showCert = isAllQuestsDone || demoBypass;

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#F8FAFC] font-sans md:flex md:h-[calc(100vh-80px)] md:overflow-hidden">
      <StudentSidebar />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header Title */}
        <div className="p-6 rounded-4xl bg-white border-2 border-slate-200 shadow-soft-sm flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <FileBadge className="w-7 h-7 text-primary" /> เควสปลดล็อกเกียรติบัตร (Certificate Quest)
            </h1>
            <p className="text-xs text-slate-500 font-bold mt-1">
              ทำเควสให้ครบทั้ง {quests.length} ข้อเพื่อรับใบเกียรติบัตรออนไลน์ฉบับจริงพร้อมรหัสตรวจสอบ
            </p>
          </div>

          <span className="px-4 py-2 rounded-2xl bg-purple-100 border-2 border-purple-200 text-purple-900 font-black text-xs">
            สำเร็จ {completedQuestsCount}/{quests.length} เควส
          </span>
        </div>

        {/* 6 Quests Progress Tracker Card */}
        <div className="p-6 rounded-4xl bg-white border-2 border-purple-200 border-b-8 border-b-purple-300 shadow-soft-md space-y-4">
          <div className="flex items-center justify-between border-b-2 border-slate-100 pb-3">
            <h3 className="font-black text-sm text-slate-800 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" /> รายการเควสประจำวิชา ({quests.length} Quests Checklist)
            </h3>

            {/* Demo Toggle Button */}
            <button
              onClick={() => setDemoBypass(!demoBypass)}
              className="text-[11px] font-bold text-slate-400 hover:text-primary underline"
            >
              {demoBypass ? '🔒 ปิดการจำลองปลดล็อก' : '🔓 ทดลองจำลองปลดล็อกเกียรติบัตร'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {quests.map((q) => (
              <Link
                key={q.id}
                href={q.href}
                className={`p-4 rounded-3xl border-2 transition-all flex items-center justify-between ${
                  q.isDone
                    ? 'bg-emerald-50 border-emerald-300 border-b-4 border-b-emerald-400 text-emerald-950 font-bold'
                    : 'bg-slate-50 border-slate-200 border-b-4 border-b-slate-300 text-slate-700 hover:border-primary'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-8 h-8 rounded-2xl flex items-center justify-center font-black text-xs ${
                      q.isDone ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {q.isDone ? '✓' : q.id}
                  </span>
                  <span className="text-xs font-extrabold">{q.title}</span>
                </div>
                <span className="text-[11px] font-black underline shrink-0">
                  {q.isDone ? 'สำเร็จแล้ว' : 'ไปทำเควส ➔'}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Certificate Display Area */}
        {showCert ? (
          <CertificateCanvas
            studentName={studentProfile ? `${studentProfile.first_name} ${studentProfile.last_name}` : authUser?.full_name || 'สมชาย รักการเรียน'}
            studentId={studentProfile?.number?.toString() || '1'}
            className={studentProfile?.class_name || 'ปวช.1 ธดท.'}
          />
        ) : (
          <div className="p-10 rounded-4xl bg-white border-2 border-slate-200 border-b-8 border-b-slate-300 text-center space-y-4 shadow-soft-md">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center border-b-4 border-slate-300">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-slate-800">เกียรติบัตรยังถูกล็อกอยู่! 🔒</h2>
            <p className="text-xs text-slate-500 font-bold max-w-md mx-auto leading-relaxed">
              คุณทำเควสสำเร็จแล้ว <span className="text-primary font-black">{completedQuestsCount} จาก 7 เควส</span> ทำเควสที่เหลือให้ครบเพื่อปลดล็อกใบเกียรติบัตรและดาวน์โหลดไฟล์ PDF
            </p>

            <div className="pt-2">
              <Link
                href={quests.find((q) => !q.isDone)?.href || '/student/lessons'}
                className="btn-3d-primary inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-white font-black text-xs shadow-soft-sm"
              >
                ไปทำเควสถัดไปเลย <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
