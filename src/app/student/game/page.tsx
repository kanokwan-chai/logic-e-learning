'use client';

import { useState, useEffect } from 'react';
import StudentSidebar from '@/components/layout/StudentSidebar';
import { useLearningStore } from '@/lib/store/useLearningStore';
import { useStudentAuth } from '@/lib/hooks/useStudentAuth';
import { Gamepad2, Sparkles, CheckCircle2, HelpCircle, Save, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

export default function DigitalBoardGamePage() {
  const { gameResult, saveGameResult } = useLearningStore();
  const [googleUser, setGoogleUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setGoogleUser(user);
    });
  }, []);

  const googleName = googleUser?.user_metadata?.full_name || googleUser?.user_metadata?.name || googleUser?.email?.split('@')[0] || 'นักเรียน';
  const googleId = googleUser?.id || 's-101';

  const [score, setScore] = useState(gameResult?.score || 0);
  const [stages, setStages] = useState(gameResult?.stages_cleared || 0);
  const [attempts, setAttempts] = useState(gameResult?.attempts || 0);

  const { completedLessons } = useLearningStore();
  const router = useRouter();
  const { isHydrated } = useStudentAuth();

  useEffect(() => {
    // เอาเงื่อนไขที่เตะกลับหน้าแดชบอร์ดออกชั่วคราว เพื่อให้เข้าเกมได้เสมอ
    // if (!isHydrated) return;
    // if (completedLessons.length < 1) {
    //   router.push('/student/dashboard');
    // }
  }, [isHydrated, completedLessons, router]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'BOARD_GAME_COMPLETED') {
        const payload = event.data.payload;
        saveGameResult({
          id: `game-${Date.now()}`,
          user_id: googleId,
          score: payload.score || 0,
          time_spent_sec: payload.timeSpent || 600,
          attempts: payload.attempts || 1,
          stages_cleared: payload.stagesCleared || 5,
          created_at: new Date().toISOString(),
        });
        
        setScore(payload.score || 0);
        setStages(payload.stagesCleared || 5);
        setAttempts(payload.attempts || 1);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [googleId, saveGameResult]);


  return (
    <div className="flex flex-col md:flex-row gap-6">
      <StudentSidebar />

      <div className="flex-1 space-y-6">
        {/* Mission Briefing Header */}
        <div className="p-6 rounded-4xl bg-gradient-to-br from-accent/80 via-white to-secondary-light/60 border border-amber-200/80 shadow-soft-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500 text-white font-extrabold text-xs shadow-soft-sm">
                <Gamepad2 className="w-4 h-4" /> Digital Board Game Mission
              </span>
              <h1 className="text-xl font-extrabold text-slate-800 mt-2">
                ภารกิจเกมกระดานตรรกศาสตร์ดิจิทัล (PWC Board Game)
              </h1>
            </div>

          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
            <div className="p-3 rounded-2xl bg-white/90 border border-amber-200">
              <p className="font-bold text-slate-800 flex items-center gap-1">🎯 เป้ารายด่าน (Goal)</p>
              <p className="text-[11px] text-slate-600 mt-0.5">พิชิตเกมกระดาน ไขรหัสตรรกะในแต่ละช่องให้ผ่าน</p>
            </div>
            <div className="p-3 rounded-2xl bg-white/90 border border-amber-200">
              <p className="font-bold text-slate-800 flex items-center gap-1">💡 เทคนิคสืบสวน (Tips)</p>
              <p className="text-[11px] text-slate-600 mt-0.5">จำกฎ AND (จริงทั้งคู่), OR (เท็จทั้งคู่), IF-THEN ให้แม่นยำ</p>
            </div>
            <div className="p-3 rounded-2xl bg-white/90 border border-amber-200">
              <div className="flex items-center justify-between">
                <p className="font-bold text-slate-800 flex items-center gap-1">🏆 คะแนนสูงสุดปัจจุบัน</p>
                {!gameResult && (
                  <button 
                    onClick={() => saveGameResult({
                      id: `game-${Date.now()}`,
                      user_id: googleId,
                      score: 100,
                      time_spent_sec: 600,
                      attempts: 1,
                      stages_cleared: 5,
                      created_at: new Date().toISOString(),
                    })}
                    className="text-[10px] bg-primary text-white px-2 py-1 rounded hover:bg-primary-hover font-bold shadow-soft-sm"
                  >
                    จำลองเซฟคะแนน
                  </button>
                )}
              </div>
              <p className="text-xs font-mono font-extrabold text-primary mt-0.5">
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
        <div className="p-2 sm:p-4 rounded-4xl bg-white border border-slate-200/80 shadow-soft-lg overflow-hidden space-y-3">
          <div className="flex items-center justify-between px-3 py-1 text-xs text-slate-500">
            <span className="font-bold flex items-center gap-1 text-slate-700">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Embedded Game Viewer
            </span>
            <button
              onClick={() => window.open('https://digital-board-game-eight.vercel.app/', 'game_window')}
              className="text-primary font-bold hover:underline flex items-center gap-1"
            >
              เปิดหน้าต่างใหม่ <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="w-full h-[500px] sm:h-[600px] md:h-[650px] lg:h-[700px] rounded-3xl overflow-hidden border border-slate-200 bg-slate-900 relative">
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
  );
}
