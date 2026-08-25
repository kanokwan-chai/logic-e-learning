'use client';

import { useState, useEffect } from 'react';
import { Gamepad2, Mail, Play, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function StandaloneGamePage() {
  const [email, setEmail] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  // ฟัง Event การส่งคะแนนจากเกม
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // ตรวจสอบว่ามีข้อมูลส่งมาจาก iFrame
      if (event.data && event.data.type === 'BOARD_GAME_COMPLETED') {
        const payload = event.data.payload;
        setScore(payload.score || 0);
        
        // จำลองการเซฟคะแนนลงฐานข้อมูลผูกกับอีเมล
        console.log(`Saved score ${payload.score} for email ${email}`);
        
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 5000);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [email]);

  if (!isPlaying) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-soft-xl border border-slate-100 text-center space-y-6">
          <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl mx-auto flex items-center justify-center shadow-lg shadow-orange-500/30">
            <Gamepad2 className="w-10 h-10 text-white" />
          </div>
          
          <div>
            <h1 className="text-2xl font-black text-slate-800">Logic Board Game</h1>
            <p className="text-sm text-slate-500 mt-2 font-medium">เข้าสู่ระบบด้วยอีเมลเพื่อบันทึกคะแนนการเล่น</p>
          </div>

          <form 
            onSubmit={(e) => { e.preventDefault(); if (email) setIsPlaying(true); }}
            className="space-y-4 pt-4"
          >
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="w-5 h-5 text-slate-400" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="กรอกอีเมลของคุณ"
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 font-medium text-slate-700"
              />
            </div>
            
            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-primary text-white font-bold text-sm hover:bg-primary-hover transition-colors shadow-md flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" /> เริ่มเล่นเกมเลย!
            </button>
          </form>

          <p className="text-xs text-slate-400 pt-4">
            หากคุณเป็นนักเรียนในระบบ สามารถเล่นผ่าน <Link href="/student/login" className="text-primary font-bold hover:underline">แดชบอร์ดนักเรียน</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col font-sans">
      {/* Game Header */}
      <div className="h-16 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-6 text-white shrink-0">
        <div className="flex items-center gap-3">
          <Gamepad2 className="w-6 h-6 text-amber-400" />
          <h1 className="font-bold">Logic Board Game</h1>
        </div>
        <div className="flex items-center gap-4 text-sm font-medium">
          <div className="flex items-center gap-2 text-slate-300">
            <Mail className="w-4 h-4" /> {email}
          </div>
          <button 
            onClick={() => setIsPlaying(false)}
            className="px-4 py-1.5 rounded-full bg-slate-700 hover:bg-slate-600 transition-colors text-xs font-bold"
          >
            ออกเกม
          </button>
        </div>
      </div>

      {/* Success Message overlay */}
      {savedSuccess && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-6 py-3 rounded-full font-bold shadow-xl flex items-center gap-2 animate-bounce z-50">
          <CheckCircle2 className="w-5 h-5" /> บันทึกคะแนน ({score}) เรียบร้อยแล้ว!
        </div>
      )}

      {/* Game Iframe */}
      <div className="flex-1 w-full bg-black relative">
        {/* Placeholder if no game URL is provided yet */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 z-0">
          <Gamepad2 className="w-16 h-16 mb-4 opacity-50" />
          <p className="font-bold">พื้นที่สำหรับฝัง (Iframe) ตัวเกม</p>
          <p className="text-sm mt-2">ใส่ลิงก์เกมที่ src/app/play/page.tsx</p>
        </div>

        <iframe 
          src={`https://digital-board-game-eight.vercel.app/?email=${encodeURIComponent(email)}&autoLogin=true`}
          className="relative z-10 w-full h-full border-0"
          title="Logic Board Game"
          allowFullScreen
        ></iframe>
      </div>
    </div>
  );
}
