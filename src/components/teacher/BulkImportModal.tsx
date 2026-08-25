'use client';

import { useState } from 'react';
import { QuestionItem } from '@/types';
import { X, Save, Sparkles, Wand2, CheckCircle2 } from 'lucide-react';

interface BulkImportModalProps {
  onClose: () => void;
  onSave: (questions: QuestionItem[]) => void;
}

export default function BulkImportModal({ onClose, onSave }: BulkImportModalProps) {
  const [rawText, setRawText] = useState('');
  const [parsedQuestions, setParsedQuestions] = useState<QuestionItem[]>([]);
  const [isParsed, setIsParsed] = useState(false);
  
  // Default values for batch import
  const [defaultChapter, setDefaultChapter] = useState<number>(1);
  const [defaultTestType, setDefaultTestType] = useState<'pre_knowledge' | 'pre_skill' | 'post_knowledge' | 'post_skill'>('pre_knowledge');
  const [defaultDifficulty, setDefaultDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  const parseText = () => {
    const lines = rawText.split('\n').map(l => l.trim()).filter(l => l !== '');
    
    const questions: QuestionItem[] = [];
    let currentQuestion: Partial<QuestionItem> | null = null;
    let currentOptions: string[] = [];

    const isQuestionStart = (line: string) => /^\d+[\.\)]\s+/.test(line);
    const isOptionKo = (line: string) => /^[ก]\.\s+/.test(line);
    const isOptionKho = (line: string) => /^[ข]\.\s+/.test(line);
    const isOptionKhoKwai = (line: string) => /^[ค]\.\s+/.test(line);
    const isOptionNgo = (line: string) => /^[ง]\.\s+/.test(line);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (isQuestionStart(line)) {
        // Save previous question if exists
        if (currentQuestion && currentOptions.length > 0) {
          // Fill missing options if any
          while (currentOptions.length < 4) currentOptions.push('-');
          currentQuestion.options = currentOptions;
          questions.push(currentQuestion as QuestionItem);
        }

        // Start new question
        const qText = line.replace(/^\d+[\.\)]\s+/, '').trim();
        currentQuestion = {
          id: `q-${Date.now()}-${i}`,
          question_text: qText,
          correct_option_index: 0, // default
          chapter_number: defaultChapter,
          test_type: defaultTestType,
          difficulty: defaultDifficulty,
          explanation: '',
        };
        currentOptions = [];
      } 
      else if (isOptionKo(line)) {
        currentOptions[0] = line.replace(/^[ก]\.\s+/, '').trim();
      }
      else if (isOptionKho(line)) {
        currentOptions[1] = line.replace(/^[ข]\.\s+/, '').trim();
      }
      else if (isOptionKhoKwai(line)) {
        currentOptions[2] = line.replace(/^[ค]\.\s+/, '').trim();
      }
      else if (isOptionNgo(line)) {
        currentOptions[3] = line.replace(/^[ง]\.\s+/, '').trim();
      }
      else {
        // If it's none of the above, it might be a continuation of the previous line
        // or a malformed line. We'll append it to the question text if we haven't seen options yet.
        if (currentQuestion && currentOptions.length === 0) {
          currentQuestion.question_text += ' ' + line;
        } else if (currentOptions.length > 0) {
          currentOptions[currentOptions.length - 1] += ' ' + line;
        }
      }
    }

    // Save the last question
    if (currentQuestion && currentOptions.length > 0) {
      while (currentOptions.length < 4) currentOptions.push('-');
      currentQuestion.options = currentOptions;
      questions.push(currentQuestion as QuestionItem);
    }

    setParsedQuestions(questions);
    setIsParsed(true);
  };

  const handleUpdateParsed = (idx: number, field: keyof QuestionItem, value: any) => {
    const updated = [...parsedQuestions];
    updated[idx] = { ...updated[idx], [field]: value };
    setParsedQuestions(updated);
  };

  const handleSave = () => {
    onSave(parsedQuestions);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-soft-lg max-w-4xl w-full h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-100 shrink-0 bg-slate-50">
          <h3 className="font-bold text-sm sm:text-base text-slate-800 flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-primary" />
            นำเข้าข้อสอบด่วน (Smart Paste)
          </h3>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:bg-slate-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50">
          {!isParsed ? (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl text-xs text-blue-800">
                <p className="font-bold mb-1">💡 รูปแบบที่รองรับ (ก๊อปปี้จาก Word แปะได้เลย)</p>
                <p>1. ข้อความคำถาม<br/>ก. ตัวเลือกที่ 1<br/>ข. ตัวเลือกที่ 2<br/>ค. ตัวเลือกที่ 3<br/>ง. ตัวเลือกที่ 4</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 mb-1 block">นำเข้าเป็นข้อสอบชุด</label>
                  <select value={defaultTestType} onChange={(e) => setDefaultTestType(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-primary/30">
                    <option value="pre_knowledge">ก่อนเรียน (ความรู้)</option>
                    <option value="pre_skill">ก่อนเรียน (ทักษะ)</option>
                    <option value="post_knowledge">หลังเรียน (ความรู้)</option>
                    <option value="post_skill">หลังเรียน (ทักษะ)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 mb-1 block">สำหรับบทเรียนที่</label>
                  <select value={defaultChapter} onChange={(e) => setDefaultChapter(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-primary/30">
                    <option value={1}>บทที่ 1 (เนื้อหาทั้งหมด)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 mb-1 block">ระดับความยากเริ่มต้น</label>
                  <select value={defaultDifficulty} onChange={(e) => setDefaultDifficulty(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-primary/30">
                    <option value="easy">ง่าย</option>
                    <option value="medium">ปานกลาง</option>
                    <option value="hard">ยาก</option>
                  </select>
                </div>
              </div>

              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="วางข้อสอบที่นี่..."
                className="w-full h-80 p-4 rounded-2xl border-2 border-slate-200 bg-white text-xs focus:border-primary focus:outline-none resize-none font-mono"
              ></textarea>
              
              <button
                onClick={parseText}
                disabled={!rawText.trim()}
                className="w-full btn-3d-primary py-3.5 rounded-2xl text-white font-black text-xs shadow-soft-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" /> วิเคราะห์ข้อสอบอัตโนมัติ
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-green-50 text-green-700 p-4 rounded-2xl border border-green-200">
                <div className="flex items-center gap-2 text-sm font-bold">
                  <CheckCircle2 className="w-5 h-5" /> ตรวจพบข้อสอบทั้งหมด {parsedQuestions.length} ข้อ
                </div>
                <button onClick={() => setIsParsed(false)} className="text-xs font-bold underline hover:text-green-800">
                  แก้ไขข้อความต้นฉบับ
                </button>
              </div>

              <div className="space-y-4 pb-10">
                {parsedQuestions.map((q, idx) => (
                  <div key={idx} className="bg-white p-5 rounded-2xl border-2 border-slate-100 shadow-sm space-y-3">
                    <p className="font-bold text-slate-800 text-sm">
                      <span className="text-primary mr-1">{idx + 1}.</span> {q.question_text}
                    </p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                      {q.options.map((opt, optIdx) => (
                        <div 
                          key={optIdx} 
                          onClick={() => handleUpdateParsed(idx, 'correct_option_index', optIdx)}
                          className={`p-3 rounded-xl border-2 cursor-pointer transition-all text-xs flex items-center gap-2 ${
                            q.correct_option_index === optIdx 
                              ? 'border-green-500 bg-green-50 text-green-900 font-bold' 
                              : 'border-slate-100 bg-slate-50 hover:border-slate-300'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                            q.correct_option_index === optIdx ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-500'
                          }`}>
                            {['ก', 'ข', 'ค', 'ง'][optIdx]}
                          </div>
                          <span className="line-clamp-2 leading-relaxed">{opt}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {isParsed && (
          <div className="p-4 border-t border-slate-100 shrink-0 bg-white">
            <button
              onClick={handleSave}
              className="w-full btn-3d-primary py-4 rounded-2xl text-white font-black text-sm shadow-soft-sm flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" /> บันทึกเข้าคลังข้อสอบทั้งหมด ({parsedQuestions.length} ข้อ)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
