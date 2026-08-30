'use client';

import { useState, useEffect } from 'react';
import StudentSidebar from '@/components/layout/StudentSidebar';
import { useLearningStore } from '@/lib/store/useLearningStore';
import { useStudentAuth } from '@/lib/hooks/useStudentAuth';
import { Gamepad2, Sparkles, CheckCircle2, HelpCircle, ExternalLink, Lock, ArrowRight, FileCheck2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { saveGameResultToDB } from '@/lib/supabase/db';
import type { User } from '@supabase/supabase-js';

export default function DigitalBoardGamePage() {
  const { gameResult, saveGameResult } = useLearningStore();
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [loadingDB, setLoadingDB] = useState(true);
  const [hasPreKnowledge, setHasPreKnowledge] = useState(false);
  const [hasPreSkill, setHasPreSkill] = useState(false);

  useEffect(() => {
    async function checkPreTestStatus() {
      setLoadingDB(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setGoogleUser(user);

        // 1. ตรวจสอบจากตาราง students.progress_data ใน Supabase โดยตรง
        const { data: student } = await supabase
          .from('students')
          .select('progress_data')
          .eq('id', user.id)
          .single();

        const p = student?.progress_data;
        const preK = !!(p?.preKnowledgeResult && p.preKnowledgeResult.score !== undefined);
        const preS = !!(p?.preSkillResult && p.preSkillResult.score !== undefined);

        // 2. ตรวจสอบเพิ่มเติมจากตาราง test_results (ถ้ามี)
        const { data: tests } = await supabase
          .from('test_results')
          .select('test_type')
          .eq('student_id', user.id);

        const hasTestK = (tests || []).some(t => t.test_type === 'pre_knowledge');
        const hasTestS = (tests || []).some(t => t.test_type === 'pre_skill');

        setHasPreKnowledge(preK || hasTestK);
        setHasPreSkill(preS || hasTestS);
      }
      setLoadingDB(false);
    }

    checkPreTestStatus();
  }, []);

  const googleName = googleUser?.user_metadata?.full_name || googleUser?.user_metadata?.name || googleUser?.email?.split('@')[0] || 'นักเรียน';
  const googleId = googleUser?.id || 's-101';

  const [score, setScore] = useState(gameResult?.score || 0);
  const [stages, setStages] = useState(gameResult?.stages_cleared || 0);
  const [attempts, setAttempts] = useState(gameResult?.attempts || 0);

  const handleSaveGameResult = async (gameObj: any) => {
    saveGameResult(gameObj);
    setScore(gameObj.score || 0);
    setStages(gameObj.stages_cleared || 5);
    setAttempts(gameObj.attempts || 1);

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

  const isUnlocked = hasPreKnowledge && hasPreSkill;

  return (
    <div className="min-h-screen md:flex md:h-screen bg-[#F8FAFC] md:overflow-hidden font-sans">
      <StudentSidebar />

      <div className="flex-1 flex flex-col md:h-full overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6 pb-20">

            {/* Loading State */}
            {loadingDB ? (
              <div className="bg-white rounded-[2rem] p-12 text-center shadow-soft-sm border border-slate-100 flex flex-col items-center justify-center min-h-[50vh] gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-[#4285F4]" />
                <p className="text-sm font-bold text-slate-500">กำลังตรวจสอบสิทธิ์การเข้าเล่นเกมกระดานจากฐานข้อมูล...</p>
              </div>
            ) : !isUnlocked ? (
              /* Locked Screen if Pre-Tests are incomplete */
              <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-soft-lg border border-slate-100 max-w-3xl mx-auto text-center space-y-8 mt-6">
                <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-3xl flex items-center justify-center text-3xl mx-auto border-2 border-amber-200 shadow-sm">
                  <Lock className="w-10 h-10 text-amber-500" />
                </div>

                <div className="space-y-3 max-w-lg mx-auto">
                  <span className="px-4 py-1.5 rounded-full bg-amber-100 text-amber-800 text-xs font-black">
                    เงื่อนไขการปลดล็อกภารกิจ
                  </span>
                  <h2 className="text-2xl md:text-3xl font-black text-slate-800">
                    ต้องทำแบบทดสอบก่อนเรียนให้ครบก่อน
                  </h2>
                  <p className="text-slate-500 text-sm font-medium leading-relaxed">
                    ระบบต้องการให้คุณทำแบบทดสอบวัดระดับก่อนเรียนทั้ง 2 ด้าน เพื่อบันทึกคะแนนฐานไว้เปรียบเทียบก่อนเข้าเล่นเกมกระดานครับ
                  </p>
                </div>

                {/* Status Checklist */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left max-w-xl mx-auto">
                  {/* 1. Pre-Knowledge */}
                  <div className={`p-5 rounded-2xl border-2 flex items-center justify-between ${
                    hasPreKnowledge ? 'bg-emerald-50/70 border-emerald-200' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                        hasPreKnowledge ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
                      }`}>
                        {hasPreKnowledge ? '✓' : '1'}
                      </div>
                      <div>
                        <p className="font-bold text-xs text-slate-800">ก่อนเรียน (ความรู้)</p>
                        <p className="text-[10px] text-slate-500">{hasPreKnowledge ? 'บันทึกคะแนนแล้ว' : 'ยังไม่ได้ทำ'}</p>
                      </div>
                    </div>
                    {!hasPreKnowledge && (
                      <Link
                        href="/student/tests/pre_knowledge"
                        className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all"
                      >
                        ทำแบบทดสอบ
                      </Link>
                    )}
                  </div>

                  {/* 2. Pre-Skill */}
                  <div className={`p-5 rounded-2xl border-2 flex items-center justify-between ${
                    hasPreSkill ? 'bg-emerald-50/70 border-emerald-200' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                        hasPreSkill ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
                      }`}>
                        {hasPreSkill ? '✓' : '2'}
                      </div>
                      <div>
                        <p className="font-bold text-xs text-slate-800">ก่อนเรียน (ทักษะ)</p>
                        <p className="text-[10px] text-slate-500">{hasPreSkill ? 'บันทึกคะแนนแล้ว' : 'ยังไม่ได้ทำ'}</p>
                      </div>
                    </div>
                    {!hasPreSkill && (
                      <Link
                        href="/student/tests/pre_skill"
                        className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all"
                      >
                        ทำแบบทดสอบ
                      </Link>
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    href="/student/dashboard"
                    className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800"
                  >
                    ← กลับไปที่แดชบอร์ด
                  </Link>
                </div>
              </div>
            ) : (
              /* Unlocked Game Screen */
              <>
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
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#4285F4] hover:bg-blue-600 text-white text-xs font-bold rounded-xl shadow-soft-sm transition-all"
                      >
                        <ExternalLink className="w-4 h-4" /> เล่นแบบเต็มจอ (New Tab)
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                    <div className="p-3.5 rounded-2xl bg-white/90 border border-purple-100 shadow-sm">
                      <p className="font-bold text-slate-800 flex items-center gap-1">🎯 เป้ารายด่าน (Goal)</p>
                      <p className="text-[11px] text-slate-600 mt-0.5">พิชิตเกมกระดาน ไขรหัสตรรกะในแต่ละช่องให้ผ่าน</p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-white/90 border border-purple-100 shadow-sm">
                      <p className="font-bold text-slate-800 flex items-center gap-1">💡 เทคนิคสืบสวน (Tips)</p>
                      <p className="text-[11px] text-slate-600 mt-0.5">จำกฎ AND (จริงทั้งคู่), OR (เท็จทั้งคู่), IF-THEN ให้แม่นยำ</p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-white/90 border border-purple-100 shadow-sm">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-slate-800 flex items-center gap-1">🏆 คะแนนสูงสุด</p>
                        {!gameResult && (
                          <button 
                            onClick={() => handleSaveGameResult({
                              id: `game-${Date.now()}`,
                              user_id: googleId,
                              score: 100,
                              time_spent_sec: 600,
                              attempts: 1,
                              stages_cleared: 5,
                              created_at: new Date().toISOString(),
                            })}
                            className="text-[10px] bg-purple-600 text-white px-2 py-1 rounded hover:bg-purple-700 font-bold shadow-soft-sm"
                          >
                            จำลองเซฟคะแนน
                          </button>
                        )}
                      </div>
                      <p className="text-xs font-mono font-extrabold text-purple-700 mt-0.5">
                        {gameResult ? `${gameResult.score} คะแนน (ผ่าน ${gameResult.stages_cleared} ด่าน)` : 'ยังไม่มีผลบันทึก'}
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
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" /> หน้าต่างเกมกระดาน Digital Board Game
                    </span>
                    <button
                      onClick={() => window.open(`https://digital-board-game-eight.vercel.app/?student_id=${googleId}&name=${encodeURIComponent(googleName)}&autoLogin=true`, 'game_window')}
                      className="text-purple-600 font-bold hover:underline flex items-center gap-1"
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
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
