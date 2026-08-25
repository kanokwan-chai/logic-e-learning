import {
  Profile,
  Lesson,
  QuestionItem,
  BadgeItem,
  AnnouncementItem,
  StudentReportItem,
  LogicalLab
} from '@/types';

// ─── Teacher Profile ─────────────────────────────────────────────────────────
export const MOCK_TEACHER: Profile = {
  id: 't-001',
  role: 'teacher',
  full_name: 'ครูผู้สอน',
  email: 'teacher@school.ac.th',
  class_name: '',
  avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=teacher',
  created_at: '',
};

// ─── Student Profile ──────────────────────────────────────────────────────────
export const MOCK_STUDENT: Profile = {
  id: 's-001',
  role: 'student',
  full_name: '',
  student_id: '',
  class_name: '',
  avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=student',
  created_at: '',
};

// ─── Classes ──────────────────────────────────────────────────────────────────
// เพิ่มห้องเรียนตรงนี้ได้เลย
export const MOCK_CLASSES: { id: string; name: string; grade_level: string; student_count: number }[] = [];

// ─── Badges ───────────────────────────────────────────────────────────────────
export const MOCK_BADGES: BadgeItem[] = [
  { id: 'badge-1', name: 'ก่อนเรียน (ความรู้)', description: 'ทำแบบทดสอบวัดความรู้ก่อนเรียน', icon_name: 'Brain', criteria: 'ส่งแบบทดสอบก่อนเรียน (ความรู้)' },
  { id: 'badge-2', name: 'ก่อนเรียน (ทักษะ)', description: 'ทำแบบทดสอบวัดทักษะก่อนเรียน', icon_name: 'Puzzle', criteria: 'ส่งแบบทดสอบก่อนเรียน (ทักษะ)' },
  { id: 'badge-3', name: 'บทเรียนตรรกศาสตร์', description: 'เข้าศึกษาบทเรียนตรรกศาสตร์เบื้องต้น', icon_name: 'Award', criteria: 'เรียนจบอย่างน้อย 1 บทเรียน' },
  { id: 'badge-4', name: 'Digital Board Game', description: 'เคลียร์ภารกิจบอร์ดเกม', icon_name: 'Gamepad2', criteria: 'เล่นบอร์ดเกมจบ 1 รอบ' },
  { id: 'badge-5', name: 'หลังเรียน (ความรู้)', description: 'ทำแบบทดสอบวัดความรู้หลังเรียน', icon_name: 'Crown', criteria: 'ส่งแบบทดสอบหลังเรียน (ความรู้)' },
  { id: 'badge-6', name: 'หลังเรียน (ทักษะ)', description: 'ทำแบบทดสอบวัดทักษะหลังเรียน', icon_name: 'Sparkles', criteria: 'ส่งแบบทดสอบหลังเรียน (ทักษะ)' },
];

// ─── Lessons ──────────────────────────────────────────────────────────────────
// เพิ่มบทเรียนตรงนี้ได้เลย
export const MOCK_LESSONS: Lesson[] = [];

// ─── Questions ────────────────────────────────────────────────────────────────
// เพิ่มข้อสอบ Pre-test / Post-test ตรงนี้ได้เลย
export const MOCK_QUESTIONS: QuestionItem[] = [];

// ─── Student Reports ─────────────────────────────────────────────────────────
// ข้อมูลรายงานนักเรียน (จะดึงจาก Supabase เมื่อเชื่อมต่อแล้ว)
export const MOCK_STUDENT_REPORTS: StudentReportItem[] = [];

// ─── Announcements ────────────────────────────────────────────────────────────
// เพิ่มประกาศตรงนี้ได้เลย
export const MOCK_ANNOUNCEMENTS: AnnouncementItem[] = [];

// ─── Logical Labs ─────────────────────────────────────────────────────────────
// เพิ่มฐานกิจกรรม Lab ตรงนี้ได้เลย
export const MOCK_LABS: LogicalLab[] = [];
