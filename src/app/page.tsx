'use client';

import Link from 'next/link';
import { BookOpen, Gamepad2, ArrowRight, Sparkles, Bot } from 'lucide-react';

export default function Home() {
  return (
    <div className="space-y-10 sm:space-y-16 py-4 sm:py-6">
      {/* Friendly Clean Hero Banner */}
      <section className="relative overflow-hidden p-6 sm:p-12 md:p-16 rounded-[3rem] bg-white border border-slate-100 shadow-soft-lg text-center transition-all hover:-translate-y-1">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-light rounded-full blur-3xl opacity-60 -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary-light rounded-full blur-3xl opacity-60 -ml-20 -mb-20"></div>

        <div className="relative z-10 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-warning-light text-warning font-bold text-xs mb-6 shadow-sm">
          <Sparkles className="w-4 h-4 text-warning" /> วิชาคณิตศาสตร์คอมพิวเตอร์ เรื่องตรรกศาสตร์
        </div>

        <h1 className="relative z-10 text-3xl sm:text-4xl md:text-5xl font-black text-slate-800 tracking-tight leading-tight max-w-3xl mx-auto">
          ยินดีต้อนรับสู่ <span className="text-primary relative inline-block">
            Logic E-Learning
            <svg className="absolute -bottom-2 left-0 w-full h-3 text-accent/30" viewBox="0 0 100 20" preserveAspectRatio="none">
              <path d="M0 10 Q 50 20 100 10" stroke="currentColor" strokeWidth="8" fill="none" strokeLinecap="round"/>
            </svg>
          </span>
        </h1>

        <p className="relative z-10 mt-6 sm:mt-8 text-sm sm:text-base font-bold text-slate-500 max-w-2xl mx-auto leading-relaxed px-2">
          เรียนรู้ตรรกศาสตร์และคณิตคอมฯ ผ่านสไลด์การสอน และเกมกระดานดิจิทัล!
        </p>

        {/* Quick Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/student/login"
            className="btn-minimal-primary w-full sm:w-auto px-8 py-3.5 flex items-center justify-center gap-2"
          >
            เริ่มเรียนเลย <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/auth/login"
            className="btn-minimal-white w-full sm:w-auto px-8 py-3.5 flex items-center justify-center"
          >
            สำหรับผู้สอน
          </Link>
        </div>
      </section>

      {/* Learning Path Section (Beautiful Redesign) */}
      <section className="py-8 sm:py-12">
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="h-[2px] w-12 bg-gradient-to-r from-transparent to-primary/40 rounded-full"></div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            เส้นทางการเรียนรู้ (Learning Path)
          </h2>
          <div className="h-[2px] w-12 bg-gradient-to-l from-transparent to-primary/40 rounded-full"></div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 relative px-4 sm:px-2 max-w-6xl mx-auto">
          {/* Connecting line (desktop only) */}
          <div className="hidden lg:block absolute top-1/2 left-8 right-8 h-[2px] bg-slate-200/60 -translate-y-1/2 z-0 rounded-full"></div>

          {/* Step 1 */}
          <div className="relative z-10 group bg-white/60 backdrop-blur-xl border border-white/80 rounded-[2rem] p-6 shadow-soft-sm hover:shadow-soft-xl hover:-translate-y-2 transition-all duration-300">
            <div className="absolute -top-5 -left-2 w-14 h-14 bg-gradient-to-br from-indigo-500 to-blue-500 text-white rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform rotate-[-6deg] group-hover:rotate-0 border-4 border-white/80">
              1
            </div>
            <h4 className="font-black text-slate-800 text-lg mt-3 mb-2 group-hover:text-blue-600 transition-colors">Pre-test</h4>
            <p className="text-xs font-semibold text-slate-500 leading-relaxed">
              ทำ <strong className="text-slate-700">แบบทดสอบก่อนเรียน</strong> เพื่อวัดระดับความรู้พื้นฐานของคุณก่อนเริ่ม
            </p>
          </div>

          {/* Step 2 */}
          <div className="relative z-10 group bg-white/60 backdrop-blur-xl border border-white/80 rounded-[2rem] p-6 shadow-soft-sm hover:shadow-soft-xl hover:-translate-y-2 transition-all duration-300">
            <div className="absolute -top-5 -left-2 w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 text-white rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg shadow-orange-500/30 group-hover:scale-110 transition-transform rotate-[6deg] group-hover:rotate-0 border-4 border-white/80">
              2
            </div>
            <h4 className="font-black text-slate-800 text-lg mt-3 mb-2 group-hover:text-orange-500 transition-colors">Learn & Watch</h4>
            <p className="text-xs font-semibold text-slate-500 leading-relaxed">
              เข้าสู่ <strong className="text-slate-700">บทเรียนตรรกศาสตร์</strong> ศึกษาเนื้อหาและเรียนรู้ผ่านวิดีโอ
            </p>
          </div>

          {/* Step 3 */}
          <div className="relative z-10 group bg-white/60 backdrop-blur-xl border border-white/80 rounded-[2rem] p-6 shadow-soft-sm hover:shadow-soft-xl hover:-translate-y-2 transition-all duration-300">
            <div className="absolute -top-5 -left-2 w-14 h-14 bg-gradient-to-br from-emerald-400 to-teal-500 text-white rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg shadow-teal-500/30 group-hover:scale-110 transition-transform rotate-[-6deg] group-hover:rotate-0 border-4 border-white/80">
              3
            </div>
            <h4 className="font-black text-slate-800 text-lg mt-3 mb-2 group-hover:text-teal-600 transition-colors">Board Game</h4>
            <p className="text-xs font-semibold text-slate-500 leading-relaxed">
              สนุกกับ <strong className="text-slate-700">Digital Board Game</strong> เพื่อทบทวนความรู้และทำภารกิจ
            </p>
          </div>

          {/* Step 4 */}
          <div className="relative z-10 group bg-white/60 backdrop-blur-xl border border-white/80 rounded-[2rem] p-6 shadow-soft-sm hover:shadow-soft-xl hover:-translate-y-2 transition-all duration-300">
            <div className="absolute -top-5 -left-2 w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform rotate-[6deg] group-hover:rotate-0 border-4 border-white/80">
              4
            </div>
            <h4 className="font-black text-slate-800 text-lg mt-3 mb-2 group-hover:text-purple-600 transition-colors">Post-test</h4>
            <p className="text-xs font-semibold text-slate-500 leading-relaxed">
              ทำ <strong className="text-slate-700">แบบทดสอบหลังเรียน</strong> และประเมินความพึงพอใจการใช้งาน
            </p>
          </div>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section className="space-y-8 mt-12">
        <div className="text-center px-2">
          <h2 className="text-2xl font-black text-slate-800">
            ระบบการเรียนรู้ตรรกศาสตร์ครบวงจร
          </h2>
          <p className="text-sm text-slate-500 font-bold mt-2">ออกแบบเพื่อส่งเสริมการคิดเชิงตรรกะ (Logical Thinking)</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 px-2 max-w-6xl mx-auto">
          <div className="bento-card p-6 sm:p-8 space-y-4 bg-primary-light/30 border-primary-light hover:-translate-y-1 transition-transform">
            <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center font-bold shadow-soft-sm">
              <BookOpen className="w-7 h-7" />
            </div>
            <h3 className="font-black text-slate-800 text-lg">บทเรียน 5 บท (Micro-learning)</h3>
            <p className="text-sm text-slate-600 font-medium leading-relaxed">
              มีทั้งวิดีโอ สไลด์การสอน การ์ดสรุปเนื้อหา และตารางค่าความจริงเชิงโต้ตอบ
            </p>
          </div>

          <div className="bento-card p-6 sm:p-8 space-y-4 bg-accent-light/30 border-accent-light hover:-translate-y-1 transition-transform">
            <div className="w-14 h-14 rounded-2xl bg-accent text-white flex items-center justify-center shadow-soft-sm">
              <Gamepad2 className="w-7 h-7" />
            </div>
            <h3 className="font-black text-slate-800 text-lg">Digital Board Game Mission</h3>
            <p className="text-sm text-slate-600 font-medium leading-relaxed">
              ฝังเกมกระดานออนไลน์ บันทึกคะแนน เวลา และด่านที่ผ่านเข้าสู่ระบบโดยอัตโนมัติ
            </p>
          </div>

          <div className="bento-card p-6 sm:p-8 space-y-4 bg-purple-50 border-purple-200 hover:-translate-y-1 transition-transform">
            <div className="w-14 h-14 rounded-2xl bg-purple-500 text-white flex items-center justify-center shadow-soft-sm">
              <Bot className="w-7 h-7" />
            </div>
            <h3 className="font-black text-slate-800 text-lg">AI Assistant (Chatbot)</h3>
            <p className="text-sm text-slate-600 font-medium leading-relaxed">
              ผู้ช่วยอัจฉริยะส่วนตัว พร้อมตอบทุกข้อสงสัยและให้คำแนะนำเกี่ยวกับเนื้อหาตรรกศาสตร์
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
