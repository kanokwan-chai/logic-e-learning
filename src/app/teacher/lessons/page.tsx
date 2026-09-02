'use client';

import { useState } from 'react';
import TeacherSidebar from '@/components/layout/TeacherSidebar';
import { CMSLesson } from '@/lib/store/useContentStore';
import { useLessons } from '@/lib/hooks/useSupabaseContent';
import {
  BookMarked, Plus, Edit3, Trash2, Eye, EyeOff, Clock,
  Video, Presentation, HelpCircle, CheckCircle2, Info, X, Save, Loader2, Gamepad2
} from 'lucide-react';

// ─── Lesson Form Modal ────────────────────────────────────────────────────────
function LessonModal({
  lesson, onClose, onSave,
}: {
  lesson: CMSLesson | null;
  onClose: () => void;
  onSave: (l: CMSLesson) => Promise<boolean>;
}) {
  const isEdit = lesson !== null;
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<CMSLesson>(
    lesson ?? {
      id: `les-${Date.now()}`,
      chapter_number: 1,
      title: '',
      description: '',
      duration_mins: 15,
      objectives: [''],
      video_url: '',
      slide_url: '',
      reflection_question: '',
      published: true,
    }
  );

  const set = (field: keyof CMSLesson, val: unknown) =>
    setForm((f) => ({ ...f, [field]: val }));

  const handleObjectiveChange = (idx: number, val: string) => {
    const updated = [...form.objectives];
    updated[idx] = val;
    setForm((f) => ({ ...f, objectives: updated }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    const ok = await onSave({ ...form, objectives: form.objectives.filter((o) => o.trim()) });
    setSaving(false);
    if (ok) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-4xl shadow-soft-lg w-full max-w-2xl my-8 border-2 border-slate-100">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-extrabold text-slate-800 flex items-center gap-2">
            <BookMarked className="w-5 h-5 text-primary" />
            {isEdit ? 'แก้ไขบทเรียน' : 'เพิ่มบทเรียนใหม่'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">บทที่ *</label>
              <input type="number" min={1} max={20} value={form.chapter_number}
                onChange={(e) => set('chapter_number', Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">เวลา (นาที)</label>
              <input type="number" min={1} value={form.duration_mins}
                onChange={(e) => set('duration_mins', Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">สถานะ</label>
              <select value={form.published ? 'published' : 'draft'}
                onChange={(e) => set('published', e.target.value === 'published')}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30">
                <option value="published">✅ เผยแพร่</option>
                <option value="draft">📝 Draft (ซ่อน)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">ชื่อบทเรียน *</label>
            <input required value={form.title} onChange={(e) => set('title', e.target.value)}
              placeholder="เช่น บทที่ 1: ประพจน์ (Propositions)"
              className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">คำอธิบายบทเรียน</label>
            <textarea rows={2} value={form.description} onChange={(e) => set('description', e.target.value)}
              placeholder="อธิบายสั้นๆ ว่าบทเรียนนี้เรียนรู้อะไร..."
              className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700">วัตถุประสงค์การเรียนรู้</label>
              <button type="button" onClick={() => setForm((f) => ({ ...f, objectives: [...f.objectives, ''] }))}
                className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1">
                <Plus className="w-3 h-3" /> เพิ่มข้อ
              </button>
            </div>
            <div className="space-y-2">
              {form.objectives.map((obj, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input value={obj} onChange={(e) => handleObjectiveChange(idx, e.target.value)}
                    placeholder={`วัตถุประสงค์ข้อที่ ${idx + 1}`}
                    className="flex-1 p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  <button type="button" onClick={() => setForm((f) => ({ ...f, objectives: f.objectives.filter((_, i) => i !== idx) }))}
                    className="p-1.5 rounded-lg text-slate-300 hover:text-rose-500"><X className="w-3.5 h-3.5" /></button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1">
              <Video className="w-3.5 h-3.5 text-rose-500" /> สื่อประกอบการสอน (วิดีโอ YouTube / MP3 / Digital Board Game)
            </label>
            <input value={form.video_url} onChange={(e) => set('video_url', e.target.value)}
              placeholder="https://www.youtube.com/watch?v=... หรือ https://digital-board-game-eight.vercel.app"
              className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono" />
            <p className="text-[10px] text-slate-400 mt-1">สามารถใส่ลิงก์ YouTube, ไฟล์เสียง, หรือลิงก์เกมกระดานดิจิทัลได้</p>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1">
              <Presentation className="w-3.5 h-3.5 text-blue-500" /> ลิงก์สไลด์ (Canva / Google Slides)
            </label>
            <input value={form.slide_url} onChange={(e) => set('slide_url', e.target.value)}
              placeholder="https://docs.google.com/presentation/d/.../embed"
              className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono" />
          </div>


          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={onClose}
              className="px-5 py-2.5 rounded-2xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200">ยกเลิก</button>
            <button type="submit" disabled={saving}
              className="px-5 py-2.5 rounded-2xl bg-primary text-white font-bold text-xs hover:bg-primary-hover shadow-soft-sm flex items-center gap-2 disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isEdit ? 'บันทึกการแก้ไข' : 'เพิ่มบทเรียน'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TeacherLessonsPage() {
  const { lessons, loading, addLesson, updateLesson, deleteLesson } = useLessons();
  const [modal, setModal] = useState<CMSLesson | null | undefined>(undefined);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleSave = async (lesson: CMSLesson) => {
    const exists = lessons.some((l) => l.id === lesson.id);
    return exists ? updateLesson(lesson) : addLesson(lesson);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('ลบบทเรียนนี้ใช่ไหม? นักเรียนจะไม่เห็นบทเรียนนี้อีก')) return;
    setDeleting(id);
    await deleteLesson(id);
    setDeleting(null);
  };

  const togglePublish = (lesson: CMSLesson) => updateLesson({ ...lesson, published: !lesson.published });

  return (
    <div className="min-h-[calc(100vh-140px)] bg-[#F8FAFC] font-sans md:flex md:h-[calc(100vh-140px)] md:overflow-hidden rounded-3xl shadow-sm border border-slate-200">
      <TeacherSidebar />
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-soft-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
              <BookMarked className="w-6 h-6 text-primary" /> จัดการบทเรียน
            </h1>
            <p className="text-xs text-slate-500 mt-1">เพิ่ม/แก้ไข/ลบเนื้อหา</p>
          </div>
          <button onClick={() => setModal(null)}
            className="px-4 py-2.5 rounded-2xl bg-primary text-white font-bold text-xs hover:bg-primary-hover shadow-soft-sm flex items-center gap-1.5 shrink-0">
            <Plus className="w-4 h-4" /> เพิ่มบทเรียนใหม่
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 flex items-start gap-3 text-xs text-blue-900">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
          <p className="font-medium">ขณะนี้มี <strong>{lessons.length} บทเรียน</strong> ที่เปิดให้นักเรียนเข้าถึงได้</p>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-16 gap-3 text-xs text-slate-400 font-bold">
            <Loader2 className="w-5 h-5 animate-spin text-primary" /> กำลังโหลดข้อมูล...
          </div>
        )}

        {!loading && lessons.length === 0 && (
          <div className="p-12 rounded-3xl border-2 border-dashed border-slate-200 text-center space-y-3">
            <div className="w-14 h-14 rounded-3xl bg-primary-light mx-auto flex items-center justify-center">
              <BookMarked className="w-7 h-7 text-primary" />
            </div>
            <p className="font-extrabold text-slate-700">ยังไม่มีบทเรียน</p>
            <button onClick={() => setModal(null)}
              className="px-5 py-2.5 rounded-2xl bg-primary text-white font-bold text-xs hover:bg-primary-hover shadow-soft-sm">
              + เพิ่มบทเรียนแรก
            </button>
          </div>
        )}

        <div className="space-y-4">
          {lessons.map((les) => (
            <div key={les.id}
              className={`p-6 rounded-3xl border-2 shadow-soft-sm space-y-3 transition-all ${les.published ? 'bg-white border-slate-100' : 'bg-slate-50 border-dashed border-slate-200 opacity-70'}`}>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-3 py-1 rounded-full bg-primary-light text-primary font-bold text-xs">บทที่ {les.chapter_number}</span>
                  <span className="text-xs text-slate-400 font-medium flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {les.duration_mins} นาที</span>
                  {les.published
                    ? <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px] flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> เผยแพร่</span>
                    : <span className="px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-600 font-bold text-[10px]">📝 Draft</span>}
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => togglePublish(les)} title={les.published ? 'ซ่อน' : 'เผยแพร่'}
                    className="p-2 rounded-xl text-slate-400 hover:text-amber-500 hover:bg-amber-50">
                    {les.published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button onClick={() => setModal(les)} className="p-2 rounded-xl text-slate-400 hover:text-primary hover:bg-primary-light">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(les.id)} disabled={deleting === les.id}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 disabled:opacity-50">
                    {deleting === les.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <h3 className="font-extrabold text-base text-slate-800">{les.title}</h3>
              {les.description && <p className="text-xs text-slate-600 leading-relaxed">{les.description}</p>}
              <div className="flex items-center gap-2 flex-wrap">
                {les.video_url && (
                  les.video_url.includes('digital-board-game') || les.video_url.includes('board-game') ? (
                    <span className="px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold flex items-center gap-1">
                      <Gamepad2 className="w-3 h-3" /> บอร์ดเกม
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold flex items-center gap-1">
                      <Video className="w-3 h-3" /> วิดีโอ
                    </span>
                  )
                )}
                {les.slide_url && <span className="px-2.5 py-1 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold flex items-center gap-1"><Presentation className="w-3 h-3" /> สไลด์</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
      {modal !== undefined && <LessonModal lesson={modal} onClose={() => setModal(undefined)} onSave={handleSave} />}
    </div>
  );
}
