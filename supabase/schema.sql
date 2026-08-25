-- ========================================================
-- LOGIC DETECTIVE ACADEMY - SUPABASE DATABASE SCHEMA (SQL)
-- ========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE, -- linked to auth.users if auth is enabled
    role VARCHAR(20) NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'teacher')),
    full_name VARCHAR(255) NOT NULL,
    student_id VARCHAR(50) UNIQUE,
    class_name VARCHAR(100) NOT NULL DEFAULT 'ปวช. 1/1',
    email VARCHAR(255),
    avatar_url TEXT DEFAULT 'https://api.dicebear.com/7.x/bottts/svg?seed=Detective',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CLASSES TABLE
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    grade_level VARCHAR(50) NOT NULL DEFAULT 'ปวช. 1',
    student_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. LESSONS TABLE
CREATE TABLE IF NOT EXISTS public.lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chapter_number INT NOT NULL UNIQUE CHECK (chapter_number BETWEEN 1 AND 5),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    order_index INT NOT NULL DEFAULT 1,
    duration_mins INT DEFAULT 15,
    objectives JSONB DEFAULT '[]'::jsonb,
    content_blocks JSONB DEFAULT '[]'::jsonb,
    reflection_question TEXT,
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. LESSON_PROGRESS TABLE
CREATE TABLE IF NOT EXISTS public.lesson_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
    completed BOOLEAN DEFAULT FALSE,
    score INT DEFAULT 0,
    reflection_answer TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, lesson_id)
);

-- 5. LOGICAL_LAB TABLE
CREATE TABLE IF NOT EXISTS public.logical_lab (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lab_code VARCHAR(50) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    module_type VARCHAR(50) NOT NULL CHECK (
        module_type IN (
            'scenario', 'puzzle', 'drag_drop', 'truth_table',
            'sequencing', 'conditional', 'case_study',
            'pattern', 'deduction'
        )
    ),
    difficulty VARCHAR(20) DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. LOGICAL_LAB_RESULT TABLE
CREATE TABLE IF NOT EXISTS public.logical_lab_result (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    lab_id UUID NOT NULL REFERENCES public.logical_lab(id) ON DELETE CASCADE,
    score INT DEFAULT 0,
    time_spent_sec INT DEFAULT 0,
    attempts INT DEFAULT 1,
    completed BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. QUESTION_BANK TABLE
CREATE TABLE IF NOT EXISTS public.question_bank (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chapter_number INT NOT NULL CHECK (chapter_number BETWEEN 1 AND 5),
    question_text TEXT NOT NULL,
    options JSONB NOT NULL, -- Array of strings e.g. ["ข้อ ก", "ข้อ ข", ...]
    correct_option_index INT NOT NULL,
    explanation TEXT,
    difficulty VARCHAR(20) DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. PRETEST_RESULT TABLE
CREATE TABLE IF NOT EXISTS public.pretest_result (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    score INT NOT NULL DEFAULT 0,
    total_questions INT NOT NULL DEFAULT 20,
    answers JSONB DEFAULT '[]'::jsonb,
    time_spent_sec INT DEFAULT 0,
    completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. POSTTEST_RESULT TABLE
CREATE TABLE IF NOT EXISTS public.posttest_result (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    score INT NOT NULL DEFAULT 0,
    total_questions INT NOT NULL DEFAULT 20,
    answers JSONB DEFAULT '[]'::jsonb,
    time_spent_sec INT DEFAULT 0,
    improvement_percent NUMERIC(5,2) DEFAULT 0.00,
    completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. GAME_RESULT TABLE
CREATE TABLE IF NOT EXISTS public.game_result (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    score INT DEFAULT 0,
    time_spent_sec INT DEFAULT 0,
    attempts INT DEFAULT 1,
    stages_cleared INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. BADGES TABLE
CREATE TABLE IF NOT EXISTS public.badges (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    icon_name VARCHAR(50) NOT NULL,
    criteria TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. USER_BADGES TABLE
CREATE TABLE IF NOT EXISTS public.user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    badge_id VARCHAR(50) NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, badge_id)
);

-- 13. CERTIFICATES TABLE
CREATE TABLE IF NOT EXISTS public.certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    certificate_code VARCHAR(100) NOT NULL UNIQUE,
    issued_at TIMESTAMPTZ DEFAULT NOW(),
    pdf_url TEXT
);

-- 14. ANNOUNCEMENTS TABLE
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    target_class VARCHAR(100) DEFAULT 'ทั้งหมด',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. TEACHER_NOTES TABLE
CREATE TABLE IF NOT EXISTS public.teacher_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. LEARNING_TIME TABLE
CREATE TABLE IF NOT EXISTS public.learning_time (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    seconds_spent INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- 17. REPORTS TABLE
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    radar_scores JSONB DEFAULT '{"proposition": 0, "truth_value": 0, "connectives": 0, "truth_table": 0, "reasoning": 0}'::jsonb,
    strengths TEXT[] DEFAULT '{}',
    weaknesses TEXT[] DEFAULT '{}',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================================
-- INDEXES FOR OPTIMIZED QUERIES
-- ========================================================
CREATE INDEX IF NOT EXISTS idx_profiles_student_id ON public.profiles(student_id);
CREATE INDEX IF NOT EXISTS idx_profiles_class_name ON public.profiles(class_name);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user ON public.lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_lab_result_user ON public.logical_lab_result(user_id);
CREATE INDEX IF NOT EXISTS idx_question_bank_chapter ON public.question_bank(chapter_number);
CREATE INDEX IF NOT EXISTS idx_game_result_user ON public.game_result(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_time_user_date ON public.learning_time(user_id, date);

-- ========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logical_lab ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logical_lab_result ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pretest_result ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posttest_result ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_result ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_time ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Allow Public/Authenticated Full Access for demo/development mode
CREATE POLICY "Public Read Access" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Public Insert Profiles" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Profiles" ON public.profiles FOR UPDATE USING (true);

CREATE POLICY "Public Read Classes" ON public.classes FOR SELECT USING (true);
CREATE POLICY "Public Read Lessons" ON public.lessons FOR SELECT USING (true);
CREATE POLICY "Public Read Badges" ON public.badges FOR SELECT USING (true);
CREATE POLICY "Public Read Announcements" ON public.announcements FOR SELECT USING (true);
CREATE POLICY "Public Read Questions" ON public.question_bank FOR SELECT USING (true);

-- User Progress / Results RLS
CREATE POLICY "Users can manage own lesson progress" ON public.lesson_progress FOR ALL USING (true);
CREATE POLICY "Users can manage own lab results" ON public.logical_lab_result FOR ALL USING (true);
CREATE POLICY "Users can manage own pretest" ON public.pretest_result FOR ALL USING (true);
CREATE POLICY "Users can manage own posttest" ON public.posttest_result FOR ALL USING (true);
CREATE POLICY "Users can manage own game results" ON public.game_result FOR ALL USING (true);
CREATE POLICY "Users can manage own user badges" ON public.user_badges FOR ALL USING (true);
CREATE POLICY "Users can manage certificates" ON public.certificates FOR ALL USING (true);
CREATE POLICY "Users can manage learning time" ON public.learning_time FOR ALL USING (true);
CREATE POLICY "Users can manage reports" ON public.reports FOR ALL USING (true);
