'use client';

import { use, useRef, useState } from 'react';
import StudentSidebar from '@/components/layout/StudentSidebar';
import { useLessons } from '@/lib/hooks/useSupabaseContent';
import { useLearningStore } from '@/lib/store/useLearningStore';
import { useStudentAuth } from '@/lib/hooks/useStudentAuth';
import MiniQuiz from '@/components/student/MiniQuiz';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { BookOpen, Target, CheckCircle2, ArrowLeft, ArrowRight, Video, Presentation, AlertCircle, Loader2 } from 'lucide-react';

export default function LessonDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { lessons: allLessons, loading } = useLessons();
  const { completedLessons, completeLesson, preSkillResult } = useLearningStore();
  const router = useRouter();

  // Only consider published lessons for progression
  const lessons = allLessons.filter((l) => l.published);

  const lessonIndex = lessons.findIndex((l) => l.id === resolvedParams.id);
  const lesson = lessonIndex !== -1 ? lessons[lessonIndex] : undefined;

  const isCompleted = lesson ? completedLessons.includes(lesson.id) : false;

  const { isHydrated } = useStudentAuth();

  const [canFinish, setCanFinish] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isHydrated) return;

    if (preSkillResult === null && completedLessons.length === 0) {
      router.push('/student/dashboard');
      return;
    }

    // บล็อกเฉพาะกรณีที่บทนี้ยังไม่เคยเรียน และบทก่อนหน้ายังไม่เสร็จ
    if (!loading && lessonIndex > 0 && !isCompleted) {
      const prevLesson = lessons[lessonIndex - 1];
      if (!completedLessons.includes(prevLesson.id)) {
        router.push('/student/lessons');
      }
    }
  }, [isHydrated, loading, lessonIndex, lessons, completedLessons, isCompleted, router, preSkillResult]);

  useEffect(() => {
    if (isCompleted) {
      setCanFinish(true);
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setCanFinish(true);
        observer.disconnect();
      }
    }, { threshold: 0.1 });

    if (bottomRef.current) {
      observer.observe(bottomRef.current);
    }

    return () => observer.disconnect();
  }, [isCompleted]);

  const [googleUser, setGoogleUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setGoogleUser(user);
    });
  }, []);

  const googleName = googleUser?.user_metadata?.full_name || googleUser?.user_metadata?.name || googleUser?.email?.split('@')[0] || 'นักเรียน';
  const googleId = googleUser?.id || 's-101';

  const handleFinishLesson = () => {
    if (lesson) completeLesson(lesson.id);
  };

  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('canva.com') && url.includes('/view') && !url.includes('?embed')) {
      return url.split('/view')[0] + '/view?embed';
    }
    if (url.includes('drive.google.com') && url.includes('/view')) {
      return url.replace('/view', '/preview');
    }
    if (url.includes('youtube.com/watch?v=')) {
      const videoId = url.split('v=')[1].split('&')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1].split('?')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.includes('digital-board-game-eight.vercel.app')) {
      return `${url.split('?')[0]}?student_id=${googleId}&name=${encodeURIComponent(googleName)}&autoLogin=true`;
    }
    return url;
  };

  if (loading) {
    return (
      <div className="flex flex-col md:flex-row gap-6">
        <StudentSidebar />
        <div className="flex-1 flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // Lesson not found
  if (!lesson) {
    return (
      <div className="flex flex-col md:flex-row gap-6">
        <StudentSidebar />
        <div className="flex-1 p-8 rounded-4xl bg-amber-50 border-2 border-amber-200 flex items-start gap-3 text-xs text-amber-900">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-500" />
          <div>
            <p className="font-extrabold">ไม่พบบทเรียนนี้</p>
            <p className="mt-0.5 opacity-80">บทเรียนอาจยังไม่ได้รับการเผยแพร่จากครู</p>
            <Link href="/student/lessons" className="mt-3 inline-flex items-center gap-1.5 text-primary font-bold hover:underline">
              <ArrowLeft className="w-3.5 h-3.5" /> กลับสู่รายการบทเรียน
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-6">
      <StudentSidebar />

      <div className="flex-1 space-y-6">
        {/* Back Link */}
        <Link href="/student/lessons" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-primary transition-colors">
          <ArrowLeft className="w-4 h-4" /> กลับสู่รายการบทเรียน
        </Link>

        {/* Lesson Header */}
        <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-soft-sm space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-primary-light text-primary font-bold text-xs">
              บทที่ {lesson.chapter_number}
            </span>
            <span className="text-xs text-slate-400 font-medium">{lesson.duration_mins} นาที</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800">{lesson.title}</h1>
          {lesson.description && <p className="text-xs text-slate-600 leading-relaxed">{lesson.description}</p>}
        </div>

        {/* 1. Objectives */}
        {lesson.objectives.length > 0 && (
          <div className="p-6 rounded-3xl bg-primary-light/50 border border-primary/20 shadow-soft-sm space-y-3">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" /> 1. วัตถุประสงค์การเรียนรู้
            </h3>
            <ul className="space-y-2">
              {lesson.objectives.map((obj, idx) => (
                <li key={idx} className="text-xs text-slate-700 flex items-start gap-2">
                  <span className="text-primary font-bold">✓</span> {obj}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 2. Slide */}
        {lesson.slide_url && (
          <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-soft-sm space-y-3">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <Presentation className="w-4 h-4 text-blue-500" /> 2. สไลด์ประกอบการสอน
            </h3>
            <div className="w-full h-[450px] rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-soft-sm">
              <iframe
                src={getEmbedUrl(lesson.slide_url)}
                title="สไลด์การสอน"
                className="w-full h-full border-0"
                allowFullScreen
              />
            </div>
          </div>
        )}

        {/* 3. Video / Audio / Game */}
        {lesson.video_url && (
          <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-soft-sm space-y-3">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <Video className="w-4 h-4 text-rose-500" /> 3. สื่อประกอบการเรียนรู้ (วิดีโอ/เสียง/เกม)
            </h3>
            <div className={`w-full ${lesson.video_url.includes('digital-board-game') ? 'h-[650px]' : 'aspect-video'} rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 shadow-soft-sm flex items-center justify-center`}>
              {lesson.video_url.toLowerCase().endsWith('.mp3') || lesson.video_url.toLowerCase().endsWith('.wav') ? (
                <div className="w-full p-8 bg-slate-800 h-full flex flex-col items-center justify-center space-y-4">
                  <Video className="w-12 h-12 text-slate-400" />
                  <audio controls src={lesson.video_url} className="w-full max-w-md" />
                </div>
              ) : lesson.video_url.toLowerCase().endsWith('.mp4') || lesson.video_url.toLowerCase().endsWith('.webm') ? (
                <video controls src={lesson.video_url} className="w-full h-full object-contain bg-black" />
              ) : (
                <iframe
                  src={getEmbedUrl(lesson.video_url)}
                  title="สื่อประกอบการเรียนรู้"
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              )}
            </div>
          </div>
        )}

        {/* 4. Finish Lesson */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-white via-slate-50 to-primary-light/30 border border-primary/20 shadow-soft-md space-y-4">
          <div className="space-y-1">
            <h3 className="font-extrabold text-sm text-slate-800">✅ 4. สรุปบทเรียน (Lesson Summary)</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {canFinish 
                ? `เรียนครบเนื้อหาบทที่ ${lesson.chapter_number} แล้ว! กดปุ่มด้านล่างเพื่อบันทึกการเรียนจบ`
                : 'กรุณาเลื่อนลงมาศึกษาเนื้อหาให้ครบทุกส่วนก่อน จึงจะสามารถกดบันทึกการเรียนจบได้'
              }
            </p>
          </div>

          <div className="flex items-center justify-between pt-2">
            <Link href="/student/lessons" className="text-xs font-bold text-slate-500 hover:text-slate-800">
              ← ย้อนกลับ
            </Link>

            <button
              onClick={handleFinishLesson}
              disabled={!canFinish}
              className={`px-6 py-3 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
                isCompleted
                  ? 'bg-emerald-500 text-white shadow-soft-sm'
                  : canFinish
                    ? 'bg-primary text-white hover:bg-primary-hover shadow-soft-md'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              {isCompleted ? (
                <><CheckCircle2 className="w-4 h-4 text-white" /> เรียนจบแล้ว ✓</>
              ) : canFinish ? (
                <>กดเพื่อเรียนจบ <ArrowRight className="w-4 h-4" /></>
              ) : (
                <>เลื่อนลงมาให้สุด ⬇️</>
              )}
            </button>
          </div>
        </div>

        {/* Target สำหรับเช็คการ Scroll ถึงล่างสุด */}
        <div ref={bottomRef} className="h-4 w-full" />
      </div>
    </div>
  );
}
