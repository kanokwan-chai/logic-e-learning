'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Compass, Loader2, Save, CheckCircle2 } from 'lucide-react';

const AVATAR_OPTIONS = [
  { id: 'google', label: 'รูปโปรไฟล์เดิม', img: '' },
  { id: 'boy', label: 'นักเรียนชาย', img: '/images/student-avatar-boy.jpg' },
  { id: 'girl', label: 'นักเรียนหญิง', img: '/images/student-avatar.jpg' }
];

export default function CompleteProfilePage() {
  const router = useRouter();
  const [googleUser, setGoogleUser] = useState<{ name: string; email: string; avatar: string } | null>(null);
  const [seatNumber, setSeatNumber] = useState('');
  const [className, setClassName] = useState('ปวช.1 ธดท.');
  const [selectedAvatar, setSelectedAvatar] = useState('google');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.replace('/student/login'); return; }
      setGoogleUser({
        name: user.user_metadata?.full_name || user.user_metadata?.name || 'นักเรียน',
        email: user.email || '',
        avatar: user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
      });
    });
  }, [router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seatNumber || !className) { setError('กรุณากรอกข้อมูลให้ครบ'); return; }
    setSaving(true);
    setError('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace('/student/login'); return; }

    const finalAvatar = selectedAvatar === 'google' ? (googleUser?.avatar || '') : AVATAR_OPTIONS.find(a => a.id === selectedAvatar)?.img;

    // Upsert student profile into students table
    const { error: dbError } = await supabase.from('students').upsert({
      id: user.id,
      first_name: googleUser?.name.split(' ')[0] || 'นักเรียน',
      last_name: googleUser?.name.split(' ').slice(1).join(' ') || '',
      number: parseInt(seatNumber) || 0,
      class_name: className,
    });

    if (dbError) {
      setError(`เกิดข้อผิดพลาด กรุณาลองใหม่: ${dbError.message}`);
      setSaving(false);
      return;
    }

    // Update avatar in auth metadata
    await supabase.auth.updateUser({
      data: { custom_avatar: finalAvatar }
    });

    router.replace('/student/dashboard');
  };

  if (!googleUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 -mt-20">

        {/* Logo */}
        <div className="text-center space-y-3">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary via-primary-hover to-purple-700 flex items-center justify-center text-white shadow-soft-lg mx-auto border-b-4 border-purple-900 transition-transform hover:-translate-y-1">
            <Compass className="w-11 h-11" />
          </div>
          <div>
            <h1 className="font-black text-3xl text-slate-800 tracking-tight">
              Logic <span className="text-primary">E-Learning</span>
            </h1>
            <p className="text-sm text-slate-500 font-bold mt-1">ยินดีต้อนรับเข้าสู่ระบบ</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-4xl shadow-soft-lg border-2 border-slate-100 p-8 space-y-6">

          <div className="text-center space-y-1">
            <h2 className="font-extrabold text-xl text-slate-800">สร้างโปรไฟล์นักเรียน</h2>
            <p className="text-xs text-slate-500 font-medium">เลือกรูปประจำตัวและกรอกข้อมูลห้องเรียน</p>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            
            {/* Avatar Selection */}
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-3 text-center">เลือกรูปโปรไฟล์</label>
              <div className="flex items-center justify-center gap-4">
                {AVATAR_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedAvatar(opt.id)}
                    className={`relative w-20 h-20 rounded-2xl border-4 overflow-hidden transition-all duration-300 ${
                      selectedAvatar === opt.id 
                        ? 'border-primary shadow-soft-md shadow-primary/20 scale-105' 
                        : 'border-slate-100 hover:border-slate-200 hover:scale-105 grayscale hover:grayscale-0'
                    }`}
                  >
                    {opt.id === 'google' ? (
                      googleUser.avatar ? (
                        <img src={googleUser.avatar} alt="Google Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-slate-400 text-white flex items-center justify-center font-bold text-2xl">
                          {googleUser.name.charAt(0)}
                        </div>
                      )
                    ) : (
                      <img src={opt.img} alt={opt.label} className="w-full h-full object-cover" />
                    )}
                    {selectedAvatar === opt.id && (
                      <div className="absolute top-1 right-1 bg-white rounded-full p-0.5 shadow-sm">
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">เลขที่ในห้องเรียน <span className="text-rose-500">*</span></label>
                <input
                  type="number"
                  required
                  value={seatNumber}
                  onChange={(e) => setSeatNumber(e.target.value)}
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-bold text-slate-800 text-center text-lg shadow-inner"
                  placeholder="เช่น 15"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">ชั้นเรียน <span className="text-rose-500">*</span></label>
                <select
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-bold text-slate-700 shadow-inner appearance-none cursor-pointer"
                >
                  <option value="ปวช.1 ธดท.">ปวช.1 ธดท.</option>
                  <option value="ปวช.1 ชก.">ปวช.1 ชก.</option>
                  <option value="ปวช.1 ชฟ.">ปวช.1 ชฟ.</option>
                </select>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-xs font-bold text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-primary hover:bg-primary-hover text-white font-bold transition-all shadow-soft-sm hover:shadow-soft-md disabled:opacity-70 disabled:cursor-not-allowed group"
            >
              {saving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>บันทึกและเข้าสู่ระบบเรียน</span>
                  <span className="ml-2 text-primary-light/50 group-hover:translate-x-1 transition-transform">→</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
