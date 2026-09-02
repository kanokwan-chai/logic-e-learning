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
  const { completedLessons, preKnowledgeResult, preSkillResult } = useLearningStore();
  const router = useRouter();
  const [showLockedAlert, setShowLockedAlert] = useState(false);

  // Only show published lessons to students
  const lessons = allLessons.filter((l) => l.published);

  const isPreTestsCompleted = !!preKnowledgeResult && !!preSkillResult;

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#F8FAFC] font-sans md:flex md:h-[calc(100vh-80px)] md:overflow-hidden">
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

        {/* Loading */}
        {!isHydrated || loading ? (
          <div className="flex flex-col items-center justify-center p-12 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-xs text-slate-400 font-bold">กำลังโหลดบทเรียน...</p>
          </div>
        ) : !preSkillResult ? (
          /* Locked State: Must complete Pre-Skill test before accessing lessons */
          <div className="p-10 rounded-4xl bg-white border-2 border-amber-200 shadow-soft-md text-center space-y-6 max-w-2xl mx-auto my-6">
            <div className="w-20 h-20 rounded-3xl bg-amber-50 text-amber-500 mx-auto flex items-center justify-center shadow-inner">
              <Lock className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-800">บทเรียนยังถูกล็อกอยู่!</h2>
              <p className="text-sm text-slate-600 font-medium leading-relaxed max-w-md mx-auto">
                ต้องทำ <strong>แบบทดสอบวัดทักษะก่อนเรียน (Pre-test)</strong> ให้เสร็จก่อนเท่านั้น ถึงจะเข้าสู่บทเรียนได้ค่ะ
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md mx-auto text-xs font-bold">
              <div className={`p-4 rounded-2xl border ${preKnowledgeResult ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                1. Pre-test ความรู้ {preKnowledgeResult ? '✓ ผ่านแล้ว' : '⏳ ยังไม่ทำ'}
              </div>
              <div className={`p-4 rounded-2xl border ${preSkillResult ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                2. Pre-test ทักษะ {preSkillResult ? '✓ ผ่านแล้ว' : '⏳ ยังไม่ทำ'}
              </div>
            </div>

            <div className="pt-2">
              <Link
                href={!preKnowledgeResult ? '/student/tests/pre_knowledge' : '/student/tests/pre_skill'}
                className="btn-3d-primary inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl text-white font-black text-sm shadow-soft-md"
              >
                {!preKnowledgeResult ? 'ไปทำ Pre-test (ความรู้)' : 'ไปทำ Pre-test (ทักษะ)'} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : lessons.length === 0 ? (
          /* Empty State */
          <div className="p-8 rounded-4xl bg-amber-50 border-2 border-amber-200 flex items-start gap-3 text-xs text-amber-900">
            <Info className="w-5 h-5 shrink-0 mt-0.5 text-amber-500" />
            <div>
              <p className="font-extrabold">ยังไม่มีบทเรียนในระบบ</p>
              <p className="font-medium mt-0.5 opacity-80">
                คุณครูสามารถส่งสไลด์ วิดีโอ หรือเนื้อหาบทเรียนมาได้เลย แล้วผมจะเพิ่มเข้าระบบให้ครับ
              </p>
            </div>
          </div>
        ) : (
          /* Lesson List */
          <div className="grid grid-cols-1 gap-4">
            {lessons.map((lesson) => {
              const isCompleted = completedLessons.includes(lesson.id);

              return (
                <div
                  key={lesson.id}
                  className="bento-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
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
                    href={`/student/lessons/${lesson.id}`}
                    className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all shrink-0 flex items-center gap-2 ${
                      isCompleted
                        ? 'btn-minimal-white'
                        : 'btn-minimal-primary'
                    }`}
                  >
                    {isCompleted ? (
                      <>ทบทวนบทเรียน <ArrowRight className="w-4 h-4" /></>
                    ) : (
                      <>เข้าสู่บทเรียน <ArrowRight className="w-4 h-4" /></>
                    )}
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <LockedAlertModal isOpen={showLockedAlert} onClose={() => setShowLockedAlert(false)} />
    </div>
  );
}
