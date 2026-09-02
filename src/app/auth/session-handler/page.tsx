'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Loader2, Compass } from 'lucide-react';

export default function SessionHandlerPage() {
  const router = useRouter();
  const [status, setStatus] = useState('กำลังตรวจสอบ...');

  useEffect(() => {
    let isDone = false;

    const navigateUser = async (sessionUser: any) => {
      if (isDone) return;
      isDone = true;
      setStatus('เข้าสู่ระบบสำเร็จ! 🎉 กำลังนำไปยังหน้าหลัก...');

      try {
        const { data: student } = await supabase
          .from('students')
          .select('id')
          .eq('id', sessionUser.id)
          .maybeSingle();

        if (student) {
          router.replace('/student/dashboard');
        } else {
          window.location.replace('/student/complete-profile?refresh=' + Date.now());
        }
      } catch (e) {
        router.replace('/student/dashboard');
      }
    };

    // 1. ตรวจสอบ session ปัจจุบันทันที
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        navigateUser(session.user);
      }
    });

    // 2. ถ้ามี code query param (PKCE flow) ให้ exchange session
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ data, error }) => {
        if (data?.session?.user) {
          navigateUser(data.session.user);
        }
      });
    }

    // 3. ฟังเหตุการณ์ onAuthStateChange (รองรับ Implicit & PKCE flow ทุกกรณี)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        navigateUser(session.user);
      }
    });

    // 4. รอสูงสุด 8 วินาที หากไม่มี session จริงๆ ค่อยกลับหน้า login
    const timer = setTimeout(() => {
      if (!isDone) {
        setStatus('ไม่พบเซสชัน กำลังกลับสู่หน้าเข้าสู่ระบบ...');
        setTimeout(() => router.replace('/student/login'), 1200);
      }
    }, 8000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
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
