export type UserRole = 'student' | 'teacher';

export interface Profile {
  id: string;
  user_id?: string;
  role: UserRole;
  full_name: string;
  first_name?: string;
  last_name?: string;
  seat_number?: string;
  student_id?: string;
  class_name: string;
  email?: string;
  avatar_url?: string;
  created_at?: string;
}

export interface ClassItem {
  id: string;
  name: string;
  grade_level: string;
  student_count: number;
}

export interface ContentBlock {
  type: 'card' | 'interactive' | 'knowledge_check' | 'flip_card' | 'diagram' | 'rule' | 'interactive_truth_table' | 'case_study' | 'video' | 'slide';
  title?: string;
  body?: string;
  options?: string[];
  correct?: number;
  explanation?: string;
  front?: string;
  back?: string;
  rules?: string[];
  scenario?: string;
  is_valid?: boolean;
  video_url?: string;
  slide_url?: string;
}

export interface Lesson {
  id: string;
  chapter_number: number;
  title: string;
  description: string;
  order_index: number;
  duration_mins: number;
  objectives: string[];
  content_blocks: ContentBlock[];
  reflection_question: string;
  is_published?: boolean;
}

export interface LessonProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  completed: boolean;
  score: number;
  reflection_answer?: string;
  updated_at?: string;
}

export type LabModuleType =
  | 'scenario'
  | 'puzzle'
  | 'drag_drop'
  | 'truth_table'
  | 'sequencing'
  | 'conditional'
  | 'case_study'
  | 'pattern'
  | 'deduction';

export interface LogicalLab {
  id: string;
  lab_code: string;
  title: string;
  module_type: LabModuleType;
  difficulty: 'easy' | 'medium' | 'hard';
  config: Record<string, any>;
}

export interface LabResult {
  id: string;
  user_id: string;
  lab_id: string;
  score: number;
  time_spent_sec: number;
  attempts: number;
  completed: boolean;
  created_at?: string;
}

export interface QuestionItem {
  id: string;
  chapter_number: number;
  question_text: string;
  options: string[];
  correct_option_index: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  test_type: 'pre_knowledge' | 'pre_skill' | 'post_knowledge' | 'post_skill';
}

export interface TestResult {
  id: string;
  user_id: string;
  score: number;
  total_questions: number;
  answers: number[];
  time_spent_sec: number;
  completed_at: string;
  improvement_percent?: number; // optional, mainly for post tests
}

export interface GameResult {
  id: string;
  user_id: string;
  score: number;
  time_spent_sec: number;
  attempts: number;
  stages_cleared: number;
  created_at?: string;
}

export interface BadgeItem {
  id: string;
  name: string;
  description: string;
  icon_name: string;
  criteria: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
}

export interface CertificateItem {
  id: string;
  user_id: string;
  certificate_code: string;
  issued_at: string;
  pdf_url?: string;
}

export interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  author_id?: string;
  target_class: string;
  created_at: string;
}

export interface StudentReportItem {
  id: string;
  full_name: string;
  student_id: string;
  class_name: string;
  pretest_score?: number;
  posttest_score?: number;
  improvement_percent?: number;
  lessons_completed: number;
  total_lessons: number;
  game_score?: number;
  game_stages?: number;
  study_time_mins: number;
  badges_count: number;
  radar_scores: {
    proposition: number;
    truth_value: number;
    connectives: number;
    truth_table: number;
    reasoning: number;
  };
  strengths: string[];
  weaknesses: string[];
}
