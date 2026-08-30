'use client';

import { useEffect, useState } from 'react';
import StudentSidebar from '@/components/layout/StudentSidebar';
import { useLearningStore } from '@/lib/store/useLearningStore';
import { useLessons } from '@/lib/hooks/useSupabaseContent';
import { useStudentAuth } from '@/lib/hooks/useStudentAuth';
import { supabase } from '@/lib/supabase/client';
import { fetchStudentDashboardData, DashboardStudentData } from '@/lib/supabase/db';
import Link from 'next/link';
import {
  BookOpen,
  Gamepad2,
  FileCheck2,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  Target,
  FileBadge,
  Loader2,
  Lock
} from 'lucide-react';
import { WeeklyActivityChart } from '@/components/teacher/AnalyticsCharts';
import LockedAlertModal from '@/components/ui/LockedAlertModal';

export default function StudentDashboardPage() {
  const [displayName, setDisplayName] = useState('');
  const [className, setClassName] = useState('');
  const [seatNumber, setSeatNumber] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [showLockedAlert, setShowLockedAlert] = useState(false);
  const [isUserLoading, setIsUserLoading] = useState(true);
  
  const { isHydrated } = useStudentAuth();
  const { completedLessons, preKnowledgeResult, preSkillResult, postKnowledgeResult, postSkillResult, gameResult } = useLearningStore();
  const [dbData, setDbData] = useState<DashboardStudentData | null>(null);

  const { lessons: allLessons, loading } = useLessons();
  const publishedLessons = allLessons.filter((l) => l.published);

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'นักเรียน';
      setDisplayName(name);

      const { data: student } = await supabase
        .from('students')
        .select('number, class_name')
        .eq('id', user.id)
        .single();

      if (student) {
        setClassName(student.class_name);
        setSeatNumber(String(student.number));
      }

      setAvatarUrl(user.user_metadata?.custom_avatar || user.user_metadata?.avatar_url || user.user_metadata?.picture || '/images/student-avatar.jpg');

      const data = await fetchStudentDashboardData(user.id);
      setDbData(data);

      setIsUserLoading(false);
    }
    loadUser();
  }, []);

  const preKnowledgeScore = dbData?.preKnowledgeScore ?? preKnowledgeResult?.score ?? null;
  const preSkillScore = dbData?.preSkillScore ?? preSkillResult?.score ?? null;
  const postKnowledgeScore = dbData?.postKnowledgeScore ?? postKnowledgeResult?.score ?? null;
  const postSkillScore = dbData?.postSkillScore ?? postSkillResult?.score ?? null;
  const gameScore = dbData?.gameScore ?? gameResult?.score ?? null;
  const currentCompletedLessons = dbData?.completedLessons?.length ? dbData.completedLessons : completedLessons;

  const completionPercent = publishedLessons.length > 0
    ? Math.round((currentCompletedLessons.filter((id: string) => publishedLessons.some((l) => l.id === id)).length / publishedLessons.length) * 100)
    : 0;

  const totalTimeSpent = dbData?.totalMinutes ? dbData.totalMinutes * 60 : useLearningStore.getState().totalStudyTimeSec;

  const quests = [
    { title: 'ก่อนเรียน (ความรู้)', isDone: preKnowledgeScore !== null, href: '/student/tests/pre_knowledge', isLocked: false },
    { title: 'ก่อนเรียน (ทักษะ)', isDone: preSkillScore !== null, href: '/student/tests/pre_skill', isLocked: preKnowledgeScore === null },
    { title: 'บทเรียนตรรกศาสตร์', isDone: currentCompletedLessons.length >= 1, href: '/student/lessons', isLocked: false },
    { title: 'Digital Board Game Mission', isDone: gameScore !== null, href: '/student/game', isLocked: false },
    { title: 'หลังเรียน (ความรู้)', isDone: postKnowledgeScore !== null, href: '/student/tests/post_knowledge', isLocked: gameScore === null },
    { title: 'หลังเรียน (ทักษะ)', isDone: postSkillScore !== null, href: '/student/tests/post_skill', isLocked: postKnowledgeScore === null },
  ];

  const completedQuestsCount = quests.filter((q) => q.isDone).length;
  const isAllQuestsDone = completedQuestsCount === quests.length;

  if (!isHydrated || isUserLoading) {
    return (
      <div className="min-h-screen md:flex md:h-screen bg-[#F8FAFC] md:overflow-hidden font-sans">
        <StudentSidebar />
        <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-[#4285F4]" />
          <p className="text-sm font-bold text-slate-500">กำลังโหลดข้อมูลแดชบอร์ด...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen md:flex md:h-screen bg-[#F8FAFC] md:overflow-hidden font-sans">
      <StudentSidebar />

      <div className="flex-1 flex flex-col md:h-full overflow-hidden">

        {/* Main Content Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            
            {/* Banner Header (Full Width) */}
            <div className="bg-[#4285F4] rounded-[2rem] p-8 md:p-10 text-white relative overflow-hidden shadow-[0_10px_40px_rgba(66,133,244,0.2)] flex flex-col md:flex-row justify-between items-center">
              <div className="absolute top-10 right-20 w-40 h-24 bg-white/20 rounded-full blur-2xl pointer-events-none"></div>
              
              {/* Text and Progress */}
              <div className="relative z-10 w-full md:w-[60%] space-y-5">
                <span className="inline-block bg-white/20 backdrop-blur-md border border-white/30 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-sm tracking-wide">
                  ✨ แดชบอร์ดนักเรียน
                </span>
                <h1 className="text-3xl md:text-[2.75rem] lg:text-5xl font-black leading-relaxed tracking-wide drop-shadow-sm">
                  บทเรียนตรรกศาสตร์
                </h1>
                <p className="text-sm md:text-base text-blue-50/90 font-medium leading-relaxed max-w-lg tracking-wide">
                  ตรวจสอบความคืบหน้า คะแนนแบบทดสอบ และเข้าเรียนบทเรียนต่างๆ ได้จากหน้านี้
                </p>
                
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <a
                    href="https://digital-board-game-eight.vercel.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-blue-600 hover:bg-blue-50 font-black text-sm shadow-lg hover:scale-105 transition-all"
                  >
                    <Gamepad2 className="w-5 h-5 text-purple-600" /> เข้าเล่น Digital Board Game 🎮
                  </a>
                  <Link
                    href="/student/lessons"
                    className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/40 text-white font-bold text-sm shadow-sm transition-all"
                  >
                    <BookOpen className="w-5 h-5" /> ดูบทเรียน 📖
                  </Link>
                </div>
              </div>

              {/* 3D Student Character Image */}
              <div className="relative z-10 w-48 h-48 md:w-64 md:h-64 mt-8 md:mt-0 transform hover:scale-105 transition-transform duration-300 shrink-0">
                <div className="w-full h-full rounded-full overflow-hidden shadow-2xl border-4 border-white/30 backdrop-blur-sm bg-white/10">
                  <img src="/images/logic-avatar.jpg" alt="Logic Detective Avatar" className="w-full h-full object-cover" />
                </div>
              </div>
            </div>

            <div className="flex flex-col xl:flex-row gap-8">
              
              {/* Center Column */}
              <div className="flex-1 space-y-8">
                
              {/* Tabs */}
              <div className="flex items-center gap-8 border-b border-slate-200 px-4">
                <Link href="/student/dashboard" className="pb-4 font-bold text-[#4285F4] border-b-2 border-[#4285F4] flex items-center gap-2">
                  <BookOpen className="w-4 h-4" /> สรุปผล
                </Link>
                <Link href="/student/tests/pre_knowledge" className="pb-4 font-bold text-slate-400 hover:text-[#4285F4] flex items-center gap-2 transition-colors">
                  <FileCheck2 className="w-4 h-4" /> แบบทดสอบ
                </Link>
                <Link href="/student/game" className="pb-4 font-bold text-slate-400 hover:text-[#4285F4] flex items-center gap-2 transition-colors">
                  <Gamepad2 className="w-4 h-4" /> เกม
                </Link>
                <Link href="/student/badges" className="pb-4 font-bold text-slate-400 hover:text-[#4285F4] flex items-center gap-2 transition-colors">
                  <Target className="w-4 h-4" /> ภารกิจ
                </Link>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#4285F4]"></div>
                <h3 className="font-bold text-slate-800 text-lg">สถิติการเรียนรู้ทั้ง 5 ด้าน</h3>
              </div>

              {/* Stats Grid — แยกความรู้/ทักษะ */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">

                {/* Pre ความรู้: Green */}
                <Link href="/student/tests/pre_knowledge" className="bg-[#F0FDF4] border border-[#DCFCE7] rounded-3xl p-3 sm:p-4 flex flex-col items-center text-center shadow-sm hover:-translate-y-1 transition-transform cursor-pointer group">
                  <div className="w-12 h-12 rounded-full bg-white text-[#16A34A] text-2xl flex items-center justify-center shadow-sm mb-2 group-hover:scale-110 transition-transform">📝</div>
                  <h4 className="font-bold text-[#16A34A] text-xs mb-0.5">Pre — ความรู้</h4>
                  <p className="text-[9px] text-slate-500 font-medium mb-2">ก่อนเรียน (Knowledge)</p>
                  <div className="bg-white px-2 py-1.5 rounded-lg text-[#16A34A] font-black text-xs w-full border border-[#DCFCE7]">
                    {preKnowledgeScore !== null ? `${preKnowledgeScore}/20` : '—'}
                  </div>
                </Link>

                {/* Pre ทักษะ: Teal */}
                <Link href="/student/tests/pre_skill" className="bg-[#F0FDFA] border border-[#CCFBF1] rounded-3xl p-3 sm:p-4 flex flex-col items-center text-center shadow-sm hover:-translate-y-1 transition-transform cursor-pointer group">
                  <div className="w-12 h-12 rounded-full bg-white text-[#0D9488] text-2xl flex items-center justify-center shadow-sm mb-2 group-hover:scale-110 transition-transform">✏️</div>
                  <h4 className="font-bold text-[#0D9488] text-xs mb-0.5">Pre — ทักษะ</h4>
                  <p className="text-[9px] text-slate-500 font-medium mb-2">ก่อนเรียน (Skill)</p>
                  <div className="bg-white px-2 py-1.5 rounded-lg text-[#0D9488] font-black text-xs w-full border border-[#CCFBF1]">
                    {preSkillScore !== null ? `${preSkillScore}/20` : '—'}
                  </div>
                </Link>

                {/* Post ความรู้: Orange */}
                <Link href="/student/tests/post_knowledge" className="bg-[#FFF7ED] border border-[#FFEDD5] rounded-3xl p-3 sm:p-4 flex flex-col items-center text-center shadow-sm hover:-translate-y-1 transition-transform cursor-pointer group">
                  <div className="w-12 h-12 rounded-full bg-white text-[#EA580C] text-2xl flex items-center justify-center shadow-sm mb-2 group-hover:scale-110 transition-transform">🏆</div>
                  <h4 className="font-bold text-[#EA580C] text-xs mb-0.5">Post — ความรู้</h4>
                  <p className="text-[9px] text-slate-500 font-medium mb-2">หลังเรียน (Knowledge)</p>
                  <div className="bg-white px-2 py-1.5 rounded-lg text-[#EA580C] font-black text-xs w-full border border-[#FFEDD5]">
                    {postKnowledgeScore !== null ? `${postKnowledgeScore}/20` : '—'}
                  </div>
                </Link>

                {/* Post ทักษะ: Rose */}
                <Link href="/student/tests/post_skill" className="bg-[#FFF1F2] border border-[#FFE4E6] rounded-3xl p-3 sm:p-4 flex flex-col items-center text-center shadow-sm hover:-translate-y-1 transition-transform cursor-pointer group">
                  <div className="w-12 h-12 rounded-full bg-white text-[#E11D48] text-2xl flex items-center justify-center shadow-sm mb-2 group-hover:scale-110 transition-transform">🎯</div>
                  <h4 className="font-bold text-[#E11D48] text-xs mb-0.5">Post — ทักษะ</h4>
                  <p className="text-[9px] text-slate-500 font-medium mb-2">หลังเรียน (Skill)</p>
                  <div className="bg-white px-2 py-1.5 rounded-lg text-[#E11D48] font-black text-xs w-full border border-[#FFE4E6]">
                    {postSkillScore !== null ? `${postSkillScore}/20` : '—'}
                  </div>
                </Link>

                {/* Game: Purple */}
                <a 
                  href="https://digital-board-game-eight.vercel.app" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="bg-[#FAF5FF] border border-[#F3E8FF] rounded-3xl p-3 sm:p-4 flex flex-col items-center text-center shadow-sm hover:-translate-y-1 transition-transform cursor-pointer group"
                >
                  <div className="w-12 h-12 rounded-full bg-white text-[#9333EA] text-2xl flex items-center justify-center shadow-sm mb-2 group-hover:scale-110 transition-transform">🎮</div>
                  <h4 className="font-bold text-[#9333EA] text-xs mb-0.5">บอร์ดเกม</h4>
                  <p className="text-[9px] text-slate-500 font-medium mb-2">แต้มจากการเล่น</p>
                  <div className="bg-white px-2 py-1.5 rounded-lg text-[#9333EA] font-black text-xs w-full border border-[#F3E8FF]">
                    {gameScore !== null ? `${gameScore}` : '—'}
                  </div>
                </a>

                {/* Time + Quests combined: Blue */}
                <Link href="/student/badges" className="bg-[#EFF6FF] border border-[#DBEAFE] rounded-3xl p-3 sm:p-4 flex flex-col items-center text-center shadow-sm hover:-translate-y-1 transition-transform cursor-pointer group">
                  <div className="w-12 h-12 rounded-full bg-white text-[#2563EB] text-2xl flex items-center justify-center shadow-sm mb-2 group-hover:scale-110 transition-transform">⏳</div>
                  <h4 className="font-bold text-[#2563EB] text-xs mb-0.5">เวลา / เควส</h4>
                  <p className="text-[9px] text-slate-500 font-medium mb-2">เวลาสะสม / ภารกิจ</p>
                  <div className="bg-white px-2 py-1.5 rounded-lg text-[#2563EB] font-black text-xs w-full border border-[#DBEAFE]">
                    {Math.floor(totalTimeSpent / 60)} นาที · {dbData?.questsCompleted ?? completedQuestsCount}/{quests.length}
                  </div>
                </Link>

              </div>

              {/* Bottom Section similar to "ตัวอย่างสถานการณ์" */}
              <div className="bg-white border border-[#DBEAFE] rounded-[2rem] p-6 shadow-sm flex items-start gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#EFF6FF] rounded-bl-full -mr-8 -mt-8"></div>
                <div className="w-12 h-12 bg-[#EFF6FF] rounded-2xl flex items-center justify-center text-[#2563EB] shrink-0 border border-[#DBEAFE]">
                  <Target className="w-6 h-6" />
                </div>
                <div className="relative z-10">
                  <h4 className="font-bold text-[#2563EB] text-sm mb-2">ภารกิจต่อไปของคุณ</h4>
                  <p className="text-slate-700 font-black text-lg mb-1">"{quests.find(q => !q.isDone && !q.isLocked)?.title || 'เรียนจบครบทุกภารกิจแล้ว!🎉'}"</p>
                  <div className="flex items-center gap-6 mt-4">
                    <span className="text-xs font-bold text-slate-500"><span className="text-[#2563EB]">สถานะ:</span> {isAllQuestsDone ? 'สำเร็จ' : 'กำลังดำเนินการ'}</span>
                    <span className="text-xs font-bold text-slate-500"><span className="text-[#2563EB]">เป้าหมาย:</span> ปลดล็อกเกียรติบัตร</span>
                  </div>
                </div>
                {/* Placeholder for small icon bottom right */}
                <div className="absolute bottom-4 right-8 text-4xl opacity-80">🎯</div>
              </div>
            </div>

            {/* Right Column */}
            <div className="w-full xl:w-[320px] shrink-0 space-y-6">
              
              {/* Lessons List (หัวข้อบทเรียน) */}
              <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
                <h3 className="text-sm font-bold text-slate-800 mb-4">หัวข้อบทเรียน</h3>
                <div className="space-y-1">
                  {loading ? (
                    <div className="flex justify-center p-4"><Loader2 className="w-5 h-5 animate-spin text-slate-300" /></div>
                  ) : publishedLessons.map((les, index) => {
                    const isCompleted = completedLessons.includes(les.id);
                    const isLocked = quests[2].isLocked;
                    return (
                      <Link
                        key={les.id}
                        href={isLocked ? '#' : `/student/lessons/${les.id}`}
                        onClick={(e) => { if (isLocked) { e.preventDefault(); setShowLockedAlert(true); } }}
                        className={`flex items-center justify-between p-3 rounded-xl transition-colors ${isCompleted ? 'bg-white' : isLocked ? 'bg-white' : 'bg-blue-50/50'}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] border ${isCompleted ? 'bg-[#16A34A] text-white border-[#16A34A]' : isLocked ? 'bg-white border-slate-200 text-slate-400' : 'bg-white border-[#4285F4] text-[#4285F4]'}`}>
                            {isCompleted ? '✓' : isLocked ? <Lock className="w-2.5 h-2.5" /> : <div className="w-1.5 h-1.5 rounded-full bg-[#4285F4]"></div>}
                          </span>
                          <span className={`text-xs font-bold ${isCompleted ? 'text-slate-600' : isLocked ? 'text-slate-400' : 'text-[#4285F4]'}`}>{index + 1}. {les.title}</span>
                        </div>
                        {!isLocked && !isCompleted && <div className="w-5 h-5 rounded-full bg-[#4285F4] text-white flex items-center justify-center text-[10px]">▶</div>}
                        {isCompleted && <div className="w-5 h-5 rounded-full bg-[#16A34A] text-white flex items-center justify-center text-[10px]">✓</div>}
                        {isLocked && <Lock className="w-3.5 h-3.5 text-slate-300" />}
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Recommended Activities (กิจกรรมแนะนำ) */}
              {/* Recommended Activities (กิจกรรมแนะนำ) */}
              <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-slate-800">กิจกรรมแนะนำ</h3>
                  <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-2 py-1 rounded-md flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> แนะนำ
                  </span>
                </div>
                <div className="space-y-3">
                  <Link href="/student/certificate" className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all group">
                    <div className="w-10 h-10 rounded-full bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0">
                      <FileBadge className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 group-hover:text-[#2563EB]">รับเกียรติบัตร</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{isAllQuestsDone ? 'ปลดล็อกแล้ว' : `ต้องการ ${completedQuestsCount}/${quests.length} เควส`}</p>
                    </div>
                  </Link>
                  <a 
                    href="https://digital-board-game-eight.vercel.app" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-purple-200 hover:bg-purple-50/50 transition-all group"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#FAF5FF] text-[#9333EA] flex items-center justify-center shrink-0">
                      <Gamepad2 className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 group-hover:text-[#9333EA]">บอร์ดเกม</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">ทดสอบความเข้าใจของคุณ! (เปิดหน้าต่างใหม่ ↗)</p>
                    </div>
                  </a>
                </div>
              </div>



            </div>
          </div>
        </div>
      </div>
      </div>
      <LockedAlertModal isOpen={showLockedAlert} onClose={() => setShowLockedAlert(false)} />
    </div>
  );
}
