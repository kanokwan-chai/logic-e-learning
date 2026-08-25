'use client';
import { useStudentAuth } from '@/lib/hooks/useStudentAuth';

import StudentSidebar from '@/components/layout/StudentSidebar';
import { useLessons } from '@/lib/hooks/useSupabaseContent';
import { useLearningStore } from '@/lib/store/useLearningStore';
import Link from 'next/link';
import { BookOpen, CheckCircle, Clock, ArrowRight, Info, Loader2, Lock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LockedAlertModal from '@/components/ui/LockedAlertModal';

export default function LessonsListPage() {
  const { isHydrated } = useStudentAuth();
  const { lessons: allLessons, loading } = useLessons();
  const { completedLessons, preSkillResult } = useLearningStore();
  const router = useRouter();
  const [showLockedAlert, setShowLockedAlert] = useState(false);

  useEffect(() => {
    // รอให้ข้อมูลจาก Supabase โหลดเสร็จก่อนค่อย redirect
    if (!isHydrated) return;
    
    // ถ้ายังไม่สอบ pre-skill และยังไม่เคยเรียนบทไหนเลย ให้เด้งออก
    if (preSkillResult === null && completedLessons.length === 0) {
      router.push('/student/dashboard');
    }
  }, [isHydrated, preSkillResult, completedLessons.length, router]);

  // Only show published lessons to students
  const lessons = allLessons.filter((l) => l.published);

  return (
    <div className="min-h-screen md:flex md:h-screen bg-[#F8FAFC] md:overflow-hidden font-sans">
      <StudentSidebar />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm">
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3">
            <BookOpen className="w-7 h-7 text-blue-600" /> รายวิชาตรรกศาสตร์ (Computer Logic)
          </h1>
          <p className="text-sm text-slate-500 mt-2 font-medium">
            เรียนบทเรียนแบบ Micro-learning พร้อมวิดีโอ สไลด์ และกิจกรรมเชิงโต้ตอบ
          </p>
        </div>

        {/* Empty State */}
        {loading ? (
          <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : lessons.length === 0 && (
          <div className="p-8 rounded-4xl bg-amber-50 border-2 border-amber-200 flex items-start gap-3 text-xs text-amber-900">
            <Info className="w-5 h-5 shrink-0 mt-0.5 text-amber-500" />
            <div>
              <p className="font-extrabold">ยังไม่มีบทเรียนในระบบ</p>
              <p className="font-medium mt-0.5 opacity-80">
                คุณครูสามารถส่งสไลด์ วิดีโอ หรือเนื้อหาบทเรียนมาได้เลย แล้วผมจะเพิ่มเข้าระบบให้ครับ
              </p>
            </div>
          </div>
        )}

        {/* Lesson List */}
        <div className="grid grid-cols-1 gap-4">
          {lessons.map((lesson, idx) => {
            const isCompleted = completedLessons.includes(lesson.id);
            const isLocked = idx > 0 && !completedLessons.includes(lessons[idx - 1].id);

            return (
              <div
                key={lesson.id}
                className={`bento-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  isLocked ? 'opacity-60 bg-slate-50' : ''
                }`}
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${isCompleted ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>
                      {isCompleted ? <CheckCircle className="w-3.5 h-3.5 inline mr-1" /> : null}
                      บทที่ {lesson.chapter_number}
                    </span>
                    <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {lesson.duration_mins} นาที
                    </span>
                  </div>

                  <h3 className="font-bold text-lg text-slate-800">{lesson.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{lesson.description}</p>
                </div>

                <Link
                  href={isLocked ? '#' : `/student/lessons/${lesson.id}`}
                  onClick={(e) => {
                    if (isLocked) {
                      e.preventDefault();
                      setShowLockedAlert(true);
                    }
                  }}
                  className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all shrink-0 flex items-center gap-2 ${
                    isLocked
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                      : isCompleted
                      ? 'btn-minimal-white'
                      : 'btn-minimal-primary'
                  }`}
                >
                  {isLocked ? (
                    <><Lock className="w-4 h-4" /> ล็อกอยู่</>
                  ) : isCompleted ? (
                    <>ทบทวนบทเรียน <ArrowRight className="w-4 h-4" /></>
                  ) : (
                    <>เข้าสู่บทเรียน <ArrowRight className="w-4 h-4" /></>
                  )}
                </Link>
              </div>
            );
          })}
        </div>
      </div>
      <LockedAlertModal isOpen={showLockedAlert} onClose={() => setShowLockedAlert(false)} />
    </div>
  );
}
