'use client';

import { useState, useEffect } from 'react';
import TeacherSidebar from '@/components/layout/TeacherSidebar';
import { 
  Star, Plus, Trash2, Save, FileSpreadsheet, Download, RefreshCw, 
  Search, FileText, CheckCircle2, Sparkles, Layers, ShieldCheck
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import * as XLSX from 'xlsx';
import { INITIAL_SURVEY_CONFIG, SurveyConfig, SurveyDimension, SurveyQuestionItem } from '@/lib/constants/surveyData';

type SurveyResponse = {
  id: string;
  user_id: string;
  student_name: string;
  responses: Record<string, string | number>;
  created_at: string;
};

export default function TeacherSurveyPage() {
  const [activeTab, setActiveTab] = useState<'questions' | 'results'>('questions');
  
  // Configuration State
  const [config, setConfig] = useState<SurveyConfig>(INITIAL_SURVEY_CONFIG);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Results State
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Load config from Supabase / localStorage
  async function loadConfig() {
    try {
      const { data } = await supabase
        .from('survey_questions')
        .select('*')
        .eq('id', 'survey_global_config')
        .maybeSingle();

      if (data?.question_text) {
        const parsed = JSON.parse(data.question_text);
        if (parsed.dimensions && parsed.dimensions.length > 0) {
          setConfig(parsed);
          return;
        }
      }
    } catch (e) {
      // fallback to localStorage
    }

    const saved = localStorage.getItem('survey_global_config');
    if (saved) {
      try {
        setConfig(JSON.parse(saved));
      } catch (e) {}
    }
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
      await Promise.all([loadConfig(), fetchResponses()]);
      setLoading(false);
    }
    init();

    const interval = setInterval(() => {
      fetchResponses();
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // Save survey configuration to Supabase & localStorage
  const handleSaveConfig = async () => {
    setIsSaving(true);
    try {
      const configStr = JSON.stringify(config);
      localStorage.setItem('survey_global_config', configStr);

      // Upsert into survey_questions as global config row
      await supabase.from('survey_questions').upsert({
        id: 'survey_global_config',
        question_text: configStr,
        type: 'rating',
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err: any) {
      alert('บันทึกข้อมูลเรียบร้อยในเครื่อง (Local Storage)');
    } finally {
      setIsSaving(false);
    }
  };

  // Add question to a specific dimension
  const handleAddQuestion = (dimensionId: number) => {
    const qText = prompt('กรุณาพิมพ์ข้อความคำถามใหม่:');
    if (!qText || !qText.trim()) return;

    setConfig((prev) => ({
      ...prev,
      dimensions: prev.dimensions.map((dim) => {
        if (dim.id === dimensionId) {
          const nextIndex = dim.questions.length + 1;
          const newQ: SurveyQuestionItem = {
            id: `q${dim.id}_${Date.now()}`,
            text: `${dim.id}.${nextIndex} ${qText.trim()}`,
            type: 'rating',
          };
          return { ...dim, questions: [...dim.questions, newQ] };
        }
        return dim;
      }),
    }));
  };

  // Edit question text
  const handleEditQuestion = (dimensionId: number, qId: string, newText: string) => {
    setConfig((prev) => ({
      ...prev,
      dimensions: prev.dimensions.map((dim) => {
        if (dim.id === dimensionId) {
          return {
            ...dim,
            questions: dim.questions.map((q) => (q.id === qId ? { ...q, text: newText } : q)),
          };
        }
        return dim;
      }),
    }));
  };

  // Delete question
  const handleDeleteQuestion = (dimensionId: number, qId: string) => {
    if (!confirm('ยืนยันการลบข้อคำถามนี้?')) return;
    setConfig((prev) => ({
      ...prev,
      dimensions: prev.dimensions.map((dim) => {
        if (dim.id === dimensionId) {
          return {
            ...dim,
            questions: dim.questions.filter((q) => q.id !== qId),
          };
        }
        return dim;
      }),
    }));
  };

  // Flatten all questions for stats & reporting
  const allFlattenedQuestions: SurveyQuestionItem[] = config.dimensions.flatMap((d) => d.questions);

  // Calculate stats
  const totalResponses = responses.length;
  let averageRating = 0;
  
  if (totalResponses > 0 && allFlattenedQuestions.length > 0) {
    let totalScore = 0;
    let count = 0;
    responses.forEach((r) => {
      allFlattenedQuestions.forEach((q) => {
        if (r.responses && r.responses[q.id] !== undefined) {
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

  // Calculate dimension-specific average
  const getDimensionAverage = (dim: SurveyDimension) => {
    if (responses.length === 0 || dim.questions.length === 0) return 0;
    let sum = 0;
    let count = 0;
    responses.forEach((r) => {
      dim.questions.forEach((q) => {
        if (r.responses && r.responses[q.id] !== undefined) {
          const val = Number(r.responses[q.id]);
          if (!isNaN(val) && val >= 1 && val <= 5) {
            sum += val;
            count++;
          }
        }
      });
    });
    return count > 0 ? sum / count : 0;
  };

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

      config.dimensions.forEach((dim) => {
        dim.questions.forEach((q) => {
          const key = `[ด้านที่ ${dim.id}] ${q.text}`;
          const val = r.responses ? r.responses[q.id] : undefined;
          row[key] = val !== undefined ? val : '-';

          if (val !== undefined) {
            const n = Number(val);
            if (!isNaN(n) && n >= 1 && n <= 5) {
              sumRating += n;
              countRating++;
            }
          }
        });
      });

      const textFeedback = r.responses ? r.responses['feedback_text'] : undefined;
      row['ข้อเสนอแนะเพิ่มเติม'] = textFeedback || '-';
      row['คะแนนเฉลี่ยรวม (5 ดาว)'] = countRating > 0 ? (sumRating / countRating).toFixed(2) : '-';
      return row;
    });

    // 2. Summary Sheet
    const summaryRows: any[] = [];
    config.dimensions.forEach((dim) => {
      const dimAvg = getDimensionAverage(dim);
      summaryRows.push({
        'หมวด / ด้าน': `ด้านที่ ${dim.id}: ${dim.title}`,
        'ข้อที่': '-',
        'คำถาม': `(ค่าเฉลี่ยประจำด้านที่ ${dim.id})`,
        'คะแนนเฉลี่ย (เต็ม 5)': dimAvg.toFixed(2),
        'ระดับความพึงพอใจ': dimAvg >= 4.5 ? 'มากที่สุด' : dimAvg >= 3.5 ? 'มาก' : dimAvg >= 2.5 ? 'ปานกลาง' : 'น้อย',
      });

      dim.questions.forEach((q, idx) => {
        let qSum = 0;
        let qCount = 0;
        responses.forEach((r) => {
          if (r.responses && r.responses[q.id] !== undefined) {
            const v = Number(r.responses[q.id]);
            if (!isNaN(v) && v >= 1 && v <= 5) {
              qSum += v;
              qCount++;
            }
          }
        });
        const avg = qCount > 0 ? qSum / qCount : 0;
        summaryRows.push({
          'หมวด / ด้าน': `ด้านที่ ${dim.id}`,
          'ข้อที่': idx + 1,
          'คำถาม': q.text,
          'คะแนนเฉลี่ย (เต็ม 5)': avg.toFixed(2),
          'ระดับความพึงพอใจ': avg >= 4.5 ? 'มากที่สุด' : avg >= 3.5 ? 'มาก' : avg >= 2.5 ? 'ปานกลาง' : 'น้อย',
        });
      });
    });

    summaryRows.push({
      'หมวด / ด้าน': 'สรุปรวมทั้งหมด',
      'ข้อที่': '-',
      'คำถาม': '=== คะแนนเฉลี่ยรวมทุกด้าน ===',
      'คะแนนเฉลี่ย (เต็ม 5)': averageRating.toFixed(2),
      'ระดับความพึงพอใจ': averageRating >= 4.5 ? 'มากที่สุด' : averageRating >= 3.5 ? 'มาก' : 'ปานกลาง',
    });

    const wb = XLSX.utils.book_new();
    const wsData = XLSX.utils.json_to_sheet(dataRows);
    const wsSummary = XLSX.utils.json_to_sheet(summaryRows);

    XLSX.utils.book_append_sheet(wb, wsData, 'ผลประเมินรายคน');
    XLSX.utils.book_append_sheet(wb, wsSummary, 'สรุปค่าเฉลี่ย 5 ด้าน');

    const fileName = `รายงานแบบประเมินความพึงพอใจ_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (responses.length === 0) {
      alert('ยังไม่มีข้อมูลการตอบแบบประเมินในระบบ');
      return;
    }

    const headers = [
      'ลำดับ',
      'ชื่อ-นามสกุล',
      'วันเวลาที่ส่ง',
      ...allFlattenedQuestions.map((q) => `"${q.text.replace(/"/g, '""')}"`),
      '"ข้อเสนอแนะเพิ่มเติม"',
    ];

    const rows = responses.map((r, i) => {
      const qAnswers = allFlattenedQuestions.map((q) => {
        const val = r.responses ? r.responses[q.id] : '';
        return `"${String(val !== undefined ? val : '-').replace(/"/g, '""')}"`;
      });
      const feedback = r.responses ? r.responses['feedback_text'] : '';

      return [
        i + 1,
        `"${(r.student_name || 'ไม่ระบุชื่อ').replace(/"/g, '""')}"`,
        `"${new Date(r.created_at).toLocaleString('th-TH')}"`,
        ...qAnswers,
        `"${String(feedback || '-').replace(/"/g, '""')}"`,
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

  const filteredResponses = responses.filter((r) => 
    !searchQuery.trim() || (r.student_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen md:flex md:h-screen bg-[#F8FAFC] md:overflow-hidden font-sans">
      <TeacherSidebar />

      <div className="flex-1 flex flex-col md:h-full overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-5xl mx-auto space-y-6 pb-20">
            
            {/* Header with Title and Role Pill */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
                  ประเมินความพึงพอใจ
                </h1>
                <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 font-bold text-xs border border-blue-200">
                  สถานะ: ผู้สอน
                </span>
              </div>

              {/* Top Action Tabs */}
              <div className="flex items-center gap-2">
                <div className="bg-slate-100 p-1 rounded-2xl flex gap-1">
                  <button 
                    onClick={() => setActiveTab('questions')}
                    className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'questions' 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-slate-600 hover:bg-slate-200/60'
                    }`}
                  >
                    จัดการคำถาม 5 ด้าน
                  </button>
                  <button 
                    onClick={() => setActiveTab('results')}
                    className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'results' 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-slate-600 hover:bg-slate-200/60'
                    }`}
                  >
                    ผลการประเมิน ({responses.length})
                  </button>
                </div>

                <button
                  onClick={() => fetchResponses(true)}
                  disabled={refreshing}
                  className="p-2.5 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 transition-all shadow-soft-xs cursor-pointer active:scale-95"
                  title="รีเฟรชข้อมูล"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Questions Tab (Design matches screenshot) */}
            {activeTab === 'questions' && (
              <div className="space-y-6">
                
                {/* 1. Header and Description Card */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 space-y-5">
                  <h2 className="text-base font-black text-slate-800">หัวข้อและคำชี้แจงแบบประเมิน</h2>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600">ชื่อแบบประเมิน (Title)</label>
                    <input 
                      type="text" 
                      value={config.title}
                      onChange={(e) => setConfig({ ...config, title: e.target.value })}
                      placeholder="ระบุชื่อแบบประเมิน..."
                      className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl px-4 py-3.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600">คำชี้แจงสำหรับผู้เรียน (Description)</label>
                    <textarea 
                      rows={3}
                      value={config.description}
                      onChange={(e) => setConfig({ ...config, description: e.target.value })}
                      placeholder="ระบุคำชี้แจงสำหรับผู้เรียน..."
                      className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl p-4 text-xs font-medium text-slate-700 leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                    />
                  </div>
                </div>

                {/* 2. Five Dimension Cards */}
                {config.dimensions.map((dim) => (
                  <div key={dim.id} className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 space-y-4">
                    <div className="flex items-start justify-between gap-4 border-b border-slate-50 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-2xl bg-blue-100 text-blue-700 font-black text-sm flex items-center justify-center shrink-0">
                          {dim.id}
                        </div>
                        <div>
                          <h3 className="font-extrabold text-slate-800 text-base">{dim.title}</h3>
                          <p className="text-xs text-slate-400 font-medium">{dim.subtitle || 'คำอธิบายย่อย...'}</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAddQuestion(dim.id)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" /> เพิ่มข้อคำถาม
                      </button>
                    </div>

                    {/* Question Items */}
                    <div className="space-y-2.5 pt-1">
                      {dim.questions.map((q, idx) => (
                        <div 
                          key={q.id}
                          className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-[#F8FAFC] border border-slate-100 hover:border-blue-200 transition-all gap-3 group"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 text-xs font-black flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <input
                              type="text"
                              value={q.text}
                              onChange={(e) => handleEditQuestion(dim.id, q.id, e.target.value)}
                              className="w-full bg-transparent border-none text-xs sm:text-sm font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-400 rounded-lg px-1 py-0.5"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteQuestion(dim.id, q.id)}
                            className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="ลบคำถาม"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Floating / Bottom Save Bar */}
                <div className="sticky bottom-6 z-20 bg-white/95 backdrop-blur-md rounded-2xl p-4 border border-slate-200 shadow-soft-lg flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                    {saveSuccess ? (
                      <span className="text-emerald-600 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" /> บันทึกการเปลี่ยนแปลงเรียบร้อยแล้ว!
                      </span>
                    ) : (
                      <span>ตรวจสอบและกดบันทึกเพื่ออัปเดตแบบประเมินให้นักเรียนทุกคน</span>
                    )}
                  </div>

                  <button
                    onClick={handleSaveConfig}
                    disabled={isSaving}
                    className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs shadow-soft-sm transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    {isSaving ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
                  </button>
                </div>

              </div>
            )}

            {/* Results Tab */}
            {activeTab === 'results' && (
              <div className="space-y-6">
                
                {/* Stats summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
                      <FileSpreadsheet className="w-7 h-7 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500">จำนวนผู้ตอบแบบประเมินทั้งหมด</p>
                      <h2 className="text-3xl font-black text-slate-800 mt-1">
                        {totalResponses} <span className="text-sm font-bold text-slate-400">คน</span>
                      </h2>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-3xl p-6 shadow-sm border border-amber-100 flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center shrink-0">
                      <Star className="w-7 h-7 text-amber-500 fill-amber-500" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500">ความพึงพอใจเฉลี่ยรวมทุกด้าน</p>
                      <h2 className="text-3xl font-black text-slate-800 mt-1">
                        {averageRating.toFixed(2)} <span className="text-sm font-bold text-slate-400">/ 5.00</span>
                      </h2>
                    </div>
                  </div>
                </div>

                {/* Dimension Breakdown Cards */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
                  <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-600" /> สรุปผลคะแนนเฉลี่ยแยกตาม 5 ด้าน
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {config.dimensions.map((dim) => {
                      const avg = getDimensionAverage(dim);
                      return (
                        <div key={dim.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-blue-700 bg-blue-100 px-2 py-0.5 rounded-lg">
                              ด้านที่ {dim.id}
                            </span>
                            <span className="text-xs font-mono font-black text-slate-700">
                              {avg.toFixed(2)} / 5.00
                            </span>
                          </div>
                          <p className="text-xs font-bold text-slate-800 line-clamp-1">{dim.title}</p>
                          <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className="bg-blue-600 h-full rounded-full transition-all"
                              style={{ width: `${(avg / 5) * 100}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Export Buttons */}
                <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 rounded-3xl p-5 border border-emerald-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-800 text-xs sm:text-sm">ดาวน์โหลดรายงานผลแบบประเมิน</h3>
                      <p className="text-[11px] text-slate-600 font-medium">ส่งออกไฟล์ข้อมูลสรุปแบบประเมินรายคนและค่าเฉลี่ย 5 ด้าน</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={handleExportExcel}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs transition-all flex items-center gap-2 shadow-sm cursor-pointer"
                    >
                      <Download className="w-4 h-4" /> ส่งออก Excel (.xlsx)
                    </button>
                    <button
                      onClick={handleExportCSV}
                      className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 active:scale-95 text-slate-700 font-bold text-xs transition-all flex items-center gap-2 border border-slate-200 cursor-pointer"
                    >
                      <FileText className="w-4 h-4 text-slate-500" /> ส่งออก CSV (.csv)
                    </button>
                  </div>
                </div>

                {/* Submissions List */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <h3 className="font-black text-slate-800 text-sm">
                      รายการผู้ตอบแบบประเมิน ({filteredResponses.length} รายการ)
                    </h3>

                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
                      <Search className="w-3.5 h-3.5 text-slate-400" />
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
                    <div className="py-10 text-center text-slate-400 font-bold text-xs">กำลังโหลดข้อมูล...</div>
                  ) : filteredResponses.length === 0 ? (
                    <div className="py-10 text-center text-slate-400 font-bold text-xs bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                      {searchQuery ? 'ไม่พบนักเรียนตามคำค้นหา' : 'ยังไม่มีผู้ตอบแบบประเมินในระบบ'}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredResponses.map((r, i) => (
                        <div key={r.id} className="p-4 rounded-2xl border border-slate-100 bg-[#F8FAFC] space-y-3">
                          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                            <span className="font-extrabold text-xs text-slate-800 flex items-center gap-2">
                              <span className="w-5 h-5 rounded-md bg-blue-100 text-blue-700 text-[10px] flex items-center justify-center font-black">
                                {filteredResponses.length - i}
                              </span>
                              {r.student_name || 'ไม่ระบุชื่อ'}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">
                              {new Date(r.created_at).toLocaleString('th-TH')}
                            </span>
                          </div>
                          
                          {/* Student's feedback text if any */}
                          {r.responses && r.responses['feedback_text'] && (
                            <div className="text-xs bg-white p-3 rounded-xl border border-slate-200 text-slate-700">
                              <span className="font-bold text-blue-600">ข้อเสนอแนะ:</span> {String(r.responses['feedback_text'])}
                            </div>
                          )}
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
