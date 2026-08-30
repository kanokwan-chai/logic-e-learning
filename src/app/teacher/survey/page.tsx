'use client';

import { useState, useEffect } from 'react';
import TeacherSidebar from '@/components/layout/TeacherSidebar';
import { 
  Star, Plus, Trash2, Save, FileSpreadsheet, Download, RefreshCw, 
  Search, FileText, CheckCircle2
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
  const [activeTab, setActiveTab] = useState<'results' | 'questions'>('results');
  
  // Questions State
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newQuestionType, setNewQuestionType] = useState<'rating' | 'text'>('rating');
  const [isAdding, setIsAdding] = useState(false);

  // Results State
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

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
    }
    if (isManual) {
      setTimeout(() => setRefreshing(false), 400);
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

    // Supabase Realtime subscription
    const channel = supabase
      .channel('survey-realtime-teacher-feed')
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
    if (confirm('ยืนยันการลบคำถามนี้?')) {
      await supabase.from('survey_questions').delete().eq('id', id);
      setQuestions(questions.filter(q => q.id !== id));
    }
  }

  // Calculate stats
  const totalResponses = responses.length;
  let averageRating = 0;
  
  if (totalResponses > 0 && questions.length > 0) {
    let totalScore = 0;
    let count = 0;
    responses.forEach(r => {
      questions.forEach(q => {
        if (q.type === 'rating' && r.responses && r.responses[q.id] !== undefined) {
          const val = Number(r.responses[q.id]);
          if (!isNaN(val) && val >= 1 && val <= 5) {
            totalScore += val;
            count++;
          }
        }
      });
    });
    if (count > 0) averageRating = totalScore / count;
  }

  // Export to Excel (.xlsx)
  const handleExportExcel = () => {
    if (responses.length === 0) {
      alert('ยังไม่มีข้อมูลการตอบแบบประเมินในระบบ');
      return;
    }

    // 1. Data Sheet
    const dataRows = responses.map((r, i) => {
      const row: Record<string, any> = {
        'ลำดับ': i + 1,
        'ชื่อ-นามสกุล': r.student_name || 'ไม่ระบุชื่อ',
        'วันเวลาที่ประเมิน': new Date(r.created_at).toLocaleString('th-TH'),
      };

      let sumRating = 0;
      let countRating = 0;

      questions.forEach((q, idx) => {
        const key = `ข้อ ${idx + 1}: ${q.question_text}`;
        const val = r.responses ? r.responses[q.id] : undefined;
        row[key] = val !== undefined ? val : '-';

        if (q.type === 'rating' && val !== undefined) {
          const n = Number(val);
          if (!isNaN(n) && n >= 1 && n <= 5) {
            sumRating += n;
            countRating++;
          }
        }
      });

      row['คะแนนเฉลี่ยส่วนบุคคล (5 ดาว)'] = countRating > 0 ? (sumRating / countRating).toFixed(2) : '-';
      return row;
    });

    // 2. Summary Sheet
    const summaryRows = questions
      .filter(q => q.type === 'rating')
      .map((q, idx) => {
        let qSum = 0;
        let qCount = 0;
        const dist: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

        responses.forEach(r => {
          if (r.responses && r.responses[q.id] !== undefined) {
            const v = Number(r.responses[q.id]);
            if (!isNaN(v) && v >= 1 && v <= 5) {
              qSum += v;
              qCount++;
              dist[v] = (dist[v] || 0) + 1;
            }
          }
        });

        return {
          'ข้อที่': idx + 1,
          'คำถาม': q.question_text,
          'คะแนนเฉลี่ย (เต็ม 5)': qCount > 0 ? (qSum / qCount).toFixed(2) : '0.00',
          'จำนวนผู้ตอบ (คน)': qCount,
          '5 ดาว': dist[5] || 0,
          '4 ดาว': dist[4] || 0,
          '3 ดาว': dist[3] || 0,
          '2 ดาว': dist[2] || 0,
          '1 ดาว': dist[1] || 0,
        };
      });

    summaryRows.push({
      'ข้อที่': 0,
      'คำถาม': '=== คะแนนเฉลี่ยรวมทุกข้อ ===',
      'คะแนนเฉลี่ย (เต็ม 5)': averageRating.toFixed(2),
      'จำนวนผู้ตอบ (คน)': totalResponses,
      '5 ดาว': 0,
      '4 ดาว': 0,
      '3 ดาว': 0,
      '2 ดาว': 0,
      '1 ดาว': 0,
    });

    const wb = XLSX.utils.book_new();
    const wsData = XLSX.utils.json_to_sheet(dataRows);
    const wsSummary = XLSX.utils.json_to_sheet(summaryRows);

    XLSX.utils.book_append_sheet(wb, wsData, 'ผลการประเมินรายคน');
    XLSX.utils.book_append_sheet(wb, wsSummary, 'สรุปค่าเฉลี่ยรายข้อ');

    const fileName = `รายงานแบบประเมินความพึงพอใจ_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  // Export to CSV (.csv)
  const handleExportCSV = () => {
    if (responses.length === 0) {
      alert('ยังไม่มีข้อมูลการตอบแบบประเมินในระบบ');
      return;
    }

    const headers = [
      'ลำดับ',
      'ชื่อ-นามสกุล',
      'วันเวลาที่ส่ง',
      ...questions.map((q, idx) => `"ข้อ ${idx + 1}: ${q.question_text.replace(/"/g, '""')}"`),
    ];

    const rows = responses.map((r, i) => {
      const qAnswers = questions.map(q => {
        const val = r.responses ? r.responses[q.id] : '';
        return `"${String(val !== undefined ? val : '-').replace(/"/g, '""')}"`;
      });

      return [
        i + 1,
        `"${(r.student_name || 'ไม่ระบุชื่อ').replace(/"/g, '""')}"`,
        `"${new Date(r.created_at).toLocaleString('th-TH')}"`,
        ...qAnswers,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `รายงานแบบประเมิน_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered responses
  const filteredResponses = responses.filter(r => 
    !searchQuery.trim() || (r.student_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen md:flex md:h-screen bg-[#F8FAFC] md:overflow-hidden font-sans">
      <TeacherSidebar />

      <div className="flex-1 flex flex-col md:h-full overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-5xl mx-auto space-y-6">
            
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-[#4285F4] to-blue-500 rounded-3xl p-6 sm:p-8 text-white shadow-soft-sm relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="relative z-10">
                <h1 className="text-2xl sm:text-3xl font-black mb-2 flex items-center gap-2">
                  <Star className="w-8 h-8 text-amber-300 fill-amber-300" /> ระบบแบบประเมิน
                </h1>
                <p className="text-blue-100 font-medium text-xs sm:text-sm">
                  จัดการคำถามแบบประเมินและดูผลลัพธ์ความพึงพอใจของนักเรียน
                </p>
                <div className="flex items-center gap-2 mt-2 text-[11px] text-blue-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>อัปเดตเรียลไทม์อัตโนมัติ</span>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-2 relative z-10">
                <div className="bg-white/10 p-1.5 rounded-2xl backdrop-blur-md flex gap-1">
                  <button 
                    onClick={() => setActiveTab('questions')}
                    className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'questions' 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-white hover:bg-white/20'
                    }`}
                  >
                    จัดการคำถาม
                  </button>
                  <button 
                    onClick={() => setActiveTab('results')}
                    className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'results' 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-white hover:bg-white/20'
                    }`}
                  >
                    ผลการประเมิน
                  </button>
                </div>

                <button
                  onClick={() => fetchResponses(true)}
                  disabled={refreshing}
                  className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur-md cursor-pointer active:scale-95"
                  title="รีเฟรชข้อมูลตอนนี้"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Questions Tab */}
            {activeTab === 'questions' && (
              <div className="space-y-6">
                
                {/* Add new question card */}
                <div className="bg-white rounded-3xl shadow-soft-sm border border-blue-100 p-6">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
                    <Plus className="w-5 h-5 text-blue-500" /> เพิ่มคำถามใหม่
                  </h3>
                  
                  <div className="flex flex-col md:flex-row gap-4">
                    <input 
                      type="text" 
                      placeholder="พิมพ์คำถามที่นี่..." 
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      value={newQuestionText}
                      onChange={(e) => setNewQuestionText(e.target.value)}
                    />
                    <select 
                      className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={newQuestionType}
                      onChange={(e) => setNewQuestionType(e.target.value as 'rating' | 'text')}
                    >
                      <option value="rating">⭐ ให้คะแนน (1-5 ดาว)</option>
                      <option value="text">📝 พิมพ์ข้อความ (ข้อเสนอแนะ)</option>
                    </select>
                    <button 
                      onClick={handleAddQuestion}
                      disabled={isAdding || !newQuestionText.trim()}
                      className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isAdding ? 'กำลังบันทึก...' : <><Save className="w-4 h-4" /> บันทึก</>}
                    </button>
                  </div>
                </div>

                {/* List of questions */}
                <div className="bg-white rounded-3xl shadow-soft-sm border border-slate-100 p-6">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center justify-between">
                    <span>รายการคำถามแบบประเมิน ({questions.length} ข้อ)</span>
                  </h3>
                  
                  {loading ? (
                    <div className="py-10 text-center text-slate-400 font-bold text-sm">กำลังโหลด...</div>
                  ) : questions.length === 0 ? (
                    <div className="py-10 text-center text-slate-400 font-bold text-sm bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                      ยังไม่มีคำถามแบบประเมินในระบบ
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {questions.map((q, index) => (
                        <div key={q.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl gap-4 hover:border-blue-200 transition-colors">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-white text-slate-600 font-black flex items-center justify-center shrink-0 border border-slate-200 shadow-sm">
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 text-sm">{q.question_text}</p>
                              <p className="text-xs text-slate-500 mt-1 font-medium">
                                รูปแบบ: {q.type === 'rating' ? '⭐ ให้คะแนน 1-5 ดาว' : '📝 พิมพ์ข้อความอิสระ'}
                              </p>
                            </div>
                          </div>
                          
                          <button 
                            onClick={() => handleDeleteQuestion(q.id)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors self-end md:self-auto cursor-pointer"
                            title="ลบคำถาม"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Results Tab */}
            {activeTab === 'results' && (
              <div className="space-y-6">
                
                {/* Stats summary & Export Action Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="bg-white rounded-3xl p-6 shadow-soft-sm border border-slate-100 flex items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
                      <FileSpreadsheet className="w-8 h-8 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-500">จำนวนผู้ตอบแบบประเมิน</p>
                      <h2 className="text-3xl font-black text-slate-800 mt-1">
                        {totalResponses} <span className="text-base font-bold text-slate-400">คน</span>
                      </h2>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-3xl p-6 shadow-soft-sm border border-amber-100 flex items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center shrink-0">
                      <Star className="w-8 h-8 text-amber-500 fill-amber-500" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-500">ความพึงพอใจเฉลี่ย</p>
                      <h2 className="text-3xl font-black text-slate-800 mt-1">
                        {averageRating.toFixed(2)} <span className="text-base font-bold text-slate-400">/ 5.00</span>
                      </h2>
                    </div>
                  </div>
                </div>

                {/* Big Action Bar for Exporting */}
                <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 rounded-3xl p-5 border-2 border-emerald-200 shadow-soft-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                      <FileSpreadsheet className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-800 text-sm">ดาวน์โหลดรายงานผลแบบประเมิน</h3>
                      <p className="text-xs text-slate-600 font-medium">ส่งออกไฟล์ข้อมูลสรุปแบบประเมินรายคนและค่าเฉลี่ยรายข้อ</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      onClick={handleExportExcel}
                      className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs transition-all flex items-center gap-2 shadow-soft-sm cursor-pointer border-b-2 border-emerald-800"
                    >
                      <Download className="w-4 h-4" />
                      ส่งออก Excel (.xlsx)
                    </button>

                    <button
                      onClick={handleExportCSV}
                      className="px-4 py-3 rounded-2xl bg-white hover:bg-slate-50 active:scale-95 text-slate-700 font-bold text-xs transition-all flex items-center gap-2 border border-slate-200 shadow-soft-xs cursor-pointer"
                    >
                      <FileText className="w-4 h-4 text-slate-500" />
                      ส่งออก CSV (.csv)
                    </button>
                  </div>
                </div>

                {/* Responses List */}
                <div className="bg-white rounded-3xl shadow-soft-sm border border-slate-100 p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                      ผลโหวตและข้อเสนอแนะล่าสุด ({filteredResponses.length} รายการ)
                    </h3>

                    {/* Search */}
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
                      <Search className="w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="ค้นหาชื่อนักเรียน..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-transparent border-0 focus:outline-none text-xs font-bold text-slate-700 placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                  
                  {loading ? (
                    <div className="py-10 text-center text-slate-400 font-bold text-sm">กำลังโหลดข้อมูล...</div>
                  ) : filteredResponses.length === 0 ? (
                    <div className="py-10 text-center text-slate-400 font-bold text-sm bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                      {searchQuery ? 'ไม่พบนักเรียนตามคำค้นหา' : 'ยังไม่มีผู้ตอบแบบประเมินในระบบ'}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredResponses.map((r, i) => (
                        <div key={r.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-4 hover:border-blue-200 transition-colors">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-3 gap-2">
                            <span className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
                              <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-black">
                                {filteredResponses.length - i}
                              </span>
                              {r.student_name || 'ไม่ระบุชื่อ'}
                            </span>
                            <span className="text-xs font-bold text-slate-400">
                              {new Date(r.created_at).toLocaleString('th-TH')}
                            </span>
                          </div>
                          
                          <div className="space-y-3">
                            {questions.map((q, qIdx) => {
                              const ans = r.responses ? r.responses[q.id] : undefined;
                              if (ans === undefined) return null;
                              
                              return (
                                <div key={q.id} className="text-xs">
                                  <p className="font-bold text-slate-700 mb-1">
                                    <span className="text-blue-600 mr-1">{qIdx + 1}.</span>
                                    {q.question_text}
                                  </p>
                                  {q.type === 'rating' ? (
                                    <div className="flex items-center gap-1">
                                      {[1, 2, 3, 4, 5].map(star => (
                                        <Star key={star} className={`w-4 h-4 ${star <= Number(ans) ? 'text-amber-500 fill-amber-500' : 'text-slate-200'}`} />
                                      ))}
                                      <span className="ml-1.5 font-extrabold text-slate-600">({ans} ดาว)</span>
                                    </div>
                                  ) : (
                                    <p className="text-slate-600 bg-white p-3 rounded-xl border border-slate-200 font-medium">
                                      {ans || '-'}
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
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
