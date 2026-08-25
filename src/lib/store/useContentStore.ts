import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Lesson, QuestionItem, AnnouncementItem } from '@/types';

// ─── Lab type (simplified for CMS) ─────────────────────────────────────────
export interface LabItem {
  id: string;
  lab_code: string;
  title: string;
  module_type: 'scenario' | 'puzzle' | 'truth_table';
  difficulty: 'easy' | 'medium' | 'hard';
  scenario_text: string;   // โจทย์/สถานการณ์
  options: string[];       // ตัวเลือก A B C D
  correct_index: number;   // index ของคำตอบที่ถูก
  explanation: string;     // คำอธิบายเฉลย
}

// ─── Lesson type for teacher CMS (simplified) ────────────────────────────────
export interface CMSLesson {
  id: string;
  chapter_number: number;
  title: string;
  description: string;
  duration_mins: number;
  objectives: string[];       // วัตถุประสงค์ (newline-separated string → string[])
  video_url: string;          // ลิงก์วิดีโอ YouTube embed
  slide_url: string;          // ลิงก์สไลด์ Canva/Google Slides embed
  reflection_question: string;
  published: boolean;         // true = นักเรียนเห็น, false = draft
}

// ─── Store State & Actions ───────────────────────────────────────────────────
interface ContentStore {
  lessons: CMSLesson[];
  questions: QuestionItem[];
  labs: LabItem[];
  announcements: AnnouncementItem[];

  // Lessons
  addLesson: (lesson: CMSLesson) => void;
  updateLesson: (lesson: CMSLesson) => void;
  deleteLesson: (id: string) => void;

  // Questions
  addQuestion: (q: QuestionItem) => void;
  updateQuestion: (q: QuestionItem) => void;
  deleteQuestion: (id: string) => void;

  // Labs
  addLab: (lab: LabItem) => void;
  updateLab: (lab: LabItem) => void;
  deleteLab: (id: string) => void;

  // Announcements
  addAnnouncement: (ann: AnnouncementItem) => void;
  deleteAnnouncement: (id: string) => void;
}

export const useContentStore = create<ContentStore>()(
  persist(
    (set) => ({
      lessons: [],
      questions: [],
      labs: [],
      announcements: [],

      // ── Lessons ──
      addLesson: (lesson) =>
        set((s) => ({ lessons: [...s.lessons, lesson].sort((a, b) => a.chapter_number - b.chapter_number) })),
      updateLesson: (lesson) =>
        set((s) => ({ lessons: s.lessons.map((l) => (l.id === lesson.id ? lesson : l)) })),
      deleteLesson: (id) =>
        set((s) => ({ lessons: s.lessons.filter((l) => l.id !== id) })),

      // ── Questions ──
      addQuestion: (q) =>
        set((s) => ({ questions: [q, ...s.questions] })),
      updateQuestion: (q) =>
        set((s) => ({ questions: s.questions.map((x) => (x.id === q.id ? q : x)) })),
      deleteQuestion: (id) =>
        set((s) => ({ questions: s.questions.filter((q) => q.id !== id) })),

      // ── Labs ──
      addLab: (lab) =>
        set((s) => ({ labs: [...s.labs, lab] })),
      updateLab: (lab) =>
        set((s) => ({ labs: s.labs.map((l) => (l.id === lab.id ? lab : l)) })),
      deleteLab: (id) =>
        set((s) => ({ labs: s.labs.filter((l) => l.id !== id) })),

      // ── Announcements ──
      addAnnouncement: (ann) =>
        set((s) => ({ announcements: [ann, ...s.announcements] })),
      deleteAnnouncement: (id) =>
        set((s) => ({ announcements: s.announcements.filter((a) => a.id !== id) })),
    }),
    { name: 'logic-content-store' }
  )
);
