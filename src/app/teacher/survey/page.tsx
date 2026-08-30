'use client';

import { useState, useEffect, useMemo } from 'react';
import TeacherSidebar from '@/components/layout/TeacherSidebar';
import { 
  Star, Plus, Trash2, Save, FileSpreadsheet, Download, RefreshCw, 
  MessageSquare, UserCheck, BarChart3, TrendingUp, Search, Calendar,
  CheckCircle2, Sparkles, HelpCircle, FileText
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import * as XLSX from 'xlsx';

type SurveyQuestion = {
  id: string;
  question_text: string;
  type: 'rating' | 'text';
  created_at: string;
};

type SurveyResponse = {
  id: string;
  user_id: string;
  student_name: string;
  responses: Record<string, string | number>;
  created_at: string;
};

export default function TeacherSurveyPage() {
  const [activeTab, setActiveTab] = useState<'results' | 'analytics' | 'questions'>('results');
  
  // Questions State
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newQuestionType, setNewQuestionType] = useState<'rating' | 'text'>('rating');
  const [isAdding, setIsAdding] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');

  // Results State
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Fetch functions
  async function fetchQuestions() {
    const { data } = await supabase
      .from('survey_questions')
      .select('*')
      .order('created_at', { ascending: true });
    if (data) setQuestions(data);
  }

  async function fetchResponses(isManual = false) {
    if (isManual) setRefreshing(true);
    const { data } = await supabase
      .from('survey_responses')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) {
      setResponses(data);
      setLastUpdated(new Date());
    }
    if (isManual) {
      setTimeout(() => setRefreshing(false), 500);
    }
  }

  useEffect(() => {
    async function init() {
      setLoading(true);
      await Promise.all([fetchQuestions(), fetchResponses()]);
      setLoading(false);
    }
    init();

    // Auto-polling every 3 seconds for guaranteed real-time updates
    const interval = setInterval(() => {
      fetchResponses();
    }, 3000);

    // Supabase Realtime channel
    const channel = supabase
      .channel('survey-realtime-teacher')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'survey_responses' }, () => {
        fetchResponses();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'survey_questions' }, () => {
        fetchQuestions();
      })
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  async function handleAddQuestion() {
    if (!newQuestionText.trim()) return;
    setIsAdding(true);
    
    const newQ = { question_text: newQuestionText.trim(), type: newQuestionType };
    const { data, error } = await supabase.from('survey_questions').insert([newQ]).select().single();
    
    if (error) {
      alert('เกิดข้อผิดพลาดในการบันทึก: ' + error.message);
    }
    
    if (data) {
      setQuestions([...questions, data]);
      setNewQuestionText('');
    }
    setIsAdding(false);
  }

  async function handleDeleteQuestion(id: string) {
    if (confirm('ยืนยันการลบคำถามนี้? ข้อมูลคำตอบเดิมในระบบอาจได้รับผลกระทบ')) {
      await supabase.from('survey_questions').delete().eq('id', id);
      setQuestions(questions.filter(q => q.id !== id));
    }
  }

  // Analytics Calculations
  const ratingQuestions = useMemo(() => questions.filter(q => q.type === 'rating'), [questions]);
  const textQuestions = useMemo(() => questions.filter(q => q.type === 'text'), [questions]);

  const totalResponses = responses.length;

  const { overallAvg, questionStats } = useMemo(() => {
    if (totalResponses === 0 || ratingQuestions.length === 0) {
      return { overallAvg: 0, questionStats: [] };
    }

    let grandTotal = 0;
    let grandCount = 0;

    const stats = ratingQuestions.map((q, idx) => {
      let qTotal = 0;
      let qCount = 0;
      const distribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

      responses.forEach(r => {
        const val = Number(r.responses[q.id]);
        if (!isNaN(val) && val >= 1 && val <= 5) {
          qTotal += val;
          qCount++;
          distribution[val] = (distribution[val] || 0) + 1;
        }
      });

      const avg = qCount > 0 ? qTotal / qCount : 0;
      grandTotal += qTotal;
      grandCount += qCount;

      return {
        id: q.id,
        index: idx + 1,
        question_text: q.question_text,
        avg,
        count: qCount,
        distribution,
      };
    });

    const overall = grandCount > 0 ? grandTotal / grandCount : 0;
    return { overallAvg: overall, questionStats: stats };
  }, [responses, ratingQuestions, totalResponses]);

  // Export to Excel (.xlsx)
  const handleExportExcel = () => {
    if (responses.length === 0) {
      alert('ยังไม่มีข้อมูลการตอบแบบประเมินให้ส่งออก');
      return;
    }

    // Sheet 1: Detailed Responses
    const responseRows = responses.map((r, i) => {
      const row: Record<string, any> = {
        'ลำดับ': i + 1,
        'ชื่อ-นามสกุล': r.student_name || 'ไม่ระบุชื่อ',
        'วันเวลาที่ประเมิน': new Date(r.created_at).toLocaleString('th-TH'),
      };

      // Add each question column
      questions.forEach((q, qIndex) => {
        const colTitle = `ข้อ ${qIndex + 1}: ${q.question_text}`;
        row[colTitle] = r.responses[q.id] !== undefined ? r.responses[q.id] : '-';
      });

      // Individual average
      let userSum = 0;
      let userCount = 0;
      ratingQuestions.forEach(rq => {
        const val = Number(r.responses[rq.id]);
        if (!isNaN(val) && val >= 1 && val <= 5) {
          userSum += val;
          userCount++;
        }
      });
      row['คะแนนเฉลี่ยรวม (5 ดาว)'] = userCount > 0 ? (userSum / userCount).toFixed(2) : '-';

      return row;
    });

    // Sheet 2: Summary Stats per Question
    const summaryRows = questionStats.map((qs) => ({
      'ข้อที่': qs.index,
      'คำถาม': qs.question_text,
      'คะแนนเฉลี่ย (เต็ม 5)': qs.avg.toFixed(2),
      'จำนวนผู้ตอบ (คน)': qs.count,
      '5 ดาว (คน)': qs.distribution[5] || 0,
      '4 ดาว (คน)': qs.distribution[4] || 0,
      '3 ดาว (คน)': qs.distribution[3] || 0,
      '2 ดาว (คน)': qs.distribution[2] || 0,
      '1 ดาว (คน)': qs.distribution[1] || 0,
    }));

    summaryRows.push({
      'ข้อที่': 0,
      'คำถาม': '=== คะแนนเฉลี่ยรวมทุกข้อ ===',
      'คะแนนเฉลี่ย (เต็ม 5)': overallAvg.toFixed(2),
      'จำนวนผู้ตอบ (คน)': totalResponses,
      '5 ดาว (คน)': 0,
      '4 ดาว (คน)': 0,
      '3 ดาว (คน)': 0,
      '2 ดาว (คน)': 0,
      '1 ดาว (คน)': 0,
    });

    const wb = XLSX.utils.book_new();
    const wsResponses = XLSX.utils.json_to_sheet(responseRows);
    const wsSummary = XLSX.utils.json_to_sheet(summaryRows);

    XLSX.utils.book_append_sheet(wb, wsResponses, 'ผลการประเมินรายคน');
    XLSX.utils.book_append_sheet(wb, wsSummary, 'สรุปค่าเฉลี่ยรายข้อ');

    const fileName = `รายงานผลแบบประเมิน_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  // Filtered responses by search
  const filteredResponses = useMemo(() => {
    if (!searchQuery.trim()) return responses;
    return responses.filter(r => 
      (r.student_name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [responses, searchQuery]);

  return (
    <div className="min-h-screen md:flex md:h-screen bg-[#F8FAFC] md:overflow-hidden font-sans">
      <TeacherSidebar />

      <div className="flex-1 flex flex-col md:h-full overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-6 sm:p-8 text-white shadow-soft-md relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-2">
                  <span className="p-2 bg-white/20 rounded-2xl backdrop-blur-md">
                    <Star className="w-7 h-7 text-amber-300 fill-amber-300" />
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                    ระบบสรุปแบบประเมินความพึงพอใจ
                  </h1>
                </div>
                <p className="text-blue-100 font-medium text-xs sm:text-sm max-w-xl">
                  รายงานผลการประเมินและข้อเสนอแนะจากนักเรียนแบบเรียลไทม์ พร้อมระบบส่งออกข้อมูล Excel
                </p>
                <div className="flex items-center gap-2 mt-3 text-xs text-blue-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>ระบบซิงค์ข้อมูลเรียลไทม์อัตโนมัติ (อัปเดตล่าสุด: {lastUpdated.toLocaleTimeString('th-TH')})</span>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 relative z-10">
                <button
                  onClick={() => fetchResponses(true)}
                  disabled={refreshing}
                  className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition-all flex items-center gap-2 backdrop-blur-md active:scale-95 cursor-pointer"
                  title="รีเฟรชข้อมูลตอนนี้"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  {refreshing ? 'กำลังโหลด...' : 'รีเฟรช'}
                </button>

                <button
                  onClick={handleExportExcel}
                  className="px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black transition-all flex items-center gap-2 shadow-soft-sm hover:shadow-soft-md active:scale-95 cursor-pointer border-b-2 border-emerald-700"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  ส่งออก Excel (.xlsx)
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 p-1.5 bg-slate-200/70 rounded-2xl w-fit">
              <button 
                onClick={() => setActiveTab('results')}
                className={`px-5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'results' 
                    ? 'bg-white text-blue-600 shadow-soft-sm' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserCheck className="w-4 h-4" /> รายชื่อผู้ประเมิน ({totalResponses})
              </button>

              <button 
                onClick={() => setActiveTab('analytics')}
                className={`px-5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'analytics' 
                    ? 'bg-white text-blue-600 shadow-soft-sm' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BarChart3 className="w-4 h-4" /> สรุปผลรายข้อ & สถิติ
              </button>

              <button 
                onClick={() => setActiveTab('questions')}
                className={`px-5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'questions' 
                    ? 'bg-white text-blue-600 shadow-soft-sm' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <HelpCircle className="w-4 h-4" /> จัดการคำถาม ({questions.length})
              </button>
            </div>

            {/* Summary Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-3xl p-5 shadow-soft-sm border border-slate-100 flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <UserCheck className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500">จำนวนผู้ตอบแบบประเมิน</p>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-2xl sm:text-3xl font-black text-slate-800">{totalResponses}</span>
                    <span className="text-xs font-bold text-slate-400">คน</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-5 shadow-soft-sm border border-amber-100 flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                  <Star className="w-7 h-7 fill-amber-400 text-amber-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500">ความพึงพอใจเฉลี่ยรวม</p>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-2xl sm:text-3xl font-black text-slate-800">{overallAvg.toFixed(2)}</span>
                    <span className="text-xs font-bold text-slate-400">/ 5.00</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-5 shadow-soft-sm border border-indigo-100 flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500">ข้อเสนอแนะเพิ่มเติม</p>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-2xl sm:text-3xl font-black text-slate-800">
                      {responses.filter(r => textQuestions.some(tq => !!r.responses[tq.id] && r.responses[tq.id] !== '-')).length}
                    </span>
                    <span className="text-xs font-bold text-slate-400">ข้อความ</span>
                  </div>
                </div>
              </div>
            </div>

            {/* TAB 1: RESULTS (Individual Responses) */}
            {activeTab === 'results' && (
              <div className="space-y-4">
                {/* Search Bar */}
                <div className="bg-white rounded-3xl p-4 shadow-soft-sm border border-slate-100 flex items-center gap-3">
                  <Search className="w-5 h-5 text-slate-400 shrink-0 ml-2" />
                  <input
                    type="text"
                    placeholder="ค้นหาตามชื่อนักเรียน..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent border-0 text-xs sm:text-sm font-bold text-slate-800 focus:outline-none placeholder:text-slate-400"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="text-xs text-slate-400 hover:text-slate-600 font-bold px-2">
                      ล้าง
                    </button>
                  )}
                </div>

                {loading ? (
                  <div className="bg-white rounded-3xl p-12 text-center text-slate-400 font-bold text-sm">
                    กำลังโหลดข้อมูลแบบประเมิน...
                  </div>
                ) : filteredResponses.length === 0 ? (
                  <div className="bg-white rounded-3xl p-12 text-center text-slate-400 font-bold text-sm border-2 border-dashed border-slate-200">
                    {searchQuery ? 'ไม่พบนักเรียนที่ค้นหา' : 'ยังไม่มีผู้ตอบแบบประเมินในระบบ'}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredResponses.map((r, i) => {
                      // Calculate this user's average rating
                      let userScoreSum = 0;
                      let userScoreCount = 0;
                      ratingQuestions.forEach(rq => {
                        const val = Number(r.responses[rq.id]);
                        if (!isNaN(val) && val >= 1 && val <= 5) {
                          userScoreSum += val;
                          userScoreCount++;
                        }
                      });
                      const userAvg = userScoreCount > 0 ? (userScoreSum / userScoreCount).toFixed(2) : '-';

                      return (
                        <div 
                          key={r.id} 
                          className="bg-white rounded-3xl p-6 shadow-soft-sm border border-slate-100 space-y-4 hover:border-blue-200 transition-all"
                        >
                          {/* Student Info Bar */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 font-black text-xs flex items-center justify-center shadow-soft-xs">
                                #{totalResponses - responses.findIndex(item => item.id === r.id)}
                              </div>
                              <div>
                                <h3 className="font-extrabold text-sm text-slate-800">
                                  {r.student_name || 'ไม่ระบุชื่อ'}
                                </h3>
                                <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1 mt-0.5">
                                  <Calendar className="w-3 h-3" /> {new Date(r.created_at).toLocaleString('th-TH')}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 font-black text-xs flex items-center gap-1">
                                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> เฉลี่ย {userAvg} / 5
                              </span>
                            </div>
                          </div>

                          {/* Question Answers Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                            {questions.map((q, qIndex) => {
                              const ans = r.responses[q.id];
                              if (ans === undefined) return null;

                              return (
                                <div 
                                  key={q.id} 
                                  className={`p-3.5 rounded-2xl text-xs border ${
                                    q.type === 'text' 
                                      ? 'bg-purple-50/50 border-purple-100 md:col-span-2' 
                                      : 'bg-slate-50 border-slate-100'
                                  }`}
                                >
                                  <p className="font-bold text-slate-700 mb-1.5 leading-snug">
                                    <span className="text-primary font-black mr-1">{qIndex + 1}.</span>
                                    {q.question_text}
                                  </p>

                                  {q.type === 'rating' ? (
                                    <div className="flex items-center gap-1">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                          key={star}
                                          className={`w-4 h-4 ${
                                            star <= Number(ans)
                                              ? 'text-amber-400 fill-amber-400'
                                              : 'text-slate-200'
                                          }`}
                                        />
                                      ))}
                                      <span className="ml-2 font-black text-xs text-slate-700">
                                        ({ans} ดาว)
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="bg-white p-3 rounded-xl border border-slate-200 font-medium text-slate-700 mt-1">
                                      {ans || '-'}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: ANALYTICS (Question by Question Breakdown) */}
            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <div className="bg-white rounded-3xl p-6 shadow-soft-sm border border-slate-100 space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-black text-base text-slate-800 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-primary" /> สรุปคะแนนเฉลี่ยรายข้อ ({ratingQuestions.length} ข้อ)
                      </h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        เปรียบเทียบระดับความพึงพอใจของแต่ละหัวข้อ เพื่อนำไปปรับปรุงการเรียนการสอน
                      </p>
                    </div>

                    <button
                      onClick={handleExportExcel}
                      className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" /> ส่งออกสรุป (.xlsx)
                    </button>
                  </div>

                  {questionStats.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 font-bold text-sm">
                      ยังไม่มีข้อมูลคะแนนประเมิน
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {questionStats.map((qs) => {
                        const pct = (qs.avg / 5) * 100;
                        return (
                          <div key={qs.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                              <div className="font-extrabold text-slate-800">
                                <span className="text-primary font-black mr-1.5">ข้อ {qs.index}.</span>
                                {qs.question_text}
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="font-black text-sm text-slate-800">{qs.avg.toFixed(2)}</span>
                                <span className="text-[10px] text-slate-400 font-bold">/ 5.00</span>
                              </div>
                            </div>

                            {/* Progress bar */}
                            <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden flex">
                              <div 
                                className="bg-gradient-to-r from-amber-400 to-amber-500 h-full rounded-full transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>

                            {/* Rating Distribution Breakdown */}
                            <div className="flex flex-wrap gap-3 pt-1 text-[11px] text-slate-500 font-bold">
                              <span>5 ดาว: <b className="text-slate-800">{qs.distribution[5] || 0} คน</b></span>
                              <span>4 ดาว: <b className="text-slate-800">{qs.distribution[4] || 0} คน</b></span>
                              <span>3 ดาว: <b className="text-slate-800">{qs.distribution[3] || 0} คน</b></span>
                              <span>2 ดาว: <b className="text-slate-800">{qs.distribution[2] || 0} คน</b></span>
                              <span>1 ดาว: <b className="text-slate-800">{qs.distribution[1] || 0} คน</b></span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Suggestions List */}
                {textQuestions.length > 0 && (
                  <div className="bg-white rounded-3xl p-6 shadow-soft-sm border border-slate-100 space-y-4">
                    <h3 className="font-black text-base text-slate-800 flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-indigo-500" /> รวมข้อเสนอแนะและคำติชมจากนักเรียน
                    </h3>

                    <div className="space-y-3">
                      {responses
                        .filter(r => textQuestions.some(tq => !!r.responses[tq.id] && r.responses[tq.id] !== '-'))
                        .map((r) => (
                          <div key={r.id} className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-2">
                            <div className="flex items-center justify-between text-xs border-b border-indigo-100/60 pb-2">
                              <span className="font-bold text-slate-800">{r.student_name}</span>
                              <span className="text-[10px] text-slate-400 font-medium">
                                {new Date(r.created_at).toLocaleString('th-TH')}
                              </span>
                            </div>
                            {textQuestions.map(tq => (
                              <div key={tq.id} className="text-xs text-slate-700 font-medium">
                                {r.responses[tq.id] && r.responses[tq.id] !== '-' ? (
                                  <p className="bg-white p-3 rounded-xl border border-indigo-100">
                                    {r.responses[tq.id]}
                                  </p>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: QUESTIONS MANAGEMENT */}
            {activeTab === 'questions' && (
              <div className="space-y-6">
                {/* Add new question form */}
                <div className="bg-white rounded-3xl shadow-soft-sm border border-blue-100 p-6 space-y-4">
                  <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-primary" /> เพิ่มข้อคำถามใหม่ในแบบประเมิน
                  </h3>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input 
                      type="text" 
                      placeholder="พิมพ์ข้อความคำถามที่ต้องการถามนักเรียน..." 
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                      value={newQuestionText}
                      onChange={(e) => setNewQuestionText(e.target.value)}
                    />
                    <select 
                      className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs sm:text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary"
                      value={newQuestionType}
                      onChange={(e) => setNewQuestionType(e.target.value as 'rating' | 'text')}
                    >
                      <option value="rating">⭐ ให้คะแนน (1-5 ดาว)</option>
                      <option value="text">📝 พิมพ์ข้อความ (ข้อเสนอแนะ)</option>
                    </select>
                    <button 
                      onClick={handleAddQuestion}
                      disabled={isAdding || !newQuestionText.trim()}
                      className="bg-primary hover:bg-primary-hover disabled:opacity-50 text-white px-6 py-3 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 shadow-soft-sm cursor-pointer"
                    >
                      {isAdding ? 'กำลังบันทึก...' : <><Save className="w-4 h-4" /> บันทึกคำถาม</>}
                    </button>
                  </div>
                </div>

                {/* List of existing questions */}
                <div className="bg-white rounded-3xl shadow-soft-sm border border-slate-100 p-6 space-y-4">
                  <h3 className="font-extrabold text-sm text-slate-800">
                    รายการคำถามแบบประเมินปัจจุบัน ({questions.length} ข้อ)
                  </h3>

                  {loading ? (
                    <div className="py-10 text-center text-slate-400 font-bold text-xs">กำลังโหลดคำถาม...</div>
                  ) : questions.length === 0 ? (
                    <div className="py-10 text-center text-slate-400 font-bold text-xs bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                      ยังไม่มีคำถามแบบประเมินในระบบ
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {questions.map((q, index) => (
                        <div 
                          key={q.id} 
                          className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200/80 rounded-2xl gap-3 hover:border-blue-200 transition-all"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-xl bg-white text-primary font-black text-xs flex items-center justify-center shrink-0 border border-slate-200 shadow-soft-xs">
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-extrabold text-slate-800 text-xs sm:text-sm">{q.question_text}</p>
                              <p className="text-[11px] text-slate-500 mt-0.5 font-bold">
                                รูปแบบ: {q.type === 'rating' ? '⭐ ให้คะแนน 1-5 ดาว' : '📝 พิมพ์ข้อความอิสระ'}
                              </p>
                            </div>
                          </div>
                          
                          <button 
                            onClick={() => handleDeleteQuestion(q.id)}
                            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors shrink-0 cursor-pointer"
                            title="ลบคำถามนี้"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
