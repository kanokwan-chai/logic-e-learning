'use client';

import { useState, useEffect } from 'react';
import StudentSidebar from '@/components/layout/StudentSidebar';
import { useLearningStore } from '@/lib/store/useLearningStore';
import { Gamepad2, Sparkles, HelpCircle, ExternalLink, Trophy } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { saveGameResultToDB } from '@/lib/supabase/db';
import type { User } from '@supabase/supabase-js';

function hashEmailToNumber(email: string): number {
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = (hash << 5) - hash + email.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 1000000;
}

export default function DigitalBoardGamePage() {
  const { gameResult, saveGameResult } = useLearningStore();
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
    <div className="min-h-screen md:flex md:h-screen bg-[#F8FAFC] md:overflow-hidden font-sans">
      <StudentSidebar />

      <div className="flex-1 flex flex-col md:h-full overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6 pb-20">

            {/* Mission Briefing Header */}
            <div className="p-6 rounded-[2rem] bg-gradient-to-br from-purple-50 via-white to-indigo-50/60 border border-purple-100 shadow-soft-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-600 text-white font-extrabold text-xs shadow-soft-sm">
                    <Gamepad2 className="w-4 h-4" /> Digital Board Game Mission
                  </span>
                  <h1 className="text-2xl font-black text-slate-800 mt-2">
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                <div className="p-3.5 rounded-2xl bg-white/90 border border-purple-100 shadow-sm">
                  <p className="font-bold text-slate-800 flex items-center gap-1">🎯 เป้ารายด่าน (Goal)</p>
                  <p className="text-[11px] text-slate-600 mt-0.5">พิชิตเกมกระดาน ไขรหัสตรรกะในแต่ละช่องให้ผ่าน 5 ด่าน</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/90 border border-purple-100 shadow-sm">
                  <p className="font-bold text-slate-800 flex items-center gap-1">💡 เทคนิคสืบสวน (Tips)</p>
                  <p className="text-[11px] text-slate-600 mt-0.5">จำกฎ AND (จริงทั้งคู่), OR (เท็จทั้งคู่), IF-THEN ให้แม่นยำ</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-purple-50/80 border border-purple-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="font-black text-purple-900 flex items-center gap-1">
                      <Trophy className="w-4 h-4 text-amber-500" /> คะแนนที่เล่นได้จริง
                    </p>
                    <span className="text-[10px] bg-purple-600 text-white px-2 py-0.5 rounded-full font-black">
                      ตรงกับในเกม
                    </span>
                  </div>
                  <p className="text-lg font-mono font-black text-purple-700 mt-1">
                    {realScore > 0 ? `${realScore} คะแนน` : gameResult ? `${gameResult.score} คะแนน` : '0 คะแนน'}
                  </p>
                </div>
              </div>
            </div>

            {/* Mobile Warning */}
            <div className="md:hidden p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-sm font-medium flex items-start gap-3 shadow-soft-sm">
              <div className="mt-0.5 shrink-0">
                <HelpCircle className="w-5 h-5 text-amber-500" />
              </div>
              <p>
                <strong>คำแนะนำ:</strong> การเล่นเกมในโทรศัพท์มือถืออาจไม่สะดวกเท่าที่ควร เพื่อการแสดงผลที่สมบูรณ์ที่สุด แนะนำให้ใช้งานผ่าน <strong>คอมพิวเตอร์</strong> หรือ <strong>แท็บเล็ต</strong> ครับ
              </p>
            </div>

            {/* Embedded Board Game Iframe Frame */}
            <div className="p-2 sm:p-4 rounded-[2rem] bg-white border border-slate-200 shadow-soft-lg overflow-hidden space-y-3">
              <div className="flex items-center justify-between px-3 py-1 text-xs text-slate-500">
                <span className="font-bold flex items-center gap-1 text-slate-700">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" /> หน้าต่างเกมกระดาน Digital Board Game (เล่นในบทเรียนได้ทันที)
                </span>
                <button
                  onClick={() => window.open(`https://digital-board-game-eight.vercel.app/?student_id=${googleId}&name=${encodeURIComponent(googleName)}&autoLogin=true`, 'game_window')}
                  className="text-purple-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  เปิดหน้าต่างใหม่ <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="w-full h-[600px] sm:h-[700px] md:h-[750px] lg:h-[800px] rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 relative">
                <iframe
                  src={`https://digital-board-game-eight.vercel.app/?student_id=${googleId}&name=${encodeURIComponent(googleName)}&autoLogin=true`}
                  title="Digital Board Game Mission"
                  className="w-full h-full border-0 absolute inset-0 z-10"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                  allowFullScreen
                />
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
