'use client';

import { useState, useEffect } from 'react';
import StudentSidebar from '@/components/layout/StudentSidebar';
import { useLearningStore } from '@/lib/store/useLearningStore';
import { useLessons } from '@/lib/hooks/useSupabaseContent';
import { useStudentAuth } from '@/lib/hooks/useStudentAuth';
import { Gamepad2, Sparkles, HelpCircle, ExternalLink, Trophy, Lock, BookOpen, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { saveGameResultToDB } from '@/lib/supabase/db';
import type { User } from '@supabase/supabase-js';
import Link from 'next/link';

function hashEmailToNumber(email: string): number {
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = (hash << 5) - hash + email.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 1000000;
}

export default function DigitalBoardGamePage() {
  const { isHydrated } = useStudentAuth();
  const { gameResult, saveGameResult, completedLessons } = useLearningStore();
  const { lessons: allLessons, loading: lessonsLoading } = useLessons();
  const publishedLessons = allLessons.filter((l) => l.published);

  const isAllLessonsCompleted = publishedLessons.length > 0 
    ? publishedLessons.every((l) => completedLessons.includes(l.id))
    : completedLessons.length >= 1;

  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [realScore, setRealScore] = useState<number>(gameResult?.score || 0);

  useEffect(() => {
    async function loadUserAndScore() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setGoogleUser(user);

        // ดึงคะแนนจริงจากฐานข้อมูลบอร์ดเกม Supabase (mpquqdoccadpxjvufcud)
        try {
          const { createClient } = await import('@supabase/supabase-js');
          const boardGameClient = createClient(
            'https://mpquqdoccadpxjvufcud.supabase.co',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wcXVxZG9jY2FkcHhqdnVmY3VkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU2NzMxMTQsImV4cCI6MjEwMTI0OTExNH0.9oc5PP4sNqkmZpTZJDvIQGf2-1c7WU-_AZQ0gBcNKCo'
          );

          // คำนวณ student_number แบบเดียวกับที่เกมคำนวณ
          const emailOrId = user.email || user.id;
          const studentEmail = emailOrId.includes('@') ? emailOrId : `${emailOrId}@student.local`;
          const studentNum = hashEmailToNumber(studentEmail);

          // 1. ค้นหาจาก number ที่ตรงกับ session ในเกม
          const { data: exactStudent } = await boardGameClient
            .from('students')
            .select('id, name, number')
            .eq('number', studentNum)
            .maybeSingle();

          let targetStudentId = exactStudent?.id;

          // 2. ถ้าไม่เจอ ให้ค้นหาจากชื่อ
          if (!targetStudentId) {
            const { data: currentStudent } = await supabase
              .from('students')
              .select('first_name, last_name')
              .eq('id', user.id)
              .single();

            if (currentStudent) {
              const fullName = `${currentStudent.first_name || ''} ${currentStudent.last_name || ''}`.trim().toLowerCase();
              const { data: bgStudents } = await boardGameClient.from('students').select('id, name');
              const matching = (bgStudents || []).filter(
                (b) => b.name && (
                  b.name.toLowerCase().includes(fullName) ||
                  fullName.includes(b.name.toLowerCase()) ||
                  b.name.toLowerCase().includes((currentStudent.first_name || '').toLowerCase())
                )
              );
              if (matching.length > 0) {
                targetStudentId = matching[0].id;
              }
            }
          }

          if (targetStudentId) {
            const { data: bgResults } = await boardGameClient
              .from('game_results')
              .select('score, level_completed, completed_at')
              .eq('student_id', targetStudentId)
              .order('completed_at', { ascending: false });

            if (bgResults && bgResults.length > 0) {
              const latestScore = Number(bgResults[0].score) || 0;
              const maxScore = Math.max(...bgResults.map((r) => Number(r.score) || 0));
              const finalScore = latestScore > 0 ? latestScore : maxScore;

              if (finalScore > 0) {
                setRealScore(finalScore);
                saveGameResultToDB(user.id, {
                  id: 'game-synced',
                  user_id: user.id,
                  score: finalScore,
                  stages_cleared: 5,
                  attempts: bgResults.length,
                  time_spent_sec: 600,
                  created_at: new Date().toISOString(),
                });
              }
            }
          }
        } catch (e) {
          // fallback
        }
      }
    }

    loadUserAndScore();
  }, []);

  const googleName = googleUser?.user_metadata?.full_name || googleUser?.user_metadata?.name || googleUser?.email?.split('@')[0] || 'นักเรียน';
  const googleId = googleUser?.id || 's-101';

  const handleSaveGameResult = async (gameObj: any) => {
    saveGameResult(gameObj);
    setRealScore(gameObj.score || 0);

    const { data: { user } } = await supabase.auth.getUser();
    const uid = user?.id || googleId;
    if (uid && uid !== 's-101') {
      await saveGameResultToDB(uid, gameObj);
    }
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'BOARD_GAME_COMPLETED') {
        const payload = event.data.payload;
        handleSaveGameResult({
          id: `game-${Date.now()}`,
          user_id: googleId,
          score: payload.score || 0,
          time_spent_sec: payload.timeSpent || 600,
          attempts: payload.attempts || 1,
          stages_cleared: payload.stagesCleared || 5,
          created_at: new Date().toISOString(),
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [googleId, saveGameResult]);

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#F8FAFC] font-sans md:flex md:h-[calc(100vh-80px)] md:overflow-hidden">
      <StudentSidebar />

      <div className="flex-1 flex flex-col md:h-full overflow-hidden">
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-6">
          <div className="w-full space-y-5 pb-16">

            {/* Loading */}
            {!isHydrated || lessonsLoading ? (
              <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-xs font-bold text-slate-400">กำลังตรวจสอบข้อมูลบทเรียน...</p>
              </div>
            ) : !isAllLessonsCompleted ? (
              /* Locked Screen if Lessons are not completed */
              <div className="p-8 sm:p-12 rounded-4xl bg-white border-2 border-amber-200 shadow-soft-lg text-center space-y-6 max-w-xl mx-auto my-8">
                <div className="w-20 h-20 rounded-3xl bg-amber-50 text-amber-500 mx-auto flex items-center justify-center shadow-inner">
                  <Lock className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-black text-slate-800">เกมกระดานยังถูกล็อกอยู่! 🎮</h2>
                  <p className="text-sm text-slate-600 font-medium leading-relaxed max-w-md mx-auto">
                    คุณต้องเรียนบทเรียนตรรกศาสตร์ให้ครบทุกบทก่อน จึงจะสามารถเข้าสู่ภารกิจ <strong>Digital Board Game</strong> ได้ค่ะ
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-blue-600" /> สถานะการเรียนบทเรียน:
                  </span>
                  <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 font-black">
                    {completedLessons.length} / {publishedLessons.length || 5} บท
                  </span>
                </div>

                <div className="pt-2">
                  <Link
                    href="/student/lessons"
                    className="btn-3d-primary inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl text-white font-black text-sm shadow-soft-md"
                  >
                    ไปเรียนบทเรียนต่อ <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ) : (
              /* Unlocked Game Content — Expanded Full Width */
              <>
                {/* Mission Briefing Header */}
                <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-purple-50 via-white to-indigo-50/60 border border-purple-100 shadow-soft-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-600 text-white font-extrabold text-xs shadow-soft-sm">
                        <Gamepad2 className="w-4 h-4" /> Digital Board Game Mission
                      </span>
                      <h1 className="text-xl sm:text-2xl font-black text-slate-800 mt-2">
                        ภารกิจเกมกระดานตรรกศาสตร์ดิจิทัล (Logic Board Game)
                      </h1>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => window.open(`https://digital-board-game-eight.vercel.app/?student_id=${googleId}&name=${encodeURIComponent(googleName)}&autoLogin=true`, '_blank')}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#4285F4] hover:bg-blue-600 text-white text-xs font-bold rounded-xl shadow-soft-sm transition-all cursor-pointer"
                      >
                        <ExternalLink className="w-4 h-4" /> เล่นแบบเต็มจอ (New Tab)
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
                    <div className="p-3 rounded-2xl bg-white/90 border border-purple-100 shadow-sm">
                      <p className="font-bold text-slate-800 flex items-center gap-1">🎯 เป้ารายด่าน (Goal)</p>
                      <p className="text-[11px] text-slate-600 mt-0.5">พิชิตเกมกระดาน ไขรหัสตรรกะในแต่ละช่องให้ผ่าน 5 ด่าน</p>
                    </div>
                    <div className="p-3 rounded-2xl bg-white/90 border border-purple-100 shadow-sm">
                      <p className="font-bold text-slate-800 flex items-center gap-1">💡 เทคนิคสืบสวน (Tips)</p>
                      <p className="text-[11px] text-slate-600 mt-0.5">จำกฎ AND (จริงทั้งคู่), OR (เท็จทั้งคู่), IF-THEN ให้แม่นยำ</p>
                    </div>
                    <div className="p-3 rounded-2xl bg-purple-50/80 border border-purple-200 shadow-sm">
                      <div className="flex items-center justify-between">
                        <p className="font-black text-purple-900 flex items-center gap-1">
                          <Trophy className="w-4 h-4 text-amber-500" /> คะแนนที่เล่นได้จริง
                        </p>
                        <span className="text-[10px] bg-purple-600 text-white px-2 py-0.5 rounded-full font-black">
                          ตรงกับในเกม
                        </span>
                      </div>
                      <p className="text-base sm:text-lg font-mono font-black text-purple-700 mt-1">
                        {realScore > 0 ? `${realScore} คะแนน` : gameResult ? `${gameResult.score} คะแนน` : '0 คะแนน'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Mobile Warning */}
                <div className="md:hidden p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium flex items-start gap-2.5 shadow-soft-sm">
                  <div className="mt-0.5 shrink-0">
                    <HelpCircle className="w-4 h-4 text-amber-500" />
                  </div>
                  <p>
                    <strong>คำแนะนำ:</strong> การเล่นเกมในโทรศัพท์มือถืออาจไม่สะดวก แนะนำให้เล่นผ่าน <strong>คอมพิวเตอร์</strong> หรือ <strong>แท็บเล็ต</strong> ครับ
                  </p>
                </div>

                {/* Expanded Game Iframe Container (Full Width & Tall) */}
                <div className="p-2 sm:p-3 rounded-3xl bg-white border border-slate-200 shadow-soft-md overflow-hidden space-y-2">
                  <div className="flex items-center justify-between px-3 py-1 text-xs text-slate-500">
                    <span className="font-bold flex items-center gap-1 text-slate-700">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" /> หน้าต่างเกมกระดาน Digital Board Game
                    </span>
                    <button
                      onClick={() => window.open(`https://digital-board-game-eight.vercel.app/?student_id=${googleId}&name=${encodeURIComponent(googleName)}&autoLogin=true`, 'game_window')}
                      className="text-purple-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      เปิดหน้าต่างใหม่ <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="w-full h-[650px] sm:h-[750px] md:h-[820px] lg:h-[860px] rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 relative">
                    <iframe
                      src={`https://digital-board-game-eight.vercel.app/?student_id=${googleId}&name=${encodeURIComponent(googleName)}&autoLogin=true`}
                      title="Digital Board Game Mission"
                      className="w-full h-full border-0 absolute inset-0 z-10"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                      allowFullScreen
                    />
                  </div>
                </div>
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
