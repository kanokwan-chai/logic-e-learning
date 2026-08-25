'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { ShieldCheck, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { loginAsTeacher } = useAuthStore();

  const [teacherUsername, setTeacherUsername] = useState('');
  const [teacherPassword, setTeacherPassword] = useState('');
  const [teacherError, setTeacherError] = useState('');

  const handleTeacherSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (teacherUsername === 'admin' && teacherPassword === '28962160') {
      setTeacherError('');
      loginAsTeacher('admin@logic.ac.th');
      // Set cookie so middleware can verify teacher session
      document.cookie = 'teacher_auth=authenticated; path=/; max-age=86400; SameSite=Strict';
      router.push('/teacher/dashboard');
    } else {
      setTeacherError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-4xl shadow-soft-lg border-2 border-slate-100 p-6 sm:p-8 relative overflow-hidden -mt-20">
        
        {/* Header */}
        <div className="text-center space-y-2 mb-8">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-primary via-primary-hover to-purple-700 flex items-center justify-center text-white shadow-soft-md mx-auto mb-4 border-b-4 border-purple-900">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="font-black text-2xl text-slate-800 tracking-tight flex items-center justify-center gap-2">
            ผู้ดูแลระบบ <span className="text-primary font-black">E-Learning</span>
          </h1>
          <p className="text-xs text-slate-500 font-bold">เข้าสู่ระบบสำหรับครูผู้สอน</p>
        </div>

        <form onSubmit={handleTeacherSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">ชื่อผู้ใช้ (Username)</label>
            <input
              type="text"
              value={teacherUsername}
              onChange={(e) => setTeacherUsername(e.target.value)}
              required
              placeholder="เช่น admin"
              className="w-full p-3 rounded-2xl border-2 border-slate-200 bg-slate-50 text-xs font-bold focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">รหัสผ่าน (Password)</label>
            <input
              type="password"
              value={teacherPassword}
              onChange={(e) => setTeacherPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full p-3 rounded-2xl border-2 border-slate-200 bg-slate-50 text-xs font-bold focus:outline-none focus:border-primary"
            />
          </div>

          {teacherError && (
            <div className="text-rose-500 text-xs font-bold text-center bg-rose-50 p-2 rounded-xl">
              {teacherError}
            </div>
          )}

          <button
            type="submit"
            className="btn-primary w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 mt-2 text-sm"
          >
            เข้าสู่ระบบ <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => router.push('/student/login')}
            className="text-[11px] text-slate-400 hover:text-slate-600 font-bold underline"
          >
            กลับไปหน้าเข้าเรียน (นักเรียน)
          </button>
        </div>
      </div>
    </div>
  );
}
