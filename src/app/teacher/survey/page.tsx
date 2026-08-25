'use client';

import { useState, useEffect } from 'react';
import TeacherSidebar from '@/components/layout/TeacherSidebar';
import { Star, Plus, Trash2, Save, FileSpreadsheet, Edit2, Check, X } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

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
  const [activeTab, setActiveTab] = useState<'questions' | 'results'>('questions');
  
  // Questions State
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newQuestionType, setNewQuestionType] = useState<'rating'|'text'>('rating');
  const [isAdding, setIsAdding] = useState(false);

  // Results State
  const [responses, setResponses] = useState<SurveyResponse[]>([]);

  useEffect(() => {
    fetchQuestions();
    fetchResponses();
  }, []);

  async function fetchQuestions() {
    setLoading(true);
    const { data, error } = await supabase.from('survey_questions').select('*').order('created_at', { ascending: true });
    if (data) setQuestions(data);
    setLoading(false);
  }

  async function fetchResponses() {
    const { data, error } = await supabase.from('survey_responses').select('*').order('created_at', { ascending: false });
    if (data) setResponses(data);
  }

  async function handleAddQuestion() {
    if (!newQuestionText.trim()) return;
    setIsAdding(true);
    
    const newQ = { question_text: newQuestionText, type: newQuestionType };
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
        if (q.type === 'rating' && r.responses[q.id]) {
          totalScore += Number(r.responses[q.id]);
          count++;
        }
      });
    });
    if (count > 0) averageRating = totalScore / count;
  }

  return (
    <div className="min-h-screen md:flex md:h-screen bg-[#F8FAFC] md:overflow-hidden font-sans">
      <TeacherSidebar />

      <div className="flex-1 flex flex-col md:h-full overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-5xl mx-auto space-y-6">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-[#4285F4] to-blue-500 rounded-3xl p-8 text-white shadow-soft-sm relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="relative z-10">
                <h1 className="text-3xl font-black mb-2 flex items-center gap-2">
                  <Star className="w-8 h-8 text-amber-300 fill-amber-300" /> ระบบแบบประเมิน
                </h1>
                <p className="text-blue-100 font-medium text-sm">
                  จัดการคำถามแบบประเมินและดูผลลัพธ์ความพึงพอใจของนักเรียน
                </p>
              </div>
              
              <div className="flex gap-2 relative z-10 bg-white/10 p-1.5 rounded-2xl backdrop-blur-md">
                <button 
                  onClick={() => setActiveTab('questions')}
                  className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'questions' ? 'bg-white text-blue-600 shadow-sm' : 'text-white hover:bg-white/20'}`}
                >
                  จัดการคำถาม
                </button>
                <button 
                  onClick={() => setActiveTab('results')}
                  className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'results' ? 'bg-white text-blue-600 shadow-sm' : 'text-white hover:bg-white/20'}`}
                >
                  ผลการประเมิน
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
                      <option value="rating">ให้คะแนน (1-5 ดาว)</option>
                      <option value="text">พิมพ์ข้อความ (ข้อเสนอแนะ)</option>
                    </select>
                    <button 
                      onClick={handleAddQuestion}
                      disabled={isAdding || !newQuestionText.trim()}
                      className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
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
                                รูปแบบ: {q.type === 'rating' ? '⭐ ให้คะแนน 1-5' : '📝 พิมพ์ข้อความ'}
                              </p>
                            </div>
                          </div>
                          
                          <button 
                            onClick={() => handleDeleteQuestion(q.id)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors self-end md:self-auto"
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
                
                {/* Stats summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-3xl p-6 shadow-soft-sm border border-slate-100 flex items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center">
                      <FileSpreadsheet className="w-8 h-8 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-500">จำนวนผู้ตอบแบบประเมิน</p>
                      <h2 className="text-3xl font-black text-slate-800 mt-1">{totalResponses} <span className="text-base font-bold text-slate-400">คน</span></h2>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-3xl p-6 shadow-soft-sm border border-amber-100 flex items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center">
                      <Star className="w-8 h-8 text-amber-500 fill-amber-500" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-500">ความพึงพอใจเฉลี่ย</p>
                      <h2 className="text-3xl font-black text-slate-800 mt-1">{averageRating.toFixed(2)} <span className="text-base font-bold text-slate-400">/ 5.00</span></h2>
                    </div>
                  </div>
                </div>

                {/* Responses List */}
                <div className="bg-white rounded-3xl shadow-soft-sm border border-slate-100 p-6">
                  <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                    ผลโหวตและข้อเสนอแนะล่าสุด
                  </h3>
                  
                  {responses.length === 0 ? (
                    <div className="py-10 text-center text-slate-400 font-bold text-sm bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                      ยังไม่มีผู้ตอบแบบประเมิน
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {responses.map((r, i) => (
                        <div key={r.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-4">
                          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                            <span className="font-bold text-sm text-slate-800">
                              คนที่ {responses.length - i} : {r.student_name || 'ไม่ระบุชื่อ'}
                            </span>
                            <span className="text-xs font-bold text-slate-400">
                              {new Date(r.created_at).toLocaleString('th-TH')}
                            </span>
                          </div>
                          
                          <div className="space-y-3">
                            {questions.map(q => {
                              const ans = r.responses[q.id];
                              if (ans === undefined) return null;
                              
                              return (
                                <div key={q.id} className="text-sm">
                                  <p className="font-bold text-slate-700 mb-1">{q.question_text}</p>
                                  {q.type === 'rating' ? (
                                    <div className="flex items-center gap-1">
                                      {[1,2,3,4,5].map(star => (
                                        <Star key={star} className={`w-4 h-4 ${star <= Number(ans) ? 'text-amber-500 fill-amber-500' : 'text-slate-200'}`} />
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-slate-600 bg-white p-3 rounded-xl border border-slate-200">
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
