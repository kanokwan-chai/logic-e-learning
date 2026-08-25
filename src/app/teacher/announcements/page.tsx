'use client';

import { useState } from 'react';
import TeacherSidebar from '@/components/layout/TeacherSidebar';
import { useAnnouncements } from '@/lib/hooks/useSupabaseContent';
import { AnnouncementItem } from '@/types';
import { Megaphone, Sparkles, Send, Trash2, Info, Loader2 } from 'lucide-react';

export default function AnnouncementsPage() {
  const { announcements, loading, addAnnouncement, deleteAnnouncement } = useAnnouncements();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetClass, setTargetClass] = useState('ทั้งหมด');
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    
    setIsSaving(true);
    try {
      const newItem: AnnouncementItem = {
        id: `ann-${Date.now()}`,
        title,
        content,
        target_class: targetClass,
        created_at: new Date().toISOString(),
      };

      await addAnnouncement(newItem);
      setTitle('');
      setContent('');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen md:flex md:h-screen bg-[#F8FAFC] md:overflow-hidden font-sans">
      <TeacherSidebar />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-soft-sm">
          <h1 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-primary" /> ประกาศข่าวสารให้นักเรียน
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            ประกาศจะแสดงให้นักเรียนเห็นในหน้า Dashboard ทันที
          </p>
        </div>

        {/* Info */}
        <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 flex items-start gap-3 text-xs text-blue-900">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
          <p className="font-medium">
            ประกาศที่โพสต์จะบันทึกไว้ในระบบตลอดจนกว่าจะลบออก นักเรียนทุกคนจะเห็นทันที
          </p>
        </div>

        {/* Create Form */}
        <form onSubmit={handleCreateAnnouncement} className="p-6 rounded-3xl bg-white border border-slate-100 shadow-soft-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" /> โพสต์ประกาศใหม่
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="sm:col-span-2">
              <label className="font-bold text-slate-700 block mb-1">หัวข้อประกาศ *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="เช่น กำหนดการสอบ Post-test สัปดาห์หน้า"
                className="w-full p-3 rounded-2xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">กลุ่มเป้าหมาย</label>
              <select
                value={targetClass}
                onChange={(e) => setTargetClass(e.target.value)}
                className="w-full p-3 rounded-2xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="ทั้งหมด">ทั้งหมดทุกห้อง</option>
                <option value="ปวช.1 ธดท.">ปวช.1 ธดท.</option>
              </select>
            </div>
          </div>

          <div className="text-xs">
            <label className="font-bold text-slate-700 block mb-1">รายละเอียดประกาศ *</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={3}
              placeholder="พิมพ์เนื้อหาประกาศที่ต้องการแจ้งให้นักเรียนทราบ..."
              className="w-full p-3 rounded-2xl border border-slate-200 bg-slate-50 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-2xl bg-primary text-white font-bold text-xs hover:bg-primary-hover transition-all shadow-soft-sm flex items-center gap-2 disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} โพสต์ประกาศ
            </button>
          </div>
        </form>

        {/* Announcements List */}
        {loading ? (
          <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : announcements.length === 0 && (
          <div className="p-8 rounded-3xl border-2 border-dashed border-slate-200 text-center text-xs text-slate-400 font-bold">
            ยังไม่มีประกาศ — โพสต์ประกาศแรกด้านบนได้เลย!
          </div>
        )}

        <div className="space-y-3">
          {announcements.map((ann) => (
            <div
              key={ann.id}
              className="p-5 rounded-3xl bg-white border border-slate-100 shadow-soft-sm space-y-2 relative"
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full bg-secondary-light text-slate-800 text-[10px] font-bold">
                    {ann.target_class}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(ann.created_at).toLocaleDateString('th-TH', {
                      year: 'numeric', month: 'short', day: 'numeric',
                    })}
                  </span>
                </div>
                <button
                  onClick={async () => {
                    setDeletingId(ann.id);
                    await deleteAnnouncement(ann.id);
                    setDeletingId(null);
                  }}
                  disabled={deletingId === ann.id}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 disabled:opacity-50"
                >
                  {deletingId === ann.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
              </div>

              <h4 className="font-extrabold text-sm text-slate-800">{ann.title}</h4>
              <p className="text-xs text-slate-600 leading-relaxed">{ann.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
