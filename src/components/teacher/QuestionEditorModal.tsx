'use client';

import { useState } from 'react';
import { QuestionItem } from '@/types';
import { X, Plus, Save, Sparkles } from 'lucide-react';

interface QuestionEditorModalProps {
  question?: QuestionItem | null;
  onClose: () => void;
  onSave: (q: QuestionItem) => void;
}

export default function QuestionEditorModal({ question, onClose, onSave }: QuestionEditorModalProps) {
  const [chapterNumber, setChapterNumber] = useState<number>(question?.chapter_number || 1);
  const [questionText, setQuestionText] = useState<string>(question?.question_text || '');
  const [options, setOptions] = useState<string[]>(
    question?.options || ['ตัวเลือก 1', 'ตัวเลือก 2', 'ตัวเลือก 3', 'ตัวเลือก 4']
  );
  const [correctIndex, setCorrectIndex] = useState<number>(question?.correct_option_index || 0);
  const [explanation, setExplanation] = useState<string>(question?.explanation || '');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>(question?.difficulty || 'medium');
  const [testType, setTestType] = useState<'pre_knowledge' | 'pre_skill' | 'post_knowledge' | 'post_skill'>(
    question?.test_type || 'pre_knowledge'
  );

  const handleOptionChange = (idx: number, val: string) => {
    const updated = [...options];
    updated[idx] = val;
    setOptions(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) return;

    const newQuestion: QuestionItem = {
      id: question?.id || `q-${Date.now()}`,
      chapter_number: chapterNumber,
      question_text: questionText,
      options,
      correct_option_index: correctIndex,
      explanation,
      difficulty,
      test_type: testType,
    };

    onSave(newQuestion);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-soft-lg max-w-xl w-full p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            {question ? 'แก้ไขข้อสอบตรรกศาสตร์' : 'เพิ่มข้อสอบใหม่ในคลัง'}
          </h3>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">ชุดข้อสอบ</label>
              <select
                value={testType}
                onChange={(e) => setTestType(e.target.value as any)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs"
              >
                <option value="pre_knowledge">ก่อนเรียน (ความรู้)</option>
                <option value="pre_skill">ก่อนเรียน (ทักษะ)</option>
                <option value="post_knowledge">หลังเรียน (ความรู้)</option>
                <option value="post_skill">หลังเรียน (ทักษะ)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">บทที่</label>
              <select
                value={chapterNumber}
                onChange={(e) => setChapterNumber(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border-2 border-slate-200 bg-slate-50 text-xs focus:border-primary focus:outline-none"
              >
                <option value={1}>บทที่ 1 (เนื้อหาทั้งหมด)</option>
              </select>
            </div>
            
            <div>
              <label className="font-bold text-slate-700 block mb-1">ระดับความยาก</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs"
              >
                <option value="easy">ง่าย (Easy)</option>
                <option value="medium">ปานกลาง (Medium)</option>
                <option value="hard">ยาก (Hard)</option>
              </select>
            </div>
          </div>

          {/* Question Text */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">โจทย์คำถาม</label>
            <textarea
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              required
              rows={3}
              placeholder="กรอกโจทย์คำถามตรรกศาสตร์..."
              className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Options */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">ตัวเลือกคำตอบ (4 ตัวเลือก)</label>
            <div className="space-y-2">
              {options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="correctIndex"
                    checked={correctIndex === idx}
                    onChange={() => setCorrectIndex(idx)}
                    className="accent-primary"
                  />
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    required
                    placeholder={`ตัวเลือกที่ ${idx + 1}`}
                    className="flex-1 p-2 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                  />
                  {correctIndex === idx && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full shrink-0">
                      คำตอบที่ถูก
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Explanation */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">คำอธิบายเฉลี่ย (Explanation)</label>
            <input
              type="text"
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="พิมพ์คำอธิบายประกอบเฉลย..."
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs"
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 font-semibold hover:bg-slate-100"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-primary text-white font-bold hover:bg-primary-hover shadow-soft-sm flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" /> บันทึกข้อสอบ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
