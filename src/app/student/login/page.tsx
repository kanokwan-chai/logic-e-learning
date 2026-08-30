'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Compass, Loader2, ShieldCheck } from 'lucide-react';

export default function StudentLoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // ถ้า login แล้ว ให้ไปที่แดชบอร์ดหลักเสมอ
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace('/student/dashboard');
      }
    });
  }, [router]);

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);

    // ถ้า redirect ไม่เกิดใน 5 วินาที ให้ปุ่มกดได้ใหม่
    const fallback = setTimeout(() => setLoading(false), 5000);

    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/session-handler`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      if (authError) {
        clearTimeout(fallback);
        setError(`เกิดข้อผิดพลาด: ${authError.message}`);
        setLoading(false);
      }
      // ถ้าสำเร็จ browser จะ redirect ไปเอง ไม่ต้อง setLoading(false)
    } catch (e) {
      clearTimeout(fallback);
      setError(`ไม่สามารถเชื่อมต่อได้: ${String(e)}`);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 -mt-20">

        {/* Logo */}
        <div className="text-center space-y-3">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary via-primary-hover to-purple-700 flex items-center justify-center text-white shadow-soft-lg mx-auto border-b-4 border-purple-900">
            <Compass className="w-11 h-11" />
          </div>
          <div>
            <h1 className="font-black text-3xl text-slate-800 tracking-tight">
              Logic <span className="text-primary">E-Learning</span>
            </h1>
            <p className="text-sm text-slate-500 font-bold mt-1">ระบบเรียนรู้ตรรกศาสตร์ ปวช.</p>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-4xl shadow-soft-lg border-2 border-slate-100 p-8 space-y-6">
          <div className="text-center space-y-1">
            <h2 className="font-extrabold text-xl text-slate-800">เข้าสู่ระบบนักเรียน</h2>
            <p className="text-xs text-slate-500">ใช้บัญชี Google ของโรงเรียนหรือส่วนตัวได้เลย</p>
          </div>

          {/* Google Login Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl border-2 border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all shadow-soft-sm hover:shadow-soft-md font-bold text-slate-700 text-sm group disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            ) : (
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            <span>{loading ? 'กำลังเชื่อมต่อ...' : 'เข้าสู่ระบบด้วย Google'}</span>
            {!loading && <span className="ml-auto text-slate-300 group-hover:translate-x-0.5 transition-transform">→</span>}
          </button>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-bold">
              ⚠️ {error}
              <p className="font-normal mt-1 text-rose-600">ตรวจสอบว่ากด Save ใน Supabase แล้วหรือยัง?</p>
            </div>
          )}

          {/* Divider info */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-100" />
            <span className="text-[10px] text-slate-400 font-bold">ปลอดภัย เข้ารหัสทุกการเชื่อมต่อ</span>
            <div className="flex-1 h-px bg-slate-100" />
          </div>

          {/* Info cards */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: '🎮', label: 'เกมตรรกะ' },
              { icon: '📚', label: 'บทเรียน' },
              { icon: '🏆', label: 'เกียรติบัตร' },
            ].map((item) => (
              <div key={item.label} className="p-3 rounded-2xl bg-primary-light/50 text-center space-y-1">
                <span className="text-lg">{item.icon}</span>
                <p className="text-[10px] font-extrabold text-primary">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center space-y-2">
          <button 
            onClick={() => router.push('/auth/login')}
            className="text-[11px] text-slate-400 hover:text-slate-600 font-bold underline"
          >
            สำหรับคุณครูผู้สอน (Teacher Login)
          </button>
          
          <p className="text-[10px] text-slate-400 font-medium pt-2">
            Logic E-Learning © 2567 — ระบบเรียนรู้ตรรกศาสตร์สำหรับ ปวช.
          </p>
        </div>
      </div>
    </div>
  );
}
