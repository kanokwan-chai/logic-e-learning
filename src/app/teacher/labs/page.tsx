'use client';

import { useState } from 'react';
import TeacherSidebar from '@/components/layout/TeacherSidebar';
import { LabItem } from '@/lib/store/useContentStore';
import { useLabs } from '@/lib/hooks/useSupabaseContent';
import { FlaskConical, Plus, Edit3, Trash2, Info, X, Save, Loader2 } from 'lucide-react';

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: 'ง่าย',
  medium: 'ปานกลาง',
  hard: 'ยาก',
};

// ─── Lab Form Modal ───────────────────────────────────────────────────────────
function LabModal({
  lab,
  onClose,
  onSave,
}: {
  lab: LabItem | null;
  onClose: () => void;
  onSave: (l: LabItem) => Promise<void> | void;
}) {
  const isEdit = lab !== null;
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<LabItem>(
    lab ?? {
      id: `lab-${Date.now()}`,
      lab_code: `LAB-${String(Date.now()).slice(-4)}`,
      title: '',
      module_type: 'scenario',
      difficulty: 'easy',
      scenario_text: '',
      options: ['', '', '', ''],
      correct_index: 0,
      explanation: '',
    }
  );

  const set = (field: keyof LabItem, val: unknown) =>
    setForm((f) => ({ ...f, [field]: val }));

  const handleOptionChange = (idx: number, val: string) => {
    const updated = [...form.options];
    updated[idx] = val;
    setForm((f) => ({ ...f, options: updated }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.scenario_text.trim()) return;
    setIsSaving(true);
    await onSave(form);
    setIsSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-4xl shadow-soft-lg w-full max-w-2xl my-8 border-2 border-slate-100">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-extrabold text-slate-800 flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-primary" />
            {isEdit ? 'แก้ไขโจทย์ Lab' : 'เพิ่มโจทย์ Lab ใหม่'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Lab Code + Module Type + Difficulty */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">รหัส Lab</label>
              <input
                value={form.lab_code}
                onChange={(e) => set('lab_code', e.target.value)}
                placeholder="LAB-01"
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">ประเภท</label>
              <select
                value={form.module_type}
                onChange={(e) => set('module_type', e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="scenario">🔴 Scenario (สถานการณ์)</option>
                <option value="puzzle">🧩 Puzzle (ปริศนา)</option>
                <option value="truth_table">📊 Truth Table</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">ระดับความยาก</label>
              <select
                value={form.difficulty}
                onChange={(e) => set('difficulty', e.target.value as LabItem['difficulty'])}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="easy">ง่าย (Easy)</option>
                <option value="medium">ปานกลาง (Medium)</option>
                <option value="hard">ยาก (Hard)</option>
              </select>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">ชื่อโจทย์ Lab *</label>
            <input
              required
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="เช่น คดีระเบิดเวลาดิจิทัล"
              className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Scenario / Puzzle Text */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">โจทย์ / สถานการณ์ / ปริศนา *</label>
            <textarea
              required
              rows={4}
              value={form.scenario_text}
              onChange={(e) => set('scenario_text', e.target.value)}
              placeholder="พิมพ์โจทย์ สถานการณ์จำลอง หรือปริศนาตรรกศาสตร์ที่ต้องการให้นักเรียนแก้ไข..."
              className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 leading-relaxed"
            />
          </div>

          {/* Options A-D */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">ตัวเลือกคำตอบ (A-D)</label>
            <div className="space-y-2">
              {form.options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${form.correct_index === idx ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <input
                    value={opt}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    placeholder={`ตัวเลือก ${String.fromCharCode(65 + idx)}`}
                    className="flex-1 p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 cursor-pointer shrink-0">
                    <input
                      type="radio"
                      name="correct"
                      checked={form.correct_index === idx}
                      onChange={() => set('correct_index', idx)}
                      className="accent-emerald-500"
                    />
                    เฉลย
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Explanation */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">คำอธิบายเฉลย (แสดงหลังตอบแล้ว)</label>
            <textarea
              rows={3}
              value={form.explanation}
              onChange={(e) => set('explanation', e.target.value)}
              placeholder="อธิบายเหตุผลทางตรรกศาสตร์ว่าทำไมถึงตอบข้อนั้น..."
              className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 leading-relaxed"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-2xl bg-primary text-white font-bold text-xs hover:bg-primary-hover shadow-soft-sm flex items-center gap-2 disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isEdit ? 'บันทึกการแก้ไข' : 'เพิ่มโจทย์ Lab'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TeacherLabsPage() {
  const { labs, loading, addLab, updateLab, deleteLab } = useLabs();
  const [modal, setModal] = useState<LabItem | null | undefined>(undefined);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleSave = async (lab: LabItem) => {
    const exists = labs.some((l) => l.id === lab.id);
    if (exists) await updateLab(lab);
    else await addLab(lab);
  };

  const handleDelete = async (id: string) => {
    if (confirm('ลบโจทย์ Lab นี้ใช่ไหม?')) {
      setIsDeleting(id);
      await deleteLab(id);
      setIsDeleting(null);
    }
  };

  const difficultyColor = (d: string) =>
    d === 'easy' ? 'bg-emerald-100 text-emerald-700' :
    d === 'medium' ? 'bg-amber-100 text-amber-800' :
    'bg-rose-100 text-rose-700';

  return (
    <div className="flex flex-col md:flex-row gap-6">
      <TeacherSidebar />

      <div className="flex-1 space-y-6">
        {/* Header */}
        <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-soft-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
              <FlaskConical className="w-6 h-6 text-primary" /> จัดการโจทย์ Logical Thinking Lab
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              เพิ่มโจทย์สถานการณ์ ปริศนาตรรกศาสตร์ และตารางค่าความจริงให้นักเรียนฝึกคิด
            </p>
          </div>
          <button
            onClick={() => setModal(null)}
            className="px-4 py-2.5 rounded-2xl bg-primary text-white font-bold text-xs hover:bg-primary-hover shadow-soft-sm flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" /> เพิ่มโจทย์ Lab ใหม่
          </button>
        </div>

        {/* Info */}
        <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 flex items-start gap-3 text-xs text-blue-900">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
          <p className="font-medium">โจทย์ทุกข้อที่เพิ่มจะแสดงให้นักเรียนเห็นทันทีในหน้า Logical Thinking Lab</p>
        </div>

        {/* Empty State */}
        {!loading && labs.length === 0 && (
          <div className="p-12 rounded-3xl border-2 border-dashed border-slate-200 text-center space-y-3">
            <div className="w-14 h-14 rounded-3xl bg-primary-light mx-auto flex items-center justify-center">
              <FlaskConical className="w-7 h-7 text-primary" />
            </div>
            <p className="font-extrabold text-slate-700">ยังไม่มีโจทย์ Lab</p>
            <p className="text-xs text-slate-500">เพิ่มสถานการณ์จำลอง ปริศนา หรือโจทย์ Truth Table ให้นักเรียนฝึกคิด</p>
            <button
              onClick={() => setModal(null)}
              className="px-5 py-2.5 rounded-2xl bg-primary text-white font-bold text-xs hover:bg-primary-hover shadow-soft-sm"
            >
              + เพิ่มโจทย์แรก
            </button>
          </div>
        )}

        {/* Lab List */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : labs.map((lab, idx) => (
            <div key={lab.id} className="p-6 rounded-3xl bg-white border border-slate-100 shadow-soft-sm space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono font-bold text-[10px]">
                    {lab.lab_code}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${difficultyColor(lab.difficulty)}`}>
                    {DIFFICULTY_LABELS[lab.difficulty]}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-primary-light text-primary font-bold text-[10px]">
                    ฐานที่ {idx + 1}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setModal(lab)} className="p-2 rounded-xl text-slate-400 hover:text-primary hover:bg-primary-light">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(lab.id)} disabled={isDeleting === lab.id} className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 disabled:opacity-50">
                    {isDeleting === lab.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <h3 className="font-extrabold text-sm text-slate-800">{lab.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">{lab.scenario_text}</p>

              {/* Options Preview */}
              <div className="grid grid-cols-2 gap-2">
                {lab.options.map((opt, oIdx) => (
                  <div
                    key={oIdx}
                    className={`p-2 rounded-xl text-[11px] font-medium border ${
                      oIdx === lab.correct_index
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    {String.fromCharCode(65 + oIdx)}. {opt || <span className="italic opacity-50">ว่าง</span>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {modal !== undefined && (
        <LabModal lab={modal} onClose={() => setModal(undefined)} onSave={handleSave} />
      )}
    </div>
  );
}
