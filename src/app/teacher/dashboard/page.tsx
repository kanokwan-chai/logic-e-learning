'use client';

import Link from 'next/link';
import TeacherSidebar from '@/components/layout/TeacherSidebar';
import { PrePostComparisonChart, SkillRadarChart } from '@/components/teacher/AnalyticsCharts';
import {
  Users,
  CheckCircle2,
  TrendingUp,
  Clock,
  Gamepad2,
  Award,
  BarChart2,
  Sparkles,
  Info,
  MonitorPlay
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { th } from 'date-fns/locale';

export default function TeacherDashboardPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());

  // Update 'now' every minute so relative timestamps (e.g., '37 mins ago') stay accurate without refreshing
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function fetchStudents() {
      const { data, error } = await supabase.from('students').select('*');
      if (data) setStudents(data);
      setLoading(false);
    }
    fetchStudents();

    // Set up realtime subscription
    const channel = supabase.channel('students_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, (payload) => {
        if (payload.eventType === 'UPDATE') {
          setStudents((prev) => prev.map(s => s.id === payload.new.id ? payload.new : s));
        } else if (payload.eventType === 'INSERT') {
          setStudents((prev) => [...prev, payload.new]);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Compute Metrics
  const totalStudents = students.length;
  let studentsCompleted = 0;
  let totalPreKnowledgeScore = 0;
  let preKnowledgeCount = 0;
  let totalPreSkillScore = 0;
  let preSkillCount = 0;
  let totalPostKnowledgeScore = 0;
  let postKnowledgeCount = 0;
  let totalPostSkillScore = 0;
  let postSkillCount = 0;
  let totalGameScore = 0;
  let gameCount = 0;
  let totalStudyTime = 0;
  let totalBadges = 0;

  students.forEach((s) => {
    const progress = s.progress_data;
    if (!progress) return;

    if (progress.completedLessons?.length >= 5 && progress.gameResult) {
      studentsCompleted++;
    }
    if (progress.preKnowledgeResult) {
      totalPreKnowledgeScore += progress.preKnowledgeResult.score;
      preKnowledgeCount++;
    }
    if (progress.preSkillResult) {
      totalPreSkillScore += progress.preSkillResult.score;
      preSkillCount++;
    }
    if (progress.postKnowledgeResult) {
      totalPostKnowledgeScore += progress.postKnowledgeResult.score;
      postKnowledgeCount++;
    }
    if (progress.postSkillResult) {
      totalPostSkillScore += progress.postSkillResult.score;
      postSkillCount++;
    }
    if (progress.gameResult) {
      totalGameScore += progress.gameResult.score;
      gameCount++;
    }
    if (progress.totalStudyTimeSec) {
      totalStudyTime += progress.totalStudyTimeSec;
    }
    if (progress.unlockedBadgeIds) {
      totalBadges += progress.unlockedBadgeIds.length;
    }
  });

  const avgPreKnowledge = preKnowledgeCount > 0 ? (totalPreKnowledgeScore / preKnowledgeCount).toFixed(1) : '—';
  const avgPreSkill = preSkillCount > 0 ? (totalPreSkillScore / preSkillCount).toFixed(1) : '—';
  const avgPostKnowledge = postKnowledgeCount > 0 ? (totalPostKnowledgeScore / postKnowledgeCount).toFixed(1) : '—';
  const avgPostSkill = postSkillCount > 0 ? (totalPostSkillScore / postSkillCount).toFixed(1) : '—';
  const avgGame = gameCount > 0 ? Math.round(totalGameScore / gameCount) : '—';
  const improvementKnowledge = (preKnowledgeCount > 0 && postKnowledgeCount > 0)
    ? (((totalPostKnowledgeScore/postKnowledgeCount) - (totalPreKnowledgeScore/preKnowledgeCount)) / 20 * 100).toFixed(0)
    : '—';
  const avgStudyMins = totalStudents > 0 ? Math.round((totalStudyTime / 60) / totalStudents) : '—';

  // Aggregate Class Data for Chart
  const classStats: Record<string, { preSum: number; preCount: number; postSum: number; postCount: number }> = {};
  students.forEach((s) => {
    const cls = s.class_name || 'ไม่ได้ระบุห้อง';
    if (!classStats[cls]) classStats[cls] = { preSum: 0, preCount: 0, postSum: 0, postCount: 0 };
    
    if (s.progress_data?.preKnowledgeResult) {
      classStats[cls].preSum += s.progress_data.preKnowledgeResult.score;
      classStats[cls].preCount++;
    }
    if (s.progress_data?.postKnowledgeResult) {
      classStats[cls].postSum += s.progress_data.postKnowledgeResult.score;
      classStats[cls].postCount++;
    }
  });

  const classData = Object.entries(classStats).map(([className, stats]) => ({
    class: className,
    pretest: stats.preCount > 0 ? parseFloat((stats.preSum / stats.preCount).toFixed(1)) : 0,
    posttest: stats.postCount > 0 ? parseFloat((stats.postSum / stats.postCount).toFixed(1)) : 0,
  }));

  // Filter Active Students (Logged in within last 1 hour)
  const oneHourAgo = now - 60 * 60 * 1000;
  const activeStudents = [...students].filter(s => {
    return s.last_login_at && new Date(s.last_login_at).getTime() > oneHourAgo;
  }).sort((a, b) => {
    return new Date(b.last_login_at).getTime() - new Date(a.last_login_at).getTime();
  }).slice(0, 5);

  return (
    <div className="min-h-[calc(100vh-140px)] bg-[#F8FAFC] font-sans md:flex md:h-[calc(100vh-140px)] md:overflow-hidden rounded-3xl shadow-sm border border-slate-200">
      <TeacherSidebar />

      <div className="flex-1 flex flex-col md:h-full overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            
            {/* Banner Header */}
            <div className="bg-[#4285F4] rounded-[2rem] p-8 md:p-10 text-white relative overflow-hidden shadow-[0_10px_40px_rgba(66,133,244,0.2)]">
              <div className="absolute top-10 right-20 w-40 h-24 bg-white/20 rounded-full blur-2xl"></div>
              <div className="relative z-10 max-w-[60%] space-y-4">
                <span className="inline-block bg-white text-[#4285F4] px-4 py-1.5 rounded-full text-xs font-bold shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 inline mr-1" /> Teacher Analytics
                </span>
                <h1 className="text-3xl md:text-5xl font-black leading-tight drop-shadow-sm mt-4">
                  แผงวิเคราะห์<br/>ผลการเรียนรู้
                </h1>
                <p className="text-sm text-blue-100 font-medium leading-relaxed max-w-md pt-2">
                  ระบบรายงานผลรายบุคคลและภาพรวมห้องเรียน — ข้อมูลอัปเดตแบบ Real-time
                </p>
              </div>
              <div className="absolute right-10 bottom-6 w-56 h-56 transform rotate-3 hover:scale-105 transition-transform duration-300">
                <div className="w-full h-full rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white/30 backdrop-blur-sm">
                  <img src="/images/teacher-chibi.jpg" alt="3D Teacher" className="w-full h-full object-cover" />
                </div>
              </div>
            </div>

            {/* Empty State Notice */}
            {totalStudents === 0 && !loading && (
              <div className="p-5 rounded-[2rem] bg-[#FFF7ED] border border-[#FFEDD5] flex items-center gap-4 text-[#EA580C]">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm">
                  <Info className="w-5 h-5 text-[#EA580C]" />
                </div>
                <div>
                  <p className="font-bold text-sm">ยังไม่มีข้อมูลนักเรียน</p>
                  <p className="text-xs font-medium mt-0.5 opacity-80">
                    ยังไม่มีนักเรียนลงทะเบียนในระบบ
                  </p>
                </div>
              </div>
            )}

            {/* KPI Cards — Pastel Style */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {[
                { icon: <Users className="w-6 h-6" />, label: 'นักเรียน', value: totalStudents, suffix: 'คน', sub: 'นักเรียนทั้งหมด', bg: 'bg-[#EFF6FF]', border: 'border-[#DBEAFE]', text: 'text-[#2563EB]' },
                { icon: <CheckCircle2 className="w-6 h-6" />, label: 'เรียนจบ', value: studentsCompleted, suffix: 'คน', sub: 'ผ่านครบ 5 บท', bg: 'bg-[#F0FDF4]', border: 'border-[#DCFCE7]', text: 'text-[#16A34A]' },
                { icon: <TrendingUp className="w-6 h-6" />, label: 'พัฒนาการ (ความรู้)', value: improvementKnowledge, suffix: '%', sub: 'Pre ➔ Post Knowledge', bg: 'bg-[#FFF7ED]', border: 'border-[#FFEDD5]', text: 'text-[#EA580C]' },
                { icon: <Gamepad2 className="w-6 h-6" />, label: 'บอร์ดเกม', value: avgGame, suffix: 'แต้ม', sub: 'คะแนนเฉลี่ย', bg: 'bg-[#FAF5FF]', border: 'border-[#F3E8FF]', text: 'text-[#9333EA]' },
                { icon: <BarChart2 className="w-6 h-6" />, label: 'Pre — ความรู้', value: avgPreKnowledge, suffix: '/ 20', sub: 'เฉลี่ยก่อนเรียน', bg: 'bg-[#F0FDF4]', border: 'border-[#DCFCE7]', text: 'text-[#16A34A]' },
                { icon: <BarChart2 className="w-6 h-6" />, label: 'Pre — ทักษะ', value: avgPreSkill, suffix: '/ 20', sub: 'เฉลี่ยก่อนเรียน', bg: 'bg-[#F0FDFA]', border: 'border-[#CCFBF1]', text: 'text-[#0D9488]' },
                { icon: <CheckCircle2 className="w-6 h-6" />, label: 'Post — ความรู้', value: avgPostKnowledge, suffix: '/ 20', sub: 'เฉลี่ยหลังเรียน', bg: 'bg-[#FFF7ED]', border: 'border-[#FFEDD5]', text: 'text-[#EA580C]' },
                { icon: <CheckCircle2 className="w-6 h-6" />, label: 'Post — ทักษะ', value: avgPostSkill, suffix: '/ 20', sub: 'เฉลี่ยหลังเรียน', bg: 'bg-[#FFF1F2]', border: 'border-[#FFE4E6]', text: 'text-[#E11D48]' },
                { icon: <Clock className="w-6 h-6" />, label: 'เวลาเรียน', value: avgStudyMins, suffix: 'นาที', sub: 'เวลาเฉลี่ยรวม', bg: 'bg-[#EFF6FF]', border: 'border-[#DBEAFE]', text: 'text-[#2563EB]' },
                { icon: <Award className="w-6 h-6" />, label: 'เกียรติบัตร', value: totalBadges, suffix: 'ใบ', sub: 'ที่ปลดล็อกแล้ว', bg: 'bg-[#FAF5FF]', border: 'border-[#F3E8FF]', text: 'text-[#9333EA]' },
              ].map((card, i) => (
                <div key={i} className={`${card.bg} border ${card.border} rounded-3xl p-5 flex flex-col items-center text-center shadow-sm hover:-translate-y-1 transition-transform cursor-pointer`}>
                  <div className={`w-14 h-14 rounded-full bg-white ${card.text} flex items-center justify-center shadow-sm mb-4`}>
                    {card.icon}
                  </div>
                  <h4 className={`font-bold ${card.text} text-sm mb-1`}>{card.label}</h4>
                  <p className="text-[10px] text-slate-500 font-medium mb-3 h-4 flex items-center">{card.sub}</p>
                  <div className={`bg-white px-4 py-1.5 rounded-lg ${card.text} font-black w-full border ${card.border}`}>
                    {card.value} {card.suffix}
                  </div>
                </div>
              ))}
            </div>

            {/* Live Activity & Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
              
              {/* Live Activity Tracker */}
              <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex flex-col">
                <h3 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <MonitorPlay className="w-4 h-4 text-emerald-500 animate-pulse" /> นักเรียนที่กำลังออนไลน์ (Live)
                </h3>
                <div className="flex-1 space-y-3 overflow-y-auto">
                  {activeStudents.length > 0 ? (
                    activeStudents.map((student) => (
                      <div key={student.id} className="flex items-center gap-4 p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center shrink-0">
                          {student.first_name ? student.first_name.charAt(0) : '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-slate-800 text-xs truncate">
                            {student.first_name} {student.last_name} <span className="font-normal text-slate-500 ml-1">({student.class_name})</span>
                          </h4>
                          <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            {student.current_activity || 'อยู่ในระบบ'}
                          </p>
                        </div>
                        <div className="text-[9px] text-slate-400 font-bold text-right shrink-0">
                          {student.last_login_at && !isNaN(new Date(student.last_login_at).getTime()) 
                            ? formatDistanceToNow(new Date(student.last_login_at), { addSuffix: true, locale: th }) 
                            : 'เพิ่งเข้ามา'}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs font-bold py-10">
                      <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                        <MonitorPlay className="w-5 h-5 text-slate-300" />
                      </div>
                      ไม่มีนักเรียนออนไลน์ในขณะนี้
                    </div>
                  )}
                </div>
              </div>

              {/* Pre vs Post Comparison */}
              <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
                <h3 className="text-sm font-bold text-slate-800 mb-6 w-full text-left flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-[#4285F4]" /> เปรียบเทียบคะแนนรายห้องเรียน
                </h3>
                <PrePostComparisonChart data={classData} />
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
