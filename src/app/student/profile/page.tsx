'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import StudentSidebar from '@/components/layout/StudentSidebar';
import Link from 'next/link';
import { Loader2, Save, CheckCircle2, User, Trophy, Clock, Medal } from 'lucide-react';
import { useLearningStore } from '@/lib/store/useLearningStore';

const AVATAR_OPTIONS = [
  { id: 'google', label: 'รูปโปรไฟล์เดิม', img: '' },
  { id: 'boy', label: 'นักเรียนชาย', img: '/images/student-avatar-boy.jpg' },
  { id: 'girl', label: 'นักเรียนหญิง', img: '/images/student-avatar.jpg' }
];

export default function StudentProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [googleUser, setGoogleUser] = useState<{ name: string; email: string; avatar: string } | null>(null);
  const [studentData, setStudentData] = useState<{ id: string, number: number, class_name: string, avatar_url: string } | null>(null);
  const [selectedAvatar, setSelectedAvatar] = useState('google');

  const { completedLessons, preKnowledgeResult, postKnowledgeResult, gameResult } = useLearningStore();

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/student/login'); return; }

      setGoogleUser({
        name: user.user_metadata?.full_name || user.user_metadata?.name || 'นักเรียน',
        email: user.email || '',
        avatar: user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
      });

      const currentAvatar = user.user_metadata?.custom_avatar;
      if (currentAvatar === '/images/student-avatar-boy.jpg') {
        setSelectedAvatar('boy');
      } else if (currentAvatar === '/images/student-avatar.jpg') {
        setSelectedAvatar('girl');
      } else {
        setSelectedAvatar('google');
      }

      const { data: student } = await supabase
        .from('students')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (student) {
        setStudentData(student);
      }
      setLoading(false);
    }
    loadData();
  }, [router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentData) return;
    setSaving(true);
    setError('');
    setSuccess('');

    const finalAvatar = selectedAvatar === 'google' ? (googleUser?.avatar || '') : AVATAR_OPTIONS.find(a => a.id === selectedAvatar)?.img;

    // Update avatar in auth metadata instead of students table
    const { error: authError } = await supabase.auth.updateUser({
      data: { custom_avatar: finalAvatar }
    });

    if (authError) {
      console.error("Supabase Error:", authError);
      setError(`เกิดข้อผิดพลาดในการบันทึกข้อมูล: ${authError.message}`);
    } else {
      setSuccess('อัปเดตข้อมูลส่วนตัวสำเร็จ!');
      setTimeout(() => setSuccess(''), 3000);
      
      // Update global navbar by forcing a refresh or state sync if needed.
      // We don't overwrite googleUser.avatar because it represents the original Google photo.
    }
    setSaving(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/student/login');
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-[#F8FAFC] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden font-sans">
      <StudentSidebar />

      <div className="flex-1 flex flex-col h-full overflow-hidden">


        {/* Main Content Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-4xl mx-auto space-y-8">
            
            {/* Header */}
            <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">ข้อมูลส่วนตัว</h1>
              <p className="text-slate-500 font-medium mt-1">จัดการโปรไฟล์และการตั้งค่าบัญชีของคุณ</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              {/* Left Column: Form */}
              <div className="md:col-span-2 space-y-6">
                <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
                  <form onSubmit={handleSave} className="space-y-6">
                    
                    {/* Avatar Selection */}
                    <div>
                      <label className="text-sm font-black text-slate-800 block mb-4">เลือกรูปโปรไฟล์</label>
                      <div className="flex flex-wrap items-center gap-4">
                        {AVATAR_OPTIONS.map((option) => (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => setSelectedAvatar(option.id)}
                            className={`relative w-24 h-24 rounded-[1.5rem] border-4 transition-all overflow-hidden ${selectedAvatar === option.id ? 'border-primary shadow-md transform scale-105' : 'border-slate-100 hover:border-primary/30 opacity-70 hover:opacity-100'}`}
                          >
                            {option.id === 'google' ? (
                              googleUser?.avatar ? (
                                <img src={googleUser.avatar} alt="Google" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-slate-200 flex items-center justify-center font-black text-2xl text-slate-500">{googleUser?.name?.[0]}</div>
                              )
                            ) : (
                              <img src={option.img} alt={option.label} className="w-full h-full object-cover bg-white" />
                            )}
                            {selectedAvatar === option.id && (
                              <div className="absolute top-1 right-1 bg-white rounded-full">
                                <CheckCircle2 className="w-5 h-5 text-primary" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    <hr className="border-slate-100" />

                    {/* Form Fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label className="text-xs font-bold text-slate-500 block mb-2">ชื่อ - นามสกุล (อิงจาก Google)</label>
                        <div className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-700">
                          {googleUser?.name}
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 block mb-2">อีเมล (Google)</label>
                        <div className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-700">
                          {googleUser?.email}
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 block mb-2">เลขที่</label>
                        <div className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-700">
                          {studentData?.number}
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 block mb-2">ระดับชั้น</label>
                        <div className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-700">
                          {studentData?.class_name}
                        </div>
                      </div>
                    </div>

                    {error && <p className="text-sm text-red-500 font-bold bg-red-50 p-3 rounded-lg">{error}</p>}
                    {success && <p className="text-sm text-emerald-500 font-bold bg-emerald-50 p-3 rounded-lg">{success}</p>}

                    <div className="flex justify-end pt-4">
                      <button
                        type="submit"
                        disabled={saving}
                        className="btn-primary py-3 px-8 flex items-center gap-2"
                      >
                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        {saving ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Right Column: Stats */}
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-primary to-purple-600 rounded-[2rem] p-6 text-white shadow-md relative overflow-hidden">
                  <div className="absolute -right-4 -bottom-4 opacity-10">
                    <Trophy className="w-32 h-32" />
                  </div>
                  <h3 className="font-bold text-sm text-white/80 mb-4 flex items-center gap-2">
                    <Medal className="w-4 h-4" /> สรุปผลงาน
                  </h3>
                  <div className="space-y-4 relative z-10">
                    <div className="flex justify-between items-center bg-white/10 rounded-xl p-3 backdrop-blur-sm border border-white/10">
                      <span className="text-sm font-medium">บทเรียนที่สำเร็จ</span>
                      <span className="text-xl font-black">{completedLessons.length}</span>
                    </div>
                    <div className="flex justify-between items-center bg-white/10 rounded-xl p-3 backdrop-blur-sm border border-white/10">
                      <span className="text-sm font-medium">แบบทดสอบที่ทำแล้ว</span>
                      <span className="text-xl font-black">{[preKnowledgeResult, postKnowledgeResult].filter(Boolean).length}/2</span>
                    </div>
                    <div className="flex justify-between items-center bg-white/10 rounded-xl p-3 backdrop-blur-sm border border-white/10">
                      <span className="text-sm font-medium">คะแนนเกมสะสม</span>
                      <span className="text-xl font-black">{gameResult?.score || 0}</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
