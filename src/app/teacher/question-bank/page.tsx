'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import TeacherSidebar from '@/components/layout/TeacherSidebar';
import { QuestionItem } from '@/types';
import { useQuestions } from '@/lib/hooks/useSupabaseContent';
import QuestionEditorModal from '@/components/teacher/QuestionEditorModal';
import BulkImportModal from '@/components/teacher/BulkImportModal';
import { FileQuestion, Plus, Trash2, Edit3, Filter, CheckCircle2, Info, Loader2, Wand2, Brain, Puzzle, Crown, Sparkles } from 'lucide-react';
import { Suspense } from 'react';

function QuestionBankContent() {
  const { questions, loading, addQuestion, updateQuestion, deleteQuestion, deleteQuestionsBySet } = useQuestions();
  const [selectedChapter, setSelectedChapter] = useState<number>(0);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('ทั้งหมด');
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedView = searchParams.get('set');
  const [modalQuestion, setModalQuestion] = useState<QuestionItem | null | undefined>(undefined);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const filteredQuestions = questions.filter((q) => {
    const matchChapter = selectedChapter === 0 || q.chapter_number === selectedChapter;
    const matchDiff = selectedDifficulty === 'ทั้งหมด' || q.difficulty === selectedDifficulty;
    const matchTest = selectedView ? q.test_type === selectedView : true;
    return matchChapter && matchDiff && matchTest;
  });

  const handleSaveQuestion = async (newQ: QuestionItem) => {
    const exists = questions.some((q) => q.id === newQ.id);
    if (exists) await updateQuestion(newQ);
    else await addQuestion(newQ);
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm('ลบข้อสอบนี้ใช่ไหม?')) return;
    setDeleting(id);
    await deleteQuestion(id);
    setDeleting(null);
  };

  const testSets = [
    { 
      id: 'pre_knowledge', 
      title: 'ก่อนเรียน (ความรู้)', 
      desc: 'แบบทดสอบวัดระดับความรู้พื้นฐาน',
      icon: <Brain className="w-8 h-8 opacity-90 text-emerald-600 group-hover:scale-110 transition-transform duration-300" />,
      gradient: 'from-emerald-50 to-teal-100',
      shadow: 'hover:shadow-emerald-200/50',
      text: 'text-emerald-950',
      descText: 'text-emerald-800',
      badge: 'bg-emerald-100/80 border-emerald-200 text-emerald-800',
      bgPattern: 'bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.6)_0%,_transparent_60%)]'
    },
    { 
      id: 'pre_skill', 
      title: 'ก่อนเรียน (ทักษะ)', 
      desc: 'แบบทดสอบประเมินทักษะกระบวนการ',
      icon: <Puzzle className="w-8 h-8 opacity-90 text-amber-600 group-hover:scale-110 transition-transform duration-300" />,
      gradient: 'from-amber-50 to-orange-100',
      shadow: 'hover:shadow-orange-200/50',
      text: 'text-orange-950',
      descText: 'text-orange-800',
      badge: 'bg-orange-100/80 border-orange-200 text-orange-800',
      bgPattern: 'bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.6)_0%,_transparent_60%)]'
    },
    { 
      id: 'post_knowledge', 
      title: 'หลังเรียน (ความรู้)', 
      desc: 'แบบทดสอบวัดผลสัมฤทธิ์ความรู้',
      icon: <Crown className="w-8 h-8 opacity-90 text-indigo-600 group-hover:scale-110 transition-transform duration-300" />,
      gradient: 'from-indigo-50 to-blue-100',
      shadow: 'hover:shadow-indigo-200/50',
      text: 'text-indigo-950',
      descText: 'text-indigo-800',
      badge: 'bg-indigo-100/80 border-indigo-200 text-indigo-800',
      bgPattern: 'bg-[radial-gradient(circle_at_bottom_right,_rgba(255,255,255,0.6)_0%,_transparent_60%)]'
    },
    { 
      id: 'post_skill', 
      title: 'หลังเรียน (ทักษะ)', 
      desc: 'แบบทดสอบวัดผลสัมฤทธิ์ทักษะ',
      icon: <Sparkles className="w-8 h-8 opacity-90 text-rose-600 group-hover:scale-110 transition-transform duration-300" />,
      gradient: 'from-rose-50 to-pink-100',
      shadow: 'hover:shadow-pink-200/50',
      text: 'text-pink-950',
      descText: 'text-pink-800',
      badge: 'bg-pink-100/80 border-pink-200 text-pink-800',
      bgPattern: 'bg-[radial-gradient(circle_at_bottom_left,_rgba(255,255,255,0.6)_0%,_transparent_60%)]'
    },
  ];

  return (
    <div className="min-h-[calc(100vh-140px)] bg-[#F8FAFC] font-sans md:flex md:h-[calc(100vh-140px)] md:overflow-hidden rounded-3xl shadow-sm border border-slate-200">
      <TeacherSidebar />
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-soft-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
              <FileQuestion className="w-6 h-6 text-primary" /> คลังข้อสอบตรรกศาสตร์
            </h1>
            <p className="text-xs text-slate-500 mt-1">ข้อสอบทั้งหมดในระบบ {questions.length} ข้อ</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowBulkImport(true)}
              className="px-4 py-2.5 rounded-2xl bg-amber-500 text-white font-bold text-xs hover:bg-amber-600 shadow-soft-sm flex items-center gap-1.5 shrink-0 transition-colors">
              <Wand2 className="w-4 h-4" /> นำเข้าด่วน (Smart Paste)
            </button>
            <button onClick={() => setModalQuestion(null)}
              className="px-4 py-2.5 rounded-2xl bg-primary text-white font-bold text-xs hover:bg-primary-hover shadow-soft-sm flex items-center gap-1.5 shrink-0 transition-colors">
              <Plus className="w-4 h-4" /> เพิ่มข้อสอบใหม่
            </button>
          </div>
        </div>

        {selectedView === null ? (
          // View: 4 Test Sets (Stunning UI)
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {testSets.map(set => {
              const count = questions.filter(q => q.test_type === set.id).length;
              return (
                <div 
                  key={set.id}
                  onClick={() => router.push(`?set=${set.id}`)}
                  className={`group relative overflow-hidden rounded-[2rem] cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] shadow-soft-sm ${set.shadow} bg-gradient-to-br ${set.gradient} border border-white/50`}
                >
                  <div className={`absolute inset-0 ${set.bgPattern}`}></div>
                  
                  {/* Decorative blur blob */}
                  <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/40 blur-2xl rounded-full"></div>

                  <div className={`relative z-10 p-8 h-full flex flex-col items-start ${set.text}`}>
                    <div className="w-14 h-14 rounded-2xl bg-white/60 backdrop-blur-md flex items-center justify-center mb-6 border border-white/80 shadow-sm">
                      {set.icon}
                    </div>
                    
                    <h2 className="text-2xl font-black mb-1 drop-shadow-sm">{set.title}</h2>
                    <p className={`text-sm font-medium mb-6 ${set.descText}`}>{set.desc}</p>
                    
                    <div className={`mt-auto flex items-center gap-2 backdrop-blur-md px-4 py-2 rounded-full border ${set.badge}`}>
                      <FileQuestion className="w-4 h-4" />
                      <span className="text-sm font-bold">มีข้อสอบ {count} ข้อ</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // View: Questions in a Specific Set
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => router.push('/teacher/question-bank')}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs hover:bg-slate-200 transition-colors"
                >
                  ← ย้อนกลับ
                </button>
                <h2 className="text-lg font-bold text-slate-800">
                  ชุดข้อสอบ: {testSets.find(s => s.id === selectedView)?.title}
                </h2>
              </div>
              <button
                onClick={async () => {
                  if (confirm(`คุณต้องการลบข้อสอบทั้งหมดในชุดนี้ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้`)) {
                    await deleteQuestionsBySet(selectedView!);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-rose-50 text-rose-600 font-bold text-xs hover:bg-rose-100 border border-rose-200 transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" /> ลบทั้งชุด
              </button>
            </div>
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 flex items-start gap-3 text-xs text-blue-900">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
              <p className="font-medium">คุณกำลังดูเฉพาะข้อสอบในชุด "{testSets.find(s => s.id === selectedView)?.title}"</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-soft-sm flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                <select value={selectedChapter} onChange={(e) => setSelectedChapter(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 min-w-[150px]">
                  <option value={0}>ทุกบทเรียน</option>
                  <option value={1}>บทที่ 1 (เนื้อหาทั้งหมด)</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-bold whitespace-nowrap">ระดับ:</span>
                <select value={selectedDifficulty} onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 min-w-[120px]">
                  <option value="ทั้งหมด">ทั้งหมด</option>
                  <option value="easy">ง่าย</option>
                  <option value="medium">ปานกลาง</option>
                  <option value="hard">ยาก</option>
                </select>
              </div>
            </div>

            {loading && (
              <div className="flex items-center justify-center py-16 gap-3 text-xs text-slate-400 font-bold">
                <Loader2 className="w-5 h-5 animate-spin text-primary" /> กำลังโหลดข้อมูล...
              </div>
            )}

            {!loading && filteredQuestions.length === 0 && (
              <div className="p-12 rounded-3xl border-2 border-dashed border-slate-200 text-center space-y-3">
                <div className="w-14 h-14 rounded-3xl bg-primary-light mx-auto flex items-center justify-center">
                  <FileQuestion className="w-7 h-7 text-primary" />
                </div>
                <p className="font-extrabold text-slate-700">ยังไม่มีข้อสอบในชุดนี้</p>
                <button onClick={() => setModalQuestion(null)}
                  className="px-5 py-2.5 rounded-2xl bg-primary text-white font-bold text-xs hover:bg-primary-hover shadow-soft-sm">
                  + เพิ่มข้อสอบใหม่
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredQuestions.map((q, idx) => (
                <div key={q.id} className="p-5 rounded-3xl bg-white border border-slate-100 shadow-soft-sm flex flex-col h-full hover:shadow-soft-md transition-shadow">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex flex-wrap gap-1.5 items-center">
                      <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-lg">#{idx + 1}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        q.difficulty === 'easy' ? 'bg-emerald-100 text-emerald-700' :
                        q.difficulty === 'medium' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-700'}`}>
                        {q.difficulty}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => setModalQuestion(q)} className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-slate-50 transition-colors">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteQuestion(q.id)} disabled={deleting === q.id}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors disabled:opacity-50">
                        {deleting === q.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <p className="font-bold text-xs text-slate-800 leading-relaxed mb-4 flex-1">{q.question_text}</p>
                  <div className="space-y-1.5 mt-auto">
                    {q.options.map((opt, optIdx) => (
                      <div key={optIdx} className={`p-2.5 rounded-xl border text-[11px] font-medium flex items-center justify-between transition-colors ${
                        optIdx === q.correct_option_index ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
                        <span className="line-clamp-2">{String.fromCharCode(65 + optIdx)}. {opt}</span>
                        {optIdx === q.correct_option_index && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 ml-2" />}
                      </div>
                    ))}
                  </div>
                  {q.explanation && <p className="text-[10px] text-slate-500 pt-3 mt-3 border-t border-slate-100 italic">💡 {q.explanation}</p>}
                </div>
              ))}
            </div>
          </>
        )}

        {modalQuestion !== undefined && (
          <QuestionEditorModal question={modalQuestion} onClose={() => setModalQuestion(undefined)} onSave={handleSaveQuestion} />
        )}

        {showBulkImport && (
          <BulkImportModal
            onClose={() => setShowBulkImport(false)}
            onSave={async (qs) => {
              for (const q of qs) {
                await addQuestion(q);
              }
            }}
          />
        )}
      </div>
    </div>
  );
}

export default function QuestionBankPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <QuestionBankContent />
    </Suspense>
  );
}
