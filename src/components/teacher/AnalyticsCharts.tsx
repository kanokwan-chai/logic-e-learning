'use client';

import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';

// ข้อมูล Radar (จะดึงจาก Supabase เมื่อเชื่อมต่อ)
const radarData: { skill: string; score: number }[] = [];

// ข้อมูลเปรียบเทียบรายห้องเรียน (จะดึงจาก Supabase เมื่อเชื่อมต่อ)
const classData: { class: string; pretest: number; posttest: number }[] = [];

// ข้อมูลกิจกรรมรายสัปดาห์ (จะดึงจาก Supabase เมื่อเชื่อมต่อ)
const weeklyData: { day: string; time: number; students: number }[] = [];

export function SkillRadarChart({ data }: { data?: { skill: string; score: number }[] }) {
  const chartData = data && data.length > 0 ? data : radarData;
  if (chartData.length === 0) {
    return (
      <div className="w-full h-64 flex items-center justify-center text-slate-400 text-xs font-bold border-2 border-dashed border-slate-200 rounded-2xl">
        ยังไม่มีข้อมูลการประเมินทักษะ
      </div>
    );
  }
  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
          <PolarGrid stroke="#E2E8F0" />
          <PolarAngleAxis dataKey="skill" tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#CBD5E1" tick={{ fontSize: 9 }} />
          <Radar name="ความชำนาญเฉลี่ย (%)" dataKey="score" stroke="#4285F4" fill="#4285F4" fillOpacity={0.4} />
          <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PrePostComparisonChart({ data }: { data: { class: string; pretest: number; posttest: number }[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-64 flex items-center justify-center text-slate-400 text-xs font-bold border-2 border-dashed border-slate-200 rounded-2xl">
        รอข้อมูลจริงจาก Supabase
      </div>
    );
  }
  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
          <XAxis dataKey="class" tick={{ fill: '#64748B', fontSize: 11 }} />
          <YAxis domain={[0, 20]} tick={{ fill: '#64748B', fontSize: 11 }} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="pretest" name="เฉลี่ย Pre-test (20)" fill="#A9D4EF" radius={[8, 8, 0, 0]} />
          <Bar dataKey="posttest" name="เฉลี่ย Post-test (20)" fill="#7C6CF2" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function WeeklyActivityChart() {
  if (weeklyData.length === 0) {
    return (
      <div className="w-full h-64 flex items-center justify-center text-slate-400 text-xs font-bold border-2 border-dashed border-slate-200 rounded-2xl">
        รอข้อมูลจริงจาก Supabase
      </div>
    );
  }
  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
          <XAxis dataKey="day" tick={{ fill: '#64748B', fontSize: 11 }} />
          <YAxis tick={{ fill: '#64748B', fontSize: 11 }} />
          <Tooltip />
          <Area type="monotone" dataKey="time" name="เวลาเรียนรวม (นาที)" stroke="#8ED081" fill="#8ED081" fillOpacity={0.3} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
