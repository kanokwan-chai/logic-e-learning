'use client';
import { useStudentAuth } from '@/lib/hooks/useStudentAuth';

import StudentSidebar from '@/components/layout/StudentSidebar';
import { SkillRadarChart, PrePostComparisonChart } from '@/components/teacher/AnalyticsCharts';
import { BarChart3, CheckCircle2, TrendingUp, Sparkles, AlertCircle } from 'lucide-react';

export default function StudentReportPage() {
  useStudentAuth();
  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#F8FAFC] font-sans md:flex md:h-[calc(100vh-80px)] md:overflow-hidden">
      <StudentSidebar />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header Title */}
        <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-soft-sm">
          <h1 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" /> รายงานวิเคราะห์ตนเอง (Student Learning Analytics)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            วิเคราะห์จุดแข็ง จุดอ่อน ทักษะเชิงตรรกศาสตร์ 5 มิติ และกราฟพัฒนาการการเรียนรู้
          </p>
        </div>

        {/* Radar & Progress Chart Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Skill Radar */}
          <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-soft-sm space-y-2">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" /> ทักษะเชิงตรรกศาสตร์ 5 มิติ (Skill Radar Chart)
            </h3>
            <SkillRadarChart />
          </div>

          {/* Pre vs Post Test Score Improvement */}
          <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-soft-sm space-y-2">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" /> เปรียบเทียบคะแนนและพัฒนาการ (Pre vs Post Test)
            </h3>
            <PrePostComparisonChart data={[]} />
          </div>
        </div>

        {/* Strengths & Weaknesses Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Strengths */}
          <div className="p-6 rounded-3xl bg-emerald-50/60 border border-emerald-200/80 shadow-soft-sm space-y-3">
            <h3 className="font-bold text-sm text-emerald-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" /> จุดแข็งที่เด่นชัด (Strengths)
            </h3>
            <ul className="space-y-2 text-xs text-emerald-800 font-medium">
              <li className="flex items-center gap-2 bg-white/80 p-2.5 rounded-xl border border-emerald-200">
                <span>🌟</span> แยกแยะประโยคที่เป็นประพจน์ได้แม่นยำ 90%
              </li>
              <li className="flex items-center gap-2 bg-white/80 p-2.5 rounded-xl border border-emerald-200">
                <span>⚡</span> เข้าใจสัญญาณดิจิทัลและค่าความจริง T / F
              </li>
              <li className="flex items-center gap-2 bg-white/80 p-2.5 rounded-xl border border-emerald-200">
                <span>🎮</span> ผ่านภารกิจ Digital Board Game ทุกด่านในครั้งเดียว
              </li>
            </ul>
          </div>

          {/* Weaknesses */}
          <div className="p-6 rounded-3xl bg-amber-50/60 border border-amber-200/80 shadow-soft-sm space-y-3">
            <h3 className="font-bold text-sm text-amber-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" /> ข้อเสนอแนะบททบทวน (Recommended Review)
            </h3>
            <ul className="space-y-2 text-xs text-amber-800 font-medium">
              <li className="flex items-center gap-2 bg-white/80 p-2.5 rounded-xl border border-amber-200">
                <span>📌</span> ควรทบทวน **บทที่ 4 ตารางค่าความจริง** โดยเฉพาะกรณี 3 ตัวแปร (8 กรณี)
              </li>
              <li className="flex items-center gap-2 bg-white/80 p-2.5 rounded-xl border border-amber-200">
                <span>📌</span> ฝึกทำ **Logical Lab: Truth Table Challenge** เพิ่มเติม
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
