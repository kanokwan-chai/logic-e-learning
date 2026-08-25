-- ══════════════════════════════════════════════════════════
-- Logic E-Learning — Supabase Schema Setup
-- วาง SQL นี้ใน Supabase > SQL Editor > New Query > Run
-- ══════════════════════════════════════════════════════════

-- 1. ตารางบทเรียน (Lessons)
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

-- 2. ตารางข้อสอบ (Questions)
create table if not exists questions (
  id                   text primary key,
  chapter_number       integer not null,
  question_text        text not null,
  options              text[] not null,
  correct_option_index integer not null,
  difficulty           text default 'medium',
  test_type            text default 'pre_knowledge', -- 'pre_knowledge', 'pre_skill', 'post_knowledge', 'post_skill'
  explanation          text default '',
  created_at           timestamptz default now()
);

-- 3. ตารางโจทย์ Lab (Labs)
create table if not exists labs (
  id            text primary key,
  lab_code      text not null,
  title         text not null,
  module_type   text default 'scenario',
  difficulty    text default 'easy',
  scenario_text text not null,
  options       text[] not null,
  correct_index integer not null,
  explanation   text default '',
  created_at    timestamptz default now()
);

-- 4. ตารางประกาศ (Announcements)
create table if not exists announcements (
  id           text primary key,
  title        text not null,
  content      text not null,
  target_class text default 'ทั้งหมด',
  created_at   timestamptz default now()
);

-- 5. ตารางนักเรียน (Students)
create table if not exists students (
  id         text primary key,
  first_name text not null,
  last_name  text not null,
  number     integer not null,
  class_name text not null,
  created_at timestamptz default now()
);

-- 6. ตารางความก้าวหน้า (Student Progress)
create table if not exists student_progress (
  id                   text primary key default gen_random_uuid()::text,
  student_id           text references students(id) on delete cascade,
  completed_lessons    text[] default '{}',
  pre_knowledge_score        integer,
  pre_knowledge_total        integer,
  pre_knowledge_completed_at timestamptz,
  pre_skill_score            integer,
  pre_skill_total            integer,
  pre_skill_completed_at     timestamptz,
  post_knowledge_score       integer,
  post_knowledge_total       integer,
  post_knowledge_completed_at timestamptz,
  post_skill_score           integer,
  post_skill_total           integer,
  post_skill_completed_at    timestamptz,
  lab_completed        boolean default false,
  game_completed       boolean default false,
  updated_at           timestamptz default now()
);

-- ══ เปิด Row Level Security (RLS) ══
alter table lessons enable row level security;
alter table questions enable row level security;
alter table labs enable row level security;
alter table announcements enable row level security;
alter table students enable row level security;
alter table student_progress enable row level security;

-- ══ Policy: ให้ anon อ่าน-เขียนได้ทุกตาราง (ปรับได้ภายหลัง) ══
create policy "allow all" on lessons for all using (true) with check (true);
create policy "allow all" on questions for all using (true) with check (true);
create policy "allow all" on labs for all using (true) with check (true);
create policy "allow all" on announcements for all using (true) with check (true);
create policy "allow all" on students for all using (true) with check (true);
create policy "allow all" on student_progress for all using (true) with check (true);

-- ----------------------------------------------------------
-- MIGRATION SCRIPT (???????????????????????????????????????????)
-- ----------------------------------------------------------

alter table questions add column if not exists test_type text default 'pre_knowledge';

alter table student_progress add column if not exists pre_knowledge_score integer;
alter table student_progress add column if not exists pre_knowledge_total integer;
alter table student_progress add column if not exists pre_knowledge_completed_at timestamptz;

alter table student_progress add column if not exists pre_skill_score integer;
alter table student_progress add column if not exists pre_skill_total integer;
alter table student_progress add column if not exists pre_skill_completed_at timestamptz;

alter table student_progress add column if not exists post_knowledge_score integer;
alter table student_progress add column if not exists post_knowledge_total integer;
alter table student_progress add column if not exists post_knowledge_completed_at timestamptz;

alter table student_progress add column if not exists post_skill_score integer;
alter table student_progress add column if not exists post_skill_total integer;
alter table student_progress add column if not exists post_skill_completed_at timestamptz;

-- (Optional) ?????????????????
-- alter table student_progress drop column pretest_score, drop column pretest_total, drop column pretest_completed_at, drop column posttest_score, drop column posttest_total, drop column posttest_completed_at;

