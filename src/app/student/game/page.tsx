'use client';

import { useState, useEffect } from 'react';
import StudentSidebar from '@/components/layout/StudentSidebar';
import { useLearningStore } from '@/lib/store/useLearningStore';
import { useStudentAuth } from '@/lib/hooks/useStudentAuth';
import { Gamepad2, Sparkles, CheckCircle2, HelpCircle, Save, ExternalLink, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

export default function DigitalBoardGamePage() {
  const { gameResult, saveGameResult } = useLearningStore();
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setGoogleUser(user);
      setAuthLoading(false);
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

      <div className="flex-1 space-y-4">
        {/* Sleek Game Header Bar */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/80 shadow-soft-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-sm shrink-0">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-extrabold text-slate-800 leading-tight">
                ภารกิจเกมกระดานตรรกศาสตร์ดิจิทัล (Digital Board Game)
              </h1>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                พิชิต 5 ด่านประตูห้องความลับเพื่อสะสมคะแนนตรรกศาสตร์
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            {gameResult && (
              <span className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold font-mono">
                🏆 คะแนนล่าสุด: {gameResult.score} แต้ม
              </span>
            )}
            <button
              onClick={() => window.open('https://digital-board-game-eight.vercel.app/', 'game_window')}
              className="px-4 py-2 rounded-xl bg-primary text-white hover:bg-primary-hover transition-colors text-xs font-bold shadow-soft-sm flex items-center gap-1.5 shrink-0"
            >
              เปิดเล่นเต็มจอ <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Embedded Board Game Full Viewer */}
        <div className="w-full h-[650px] sm:h-[720px] md:h-[780px] lg:h-[840px] rounded-3xl overflow-hidden border-2 border-slate-200 shadow-soft-md bg-slate-900 relative">
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
  );
}
