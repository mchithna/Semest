-- ─────────────────────────────────────────────────
-- PROFILES
-- ─────────────────────────────────────────────────
create table if not exists profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  display_name    text,
  onboarded_at    timestamptz,
  created_at      timestamptz default now()
);

-- ─────────────────────────────────────────────────
-- GRADE SCALES
-- ─────────────────────────────────────────────────
create table if not exists grade_scales (
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
create table if not exists degrees (
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
create table if not exists semesters (
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
create table if not exists modules (
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
create table if not exists presets (
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

create table if not exists preset_semesters (
  id          uuid primary key default gen_random_uuid(),
  preset_id   uuid not null references presets(id) on delete cascade,
  title       text not null,
  sem_index   int not null,
  position    int not null default 0
);

create table if not exists preset_modules (
  id                  uuid primary key default gen_random_uuid(),
  preset_semester_id  uuid not null references preset_semesters(id) on delete cascade,
  name                text not null,
  credits             numeric(4,1) not null,
  position            int not null default 0
);

-- ─────────────────────────────────────────────────
-- FUNCTIONS
-- ─────────────────────────────────────────────────

-- Auto-create profile on sign-up
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, split_part(new.email, '@', 1))
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Shared updated_at updater
create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Generates a unique 6-char uppercase alphanumeric code.
-- Excludes I, O, 0, 1 to avoid visual confusion.
-- Call via supabase.rpc('generate_preset_code') from the app.
create or replace function generate_preset_code()
returns text language plpgsql security definer set search_path = public as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  new_code  text;
  tries int := 0;
begin
  loop
    new_code := '';
    for i in 1..6 loop
      new_code := new_code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    end loop;
    exit when not exists (select 1 from presets where presets.code = new_code);
    tries := tries + 1;
    if tries > 10 then
      raise exception 'Could not generate unique preset code after 10 attempts';
    end if;
  end loop;
  return new_code;
end;
$$;

-- ─────────────────────────────────────────────────
-- TRIGGERS
-- ─────────────────────────────────────────────────
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

drop trigger if exists touch_updated_at_degrees on degrees;
create trigger touch_updated_at_degrees
  before update on degrees
  for each row execute function touch_updated_at();

drop trigger if exists touch_updated_at_semesters on semesters;
create trigger touch_updated_at_semesters
  before update on semesters
  for each row execute function touch_updated_at();

drop trigger if exists touch_updated_at_presets on presets;
create trigger touch_updated_at_presets
  before update on presets
  for each row execute function touch_updated_at();

-- ─────────────────────────────────────────────────
-- RLS — PROFILES
-- ─────────────────────────────────────────────────
alter table profiles enable row level security;

drop policy if exists "Users manage own profile" on profiles;
create policy "Users manage own profile"
  on profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ─────────────────────────────────────────────────
-- RLS — GRADE SCALES
-- ─────────────────────────────────────────────────
alter table grade_scales enable row level security;

drop policy if exists "Anyone can read system scales" on grade_scales;
create policy "Anyone can read system scales"
  on grade_scales for select
  using (is_system = true);

drop policy if exists "Users manage own scales" on grade_scales;
create policy "Users manage own scales"
  on grade_scales for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────
-- SEED — SYSTEM GRADE SCALES
-- ─────────────────────────────────────────────────
insert into grade_scales (user_id, label, is_system, grades) values
(null, 'Standard 4.0', true, '[
  {"grade":"A+","points":4.0},{"grade":"A","points":4.0},{"grade":"A-","points":3.7},
  {"grade":"B+","points":3.3},{"grade":"B","points":3.0},{"grade":"B-","points":2.7},
  {"grade":"C+","points":2.3},{"grade":"C","points":2.0},{"grade":"C-","points":1.7},
  {"grade":"D+","points":1.3},{"grade":"D","points":1.0},{"grade":"F","points":0.0}
]'::jsonb),
(null, 'Sri Lankan UGC (Z-Score)', true, '[
  {"grade":"A+","points":4.2},{"grade":"A","points":4.0},{"grade":"A-","points":3.7},
  {"grade":"B+","points":3.3},{"grade":"B","points":3.0},{"grade":"B-","points":2.7},
  {"grade":"C+","points":2.3},{"grade":"C","points":2.0},{"grade":"C-","points":1.7},
  {"grade":"D+","points":1.3},{"grade":"D","points":1.0},{"grade":"F","points":0.0}
]'::jsonb)
on conflict do nothing;

-- ─────────────────────────────────────────────────
-- RLS — DEGREES
-- ─────────────────────────────────────────────────
alter table degrees enable row level security;

drop policy if exists "Users manage own degrees" on degrees;
create policy "Users manage own degrees"
  on degrees for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────
-- RLS — SEMESTERS
-- ─────────────────────────────────────────────────
alter table semesters enable row level security;

drop policy if exists "Users manage own semesters" on semesters;
create policy "Users manage own semesters"
  on semesters for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────
-- RLS — MODULES
-- ─────────────────────────────────────────────────
alter table modules enable row level security;

drop policy if exists "Users manage own modules" on modules;
create policy "Users manage own modules"
  on modules for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────
-- RLS — PRESETS
-- ─────────────────────────────────────────────────
alter table presets enable row level security;
alter table preset_semesters enable row level security;
alter table preset_modules enable row level security;

drop policy if exists "Public presets are readable" on presets;
create policy "Public presets are readable"
  on presets for select using (is_public = true);

drop policy if exists "Creators manage own presets" on presets;
create policy "Creators manage own presets"
  on presets for all
  using (auth.uid() = creator_id)
  with check (auth.uid() = creator_id);

drop policy if exists "Anyone can read public preset semesters" on preset_semesters;
create policy "Anyone can read public preset semesters"
  on preset_semesters for select
  using (
    exists (
      select 1 from presets p
      where p.id = preset_semesters.preset_id and p.is_public = true
    )
  );

drop policy if exists "Creators manage own preset semesters" on preset_semesters;
create policy "Creators manage own preset semesters"
  on preset_semesters for all
  using (
    exists (
      select 1 from presets p
      where p.id = preset_semesters.preset_id and p.creator_id = auth.uid()
    )
  );

drop policy if exists "Anyone can read public preset modules" on preset_modules;
create policy "Anyone can read public preset modules"
  on preset_modules for select
  using (
    exists (
      select 1 from preset_semesters ps
      join presets p on p.id = ps.preset_id
      where ps.id = preset_modules.preset_semester_id and p.is_public = true
    )
  );

drop policy if exists "Creators manage own preset modules" on preset_modules;
create policy "Creators manage own preset modules"
  on preset_modules for all
  using (
    exists (
      select 1 from preset_semesters ps
      join presets p on p.id = ps.preset_id
      where ps.id = preset_modules.preset_semester_id and p.creator_id = auth.uid()
    )
  );
