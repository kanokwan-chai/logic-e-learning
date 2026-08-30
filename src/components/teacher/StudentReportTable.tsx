'use client';

import { useState, useEffect } from 'react';
import { StudentReportItem } from '@/types';
import { supabase } from '@/lib/supabase/client';
import { exportToCSV } from '@/lib/exportUtils';
import { Search, Filter, Download, FileSpreadsheet, Sparkles, TrendingUp, Loader2 } from 'lucide-react';

export default function StudentReportTable() {
  const [data, setData] = useState<StudentReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('ทั้งหมด');
  const [minScore, setMinScore] = useState<number>(0);

  useEffect(() => {
    async function fetchData() {
      const { data: students } = await supabase.from('students').select('*').order('last_login_at', { ascending: false });
      const { data: questProgress } = await supabase.from('quest_progress').select('*');
      const { data: testResults } = await supabase.from('test_results').select('*');
      const { data: gameProgress } = await supabase.from('game_progress').select('*');

      if (students) {
        const questMap = new Map((questProgress || []).map(q => [q.student_id, q]));
        
        const reports = students.map((s) => {
          const p = s.progress_data || {};
          const q = questMap.get(s.id);
          
          const studentTests = (testResults || []).filter(t => t.student_id === s.id);
          const preK = studentTests.find(t => t.test_type === 'pre_knowledge')?.score ?? p.preKnowledgeResult?.score ?? 0;
          const preS = studentTests.find(t => t.test_type === 'pre_skill')?.score ?? p.preSkillResult?.score ?? 0;
          const postK = studentTests.find(t => t.test_type === 'post_knowledge')?.score ?? p.postKnowledgeResult?.score ?? 0;
          const postS = studentTests.find(t => t.test_type === 'post_skill')?.score ?? p.postSkillResult?.score ?? 0;

          const studentGame = (gameProgress || []).filter(g => g.student_id === s.id);
          const gScore = studentGame[0]?.points ?? p.gameResult?.score ?? 0;

          const completedLessonsCount = q?.completed_lessons?.length || p.completedLessons?.length || 0;

          return {
            id: s.id,
            student_id: s.number > 0 ? s.number : '-',
            full_name: `${s.first_name || ''} ${s.last_name || ''}`,
            class_name: s.class_name || '-',
            preKnowledge: preK,
            preSkill: preS,
            completedLessons: completedLessonsCount,
            gameScore: gScore,
            postKnowledge: postK,
            postSkill: postS,
            lastLoginAt: s.last_login_at || '',
          };
        });
        setData(reports as any);
      }
      setLoading(false);
    }
    fetchData();

    const channel = supabase.channel('students_table_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, (payload) => {
        fetchData();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const filteredData = data.filter((item: any) => {
    const matchesSearch =
      item.full_name.includes(searchTerm) || item.student_id.includes(searchTerm);
    const matchesClass = selectedClass === 'ทั้งหมด' || item.class_name === selectedClass;
    const matchesScore = (item.postKnowledge ?? 0) >= minScore;
    return matchesSearch && matchesClass && matchesScore;
  });

  const handleExportCSV = () => {
    exportToCSV(filteredData);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-soft-sm space-y-4">
      {/* Table Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-100">
        <div>
          <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" /> รายงานผลการเรียนรู้และวิเคราะห์รายบุคคล (Learning Analytics)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            แสดง {filteredData.length} จาก {data.length} รายการ
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 rounded-xl bg-success text-slate-800 font-bold text-xs hover:bg-success/80 transition-all flex items-center gap-1.5 shadow-soft-sm"
          >
            <FileSpreadsheet className="w-4 h-4" /> Export CSV / Excel
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ค้นหาชื่อ หรือ รหัสนักศึกษา..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Class Filter */}
        <div className="relative">
          <Filter className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="ทั้งหมด">ห้องเรียน: ทั้งหมด</option>
            <option value="ปวช. 1/1">ปวช. 1/1</option>
            <option value="ปวช. 1/2">ปวช. 1/2</option>
            <option value="ปวช. 1/3">ปวช. 1/3</option>
          </select>
        </div>

        {/* Min Score Filter */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl">
          <span className="text-xs text-slate-500 font-medium whitespace-nowrap">ขั้นต่ำ Post-test:</span>
          <input
            type="range"
            min="0"
            max="20"
            value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <span className="text-xs font-bold text-primary w-6 text-right">{minScore}</span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <th className="p-3.5 rounded-tl-xl">เวลาที่เข้ามา</th>
              <th className="p-3.5">รหัสนักศึกษา</th>
              <th className="p-3.5">ชื่อ-นามสกุล</th>
              <th className="p-3.5">ห้องเรียน</th>
              <th className="p-3.5 text-center">ก่อนเรียน</th>
              <th className="p-3.5 text-center">ก่อนทักษะ</th>
              <th className="p-3.5 text-center">บทเรียนที่เรียนจบ</th>
              <th className="p-3.5 text-center">เกม</th>
              <th className="p-3.5 text-center">หลังเรียน</th>
              <th className="p-3.5 text-center rounded-tr-xl">หลังทักษะ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredData.map((item: any) => (
              <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="p-3.5 text-slate-500">{item.lastLoginAt ? new Date(item.lastLoginAt).toLocaleString('th-TH') : '-'}</td>
                <td className="p-3.5 font-mono font-bold text-slate-700">{item.student_id}</td>
                <td className="p-3.5 font-semibold text-slate-800">{item.full_name}</td>
                <td className="p-3.5 text-slate-600">
                  <span className="px-2.5 py-0.5 rounded-full bg-secondary-light text-slate-700 text-[11px] font-medium">
                    {item.class_name}
                  </span>
                </td>
                <td className="p-3.5 text-center font-bold text-slate-700">{item.preKnowledge}</td>
                <td className="p-3.5 text-center font-bold text-slate-700">{item.preSkill}</td>
                <td className="p-3.5 text-center font-bold text-slate-700">{item.completedLessons}/5</td>
                <td className="p-3.5 text-center font-bold text-amber-600">{item.gameScore}</td>
                <td className="p-3.5 text-center font-bold text-primary">{item.postKnowledge}</td>
                <td className="p-3.5 text-center font-bold text-primary">{item.postSkill}</td>
              </tr>
            ))}

            {filteredData.length === 0 && (
              <tr>
                <td colSpan={10} className="p-8 text-center text-slate-400 text-xs">
                  ไม่พบข้อมูลนักเรียนตรงตามเงื่อนไขการค้นหา
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
