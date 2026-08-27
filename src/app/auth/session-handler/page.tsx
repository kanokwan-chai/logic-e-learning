'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Loader2, Compass } from 'lucide-react';

export default function SessionHandlerPage() {
  const router = useRouter();
  const [status, setStatus] = useState('กำลังตรวจสอบ...');

  useEffect(() => {
    const getNextPath = (progress: any) => {
      if (!progress) return '/student/dashboard';
      if (!progress.preKnowledgeResult) return '/student/tests/pre_knowledge';
      if (!progress.preSkillResult) return '/student/tests/pre_skill';
      if (!progress.completedLessons || progress.completedLessons.length === 0) return '/student/lessons';
      if (!progress.gameResult) return '/student/game';
      if (!progress.postKnowledgeResult) return '/student/tests/post_knowledge';
      if (!progress.postSkillResult) return '/student/tests/post_skill';
      return '/student/dashboard';
    };

    const handle = async () => {
      // รอให้ Supabase parse URL และ exchange code เป็น session
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        setStatus('เกิดข้อผิดพลาด กำลังกลับหน้า login...');
        setTimeout(() => router.replace('/student/login'), 1500);
        return;
      }

      if (session) {
        setStatus('เข้าสู่ระบบสำเร็จ! กำลังนำไปยังหน้าเรียน...');

        // เช็คว่ากรอกข้อมูลห้องเรียนแล้วยัง พร้อมดึง progress
        const { data: student } = await supabase
          .from('students')
          .select('id, progress_data')
          .eq('id', session.user.id)
          .single();

        if (student) {
          router.replace(getNextPath(student.progress_data));
        } else {
          router.replace('/student/complete-profile');
        }
      } else {
        // รอ Supabase exchange code จาก URL query params
        setStatus('กำลัง exchange token...');

        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');

        if (code) {
          const { data, error: exchError } = await supabase.auth.exchangeCodeForSession(code);

          if (exchError || !data.session) {
            setStatus('เกิดข้อผิดพลาด กำลังกลับหน้า login...');
            setTimeout(() => router.replace('/student/login'), 1500);
            return;
          }

          // เช็คว่ากรอกข้อมูลห้องเรียนแล้วยัง พร้อมดึง progress
          const { data: student } = await supabase
            .from('students')
            .select('id, progress_data')
            .eq('id', data.session.user.id)
            .single();

          setStatus('เข้าสู่ระบบสำเร็จ! 🎉');

          if (student) {
            router.replace(getNextPath(student.progress_data));
          } else {
            router.replace('/student/complete-profile');
          }
        } else {
          setStatus('ไม่พบ session กำลังกลับหน้า login...');
          setTimeout(() => router.replace('/student/login'), 1500);
        }
      }
    };

    handle();
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/20 flex items-center justify-center p-4">
      <div className="text-center space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary via-primary-hover to-purple-700 flex items-center justify-center text-white shadow-soft-lg mx-auto border-b-4 border-purple-900">
          <Compass className="w-11 h-11" />
        </div>

        <div className="space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-sm font-bold text-slate-700">{status}</p>
          <p className="text-xs text-slate-400">Logic E-Learning กำลังตรวจสอบตัวตน...</p>
        </div>
      </div>
    </div>
  );
}
