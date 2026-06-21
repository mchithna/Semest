-- ─────────────────────────────────────────────────
-- PROFILES
-- ─────────────────────────────────────────────────
create table profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  display_name    text,
  onboarded_at    timestamptz,
  created_at      timestamptz default now()
);

-- ─────────────────────────────────────────────────
-- GRADE SCALES
-- ─────────────────────────────────────────────────
create table grade_scales (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade,
  label       text not null,
  is_system   boolean not null default false,
  grades      jsonb not null,   -- [{grade: "A+", points: 4.2}, ...]
  created_at  timestamptz default now()
);

-- ─────────────────────────────────────────────────
-- DEGREES
-- ─────────────────────────────────────────────────
create table degrees (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  title            text not null,
  institution      text,
  grade_scale_id   uuid references grade_scales(id) on delete set null,
  started_year     int,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- ─────────────────────────────────────────────────
-- SEMESTERS
-- ─────────────────────────────────────────────────
create table semesters (
  id          uuid primary key default gen_random_uuid(),
  degree_id   uuid not null references degrees(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  term        text,
  sem_index   int not null default 0,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ─────────────────────────────────────────────────
-- MODULES
-- ─────────────────────────────────────────────────
create table modules (
  id           uuid primary key default gen_random_uuid(),
  semester_id  uuid not null references semesters(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  name         text not null,
  credits      numeric(4,1) not null,
  grade        text not null,
  position     int not null default 0,
  created_at   timestamptz default now()
);

-- ─────────────────────────────────────────────────
-- PRESETS
-- ─────────────────────────────────────────────────
create table presets (
  id              uuid primary key default gen_random_uuid(),
  code            text unique not null,
  creator_id      uuid references auth.users(id) on delete set null,
  title           text not null,
  description     text,
  institution     text,
  grade_scale_id  uuid references grade_scales(id) on delete set null,
  is_public       boolean not null default true,
  use_count       int not null default 0,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create table preset_semesters (
  id          uuid primary key default gen_random_uuid(),
  preset_id   uuid not null references presets(id) on delete cascade,
  title       text not null,
  sem_index   int not null,
  position    int not null default 0
);

create table preset_modules (
  id                  uuid primary key default gen_random_uuid(),
  preset_semester_id  uuid not null references preset_semesters(id) on delete cascade,
  name                text not null,
  credits             numeric(4,1) not null,
  position            int not null default 0
);
