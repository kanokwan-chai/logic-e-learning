-- ══════════════════════════════════════════════════════════
-- Logic E-Learning — Supabase Normalized Schema
-- ══════════════════════════════════════════════════════════

-- 1. ตารางนักเรียน (Students)
create table if not exists students (
  id         text primary key,
  email      text,
  first_name text not null default 'นักเรียน',
  last_name  text not null default '',
  number     integer not null default 0,
  class_name text not null default 'ปวช.1 ธดท.',
  current_activity text default 'ออนไลน์อยู่ในระบบ',
  last_login_at timestamptz default now(),
  created_at timestamptz default now()
);

-- 2. ตารางผลแบบทดสอบ (Test Results)
create table if not exists test_results (
  id          text primary key default gen_random_uuid()::text,
  student_id  text references students(id) on delete cascade,
  test_type   text not null check (test_type in ('pre_knowledge','pre_skill','post_knowledge','post_skill')),
  score       numeric not null default 0,
  max_score   numeric not null default 20,
  answers     jsonb default '[]'::jsonb,
  time_spent_sec integer default 0,
  completed_at timestamptz default now()
);

-- 3. ตารางคะแนนเกม (Game Progress)
create table if not exists game_progress (
  id             text primary key default gen_random_uuid()::text,
  student_id     text references students(id) on delete cascade,
  episode        integer default 1,
  points         numeric not null default 0,
  stages_cleared integer default 5,
  attempts       integer default 1,
  time_spent_sec integer default 600,
  completed_at   timestamptz default now()
);

-- 4. ตารางแบบประเมินความพึงพอใจ (Survey Responses)
create table if not exists survey_responses (
  id           text primary key default gen_random_uuid()::text,
  student_id   text references students(id) on delete cascade,
  answers      jsonb default '{}'::jsonb,
  submitted_at timestamptz default now()
);

-- 5. ตารางความก้าวหน้าเควสและเวลาเรียน (Quest Progress)
create table if not exists quest_progress (
  student_id        text primary key references students(id) on delete cascade,
  total_minutes     integer default 0,
  quests_completed  integer default 0,
  completed_lessons text[] default '{}',
  unlocked_badges   text[] default '{}',
  updated_at        timestamptz default now()
);

-- 6. ตารางบทเรียน (Lessons)
create table if not exists lessons (
  id           text primary key,
  chapter_number integer not null,
  title        text not null,
  description  text default '',
  duration_mins integer default 15,
  objectives   text[] default '{}',
  video_url    text default '',
  slide_url    text default '',
  reflection_question text default '',
  published    boolean default true,
  created_at   timestamptz default now()
);

-- 7. ตารางข้อสอบ (Questions)
create table if not exists questions (
  id                   text primary key,
  chapter_number       integer not null,
  question_text        text not null,
  options              text[] not null,
  correct_option_index integer not null,
  difficulty           text default 'medium',
  test_type            text default 'pre_knowledge',
  explanation          text default '',
  created_at           timestamptz default now()
);

-- 8. ตารางประกาศ (Announcements)
create table if not exists announcements (
  id           text primary key,
  title        text not null,
  content      text not null,
  target_class text default 'ทั้งหมด',
  created_at   timestamptz default now()
);

-- ══ เปิด Row Level Security (RLS) & Policies ══
alter table students enable row level security;
alter table test_results enable row level security;
alter table game_progress enable row level security;
alter table survey_responses enable row level security;
alter table quest_progress enable row level security;
alter table lessons enable row level security;
alter table questions enable row level security;
alter table announcements enable row level security;

-- Policy: อ่าน-เขียนได้แบบสมบูรณ์
drop policy if exists "allow all students" on students;
create policy "allow all students" on students for all using (true) with check (true);

drop policy if exists "allow all test_results" on test_results;
create policy "allow all test_results" on test_results for all using (true) with check (true);

drop policy if exists "allow all game_progress" on game_progress;
create policy "allow all game_progress" on game_progress for all using (true) with check (true);

drop policy if exists "allow all survey_responses" on survey_responses;
create policy "allow all survey_responses" on survey_responses for all using (true) with check (true);

drop policy if exists "allow all quest_progress" on quest_progress;
create policy "allow all quest_progress" on quest_progress for all using (true) with check (true);

drop policy if exists "allow all lessons" on lessons;
create policy "allow all lessons" on lessons for all using (true) with check (true);

drop policy if exists "allow all questions" on questions;
create policy "allow all questions" on questions for all using (true) with check (true);

drop policy if exists "allow all announcements" on announcements;
create policy "allow all announcements" on announcements for all using (true) with check (true);
