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
  scale_snapshot  jsonb,
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
-- UNIQUE CONSTRAINT FOR SYSTEM SCALES
-- ─────────────────────────────────────────────────
create unique index if not exists unique_system_scale_label on grade_scales (label) where is_system = true;

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
  using (auth.uid() = user_id and is_system = false)
  with check (auth.uid() = user_id and is_system = false);

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
(null, 'Sri Lankan UGC GPA', true, '[
  {"grade":"A+","points":4.2},{"grade":"A","points":4.0},{"grade":"A-","points":3.7},
  {"grade":"B+","points":3.3},{"grade":"B","points":3.0},{"grade":"B-","points":2.7},
  {"grade":"C+","points":2.3},{"grade":"C","points":2.0},{"grade":"C-","points":1.7},
  {"grade":"D+","points":1.3},{"grade":"D","points":1.0},{"grade":"F","points":0.0}
]'::jsonb)
on conflict (label) where is_system = true do nothing;

update grade_scales
set label = 'Sri Lankan UGC GPA'
where is_system = true and label = 'Sri Lankan UGC (Z-Score)';

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

-- ─────────────────────────────────────────────────
-- PRESET RPC FUNCTIONS
-- ─────────────────────────────────────────────────

-- Publish Preset
create or replace function publish_preset(
  p_degree_id   uuid,
  p_title       text,
  p_description text default null,
  p_institution text default null,
  p_is_public   boolean default true
)
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_code          text;
  v_preset_id     uuid;
  v_scale_snap    jsonb;
  v_scale_id      uuid;
  v_sem_record    record;
  v_new_sem_id    uuid;
begin
  if not exists (select 1 from degrees where id = p_degree_id and user_id = auth.uid()) then
    raise exception 'Access denied';
  end if;

  select d.grade_scale_id, jsonb_build_object('label', gs.label, 'grades', gs.grades)
  into v_scale_id, v_scale_snap
  from degrees d
  left join grade_scales gs on gs.id = d.grade_scale_id
  where d.id = p_degree_id;

  v_code := generate_preset_code();

  insert into presets (
    code, creator_id, title, description, institution,
    grade_scale_id, scale_snapshot, is_public
  ) values (
    v_code, auth.uid(), p_title, p_description, p_institution,
    v_scale_id, v_scale_snap, p_is_public
  )
  returning id into v_preset_id;

  for v_sem_record in select * from semesters where degree_id = p_degree_id order by sem_index loop
    insert into preset_semesters (preset_id, title, sem_index, position)
    values (v_preset_id, v_sem_record.title, v_sem_record.sem_index, v_sem_record.sem_index)
    returning id into v_new_sem_id;

    insert into preset_modules (preset_semester_id, name, credits, position)
    select v_new_sem_id, name, credits, position
    from modules
    where semester_id = v_sem_record.id
    order by position;
  end loop;

  return v_code;
end;
$$;

-- Clone Preset
create or replace function clone_preset(
  p_preset_code       text,
  p_target_degree_id  uuid default null,
  p_degree_title      text default null
)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_preset          record;
  v_degree_id       uuid;
  v_scale_id        uuid;
  v_next_sem_index  int;
  v_sem_record      record;
  v_new_sem_id      uuid;
begin
  select * into v_preset from presets
  where code = p_preset_code and (is_public = true or creator_id = auth.uid());

  if not found then
    raise exception 'Preset not found or not accessible';
  end if;

  if v_preset.grade_scale_id is not null and exists (
    select 1 from grade_scales where id = v_preset.grade_scale_id and is_system = true
  ) then
    v_scale_id := v_preset.grade_scale_id;
  elsif v_preset.scale_snapshot is not null then
    insert into grade_scales (user_id, label, is_system, grades)
    values (
      auth.uid(),
      (v_preset.scale_snapshot->>'label') || ' (from preset ' || p_preset_code || ')',
      false,
      v_preset.scale_snapshot->'grades'
    )
    returning id into v_scale_id;
  else
    v_scale_id := null;
  end if;

  if p_target_degree_id is null then
    insert into degrees (user_id, title, institution, grade_scale_id)
    values (auth.uid(), coalesce(p_degree_title, v_preset.title), v_preset.institution, v_scale_id)
    returning id into v_degree_id;
    v_next_sem_index := 0;
  else
    if not exists (select 1 from degrees where id = p_target_degree_id and user_id = auth.uid()) then
      raise exception 'Target degree not found or access denied';
    end if;
    v_degree_id := p_target_degree_id;
    select coalesce(max(sem_index) + 1, 0) into v_next_sem_index
    from semesters where degree_id = v_degree_id;
  end if;

  for v_sem_record in select * from preset_semesters where preset_id = v_preset.id order by sem_index loop
    insert into semesters (degree_id, user_id, title, sem_index)
    values (v_degree_id, auth.uid(), v_sem_record.title, v_next_sem_index)
    returning id into v_new_sem_id;

    insert into modules (semester_id, user_id, name, credits, grade, position)
    select v_new_sem_id, auth.uid(), name, credits, 'Not graded', position
    from preset_modules
    where preset_semester_id = v_sem_record.id
    order by position;

    v_next_sem_index := v_next_sem_index + 1;
  end loop;

  update presets set use_count = use_count + 1 where id = v_preset.id;
  return v_degree_id;
end;
$$;

-- Sync Preset
create or replace function sync_preset(
  p_preset_id uuid,
  p_degree_id uuid
)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_scale_snap  jsonb;
  v_scale_id    uuid;
  v_sem_record  record;
  v_new_sem_id  uuid;
begin
  if not exists (select 1 from presets where id = p_preset_id and creator_id = auth.uid()) then
    raise exception 'Preset access denied';
  end if;
  if not exists (select 1 from degrees where id = p_degree_id and user_id = auth.uid()) then
    raise exception 'Degree access denied';
  end if;

  select d.grade_scale_id, jsonb_build_object('label', gs.label, 'grades', gs.grades)
  into v_scale_id, v_scale_snap
  from degrees d
  left join grade_scales gs on gs.id = d.grade_scale_id
  where d.id = p_degree_id;

  delete from preset_semesters where preset_id = p_preset_id;

  for v_sem_record in select * from semesters where degree_id = p_degree_id order by sem_index loop
    insert into preset_semesters (preset_id, title, sem_index, position)
    values (p_preset_id, v_sem_record.title, v_sem_record.sem_index, v_sem_record.sem_index)
    returning id into v_new_sem_id;

    insert into preset_modules (preset_semester_id, name, credits, position)
    select v_new_sem_id, name, credits, position
    from modules
    where semester_id = v_sem_record.id
    order by position;
  end loop;

  update presets
  set grade_scale_id = v_scale_id, scale_snapshot = v_scale_snap, updated_at = now()
  where id = p_preset_id;
end;
$$;

-- Get Preset with Scale
create or replace function get_preset_with_scale(p_code text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_result jsonb;
begin
  select jsonb_build_object(
    'preset',   row_to_json(p),
    'scale',    coalesce(
                  (select jsonb_build_object('label', gs.label, 'grades', gs.grades)
                   from grade_scales gs where gs.id = p.grade_scale_id),
                  p.scale_snapshot
                ),
    'semesters', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id',       ps.id,
          'title',    ps.title,
          'sem_index', ps.sem_index,
          'modules',  coalesce((
            select jsonb_agg(
              jsonb_build_object('name', pm.name, 'credits', pm.credits, 'position', pm.position)
              order by pm.position
            )
            from preset_modules pm where pm.preset_semester_id = ps.id
          ), '[]'::jsonb)
        )
        order by ps.sem_index
      )
      from preset_semesters ps where ps.preset_id = p.id
    ), '[]'::jsonb)
  )
  into v_result
  from presets p
  where p.code = p_code and (p.is_public = true or p.creator_id = auth.uid());

  return v_result;
end;
$$;

-- ─────────────────────────────────────────────────
-- SAVE SEMESTER
-- Replaces a semester's modules in the same transaction as the semester write.
-- Existing projects: run this block in the Supabase SQL editor.
-- ─────────────────────────────────────────────────
create or replace function save_semester(
  p_degree_id   uuid,
  p_title       text,
  p_modules     jsonb,
  p_term        text default null,
  p_sem_index   int default null,
  p_semester_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_semester_id uuid;
  v_index       int;
  v_result      jsonb;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if p_modules is not null and jsonb_typeof(p_modules) <> 'array' then
    raise exception 'Modules must be an array';
  end if;

  if not exists (
    select 1 from degrees
    where id = p_degree_id and user_id = auth.uid()
  ) then
    raise exception 'Degree not found or access denied';
  end if;

  -- Serialize saves for one degree so two creates cannot take the same index.
  perform pg_advisory_xact_lock(hashtext('semest.save_semester'), hashtext(p_degree_id::text));

  if p_semester_id is null then
    if p_sem_index is null then
      select coalesce(max(sem_index) + 1, 0)
      into v_index
      from semesters
      where degree_id = p_degree_id;
    else
      v_index := p_sem_index;
    end if;

    insert into semesters (degree_id, user_id, title, term, sem_index)
    values (p_degree_id, auth.uid(), p_title, p_term, v_index)
    returning id into v_semester_id;
  else
    update semesters
    set
      title = p_title,
      term = p_term,
      sem_index = coalesce(p_sem_index, sem_index)
    where id = p_semester_id
      and user_id = auth.uid()
      and degree_id = p_degree_id
    returning id into v_semester_id;

    if v_semester_id is null then
      raise exception 'Semester not found or access denied';
    end if;
  end if;

  if exists (
    select 1
    from jsonb_array_elements(coalesce(p_modules, '[]'::jsonb)) elem
    where coalesce((elem->>'credits')::numeric, 0) <= 0
  ) then
    raise exception 'Credits must be greater than 0';
  end if;

  delete from modules where semester_id = v_semester_id;

  insert into modules (semester_id, user_id, name, credits, grade, position)
  select
    v_semester_id,
    auth.uid(),
    coalesce(nullif(btrim(elem->>'name'), ''), 'Untitled Module'),
    (elem->>'credits')::numeric,
    coalesce(elem->>'grade', ''),
    (ord - 1)::int
  from jsonb_array_elements(coalesce(p_modules, '[]'::jsonb)) with ordinality as t(elem, ord);

  select jsonb_build_object(
    'id', s.id,
    'degree_id', s.degree_id,
    'user_id', s.user_id,
    'title', s.title,
    'term', s.term,
    'sem_index', s.sem_index,
    'created_at', s.created_at,
    'updated_at', s.updated_at,
    'modules', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', m.id,
          'semester_id', m.semester_id,
          'user_id', m.user_id,
          'name', m.name,
          'credits', m.credits,
          'grade', m.grade,
          'position', m.position,
          'created_at', m.created_at
        )
        order by m.position
      )
      from modules m
      where m.semester_id = s.id
    ), '[]'::jsonb)
  )
  into v_result
  from semesters s
  where s.id = v_semester_id;

  return v_result;
end;
$$;

revoke all on function public.save_semester(uuid, text, jsonb, text, integer, uuid) from public;
revoke all on function public.save_semester(uuid, text, jsonb, text, integer, uuid) from anon;
grant execute on function public.save_semester(uuid, text, jsonb, text, integer, uuid) to authenticated;

-- ─────────────────────────────────────────────────
-- SAFETY
-- Renumber duplicate semester indexes, then lock the rules.
-- Existing projects: run this block in the Supabase SQL editor.
-- ─────────────────────────────────────────────────
update grade_scales
set is_system = false
where is_system = true and user_id is not null;

alter table grade_scales drop constraint if exists grade_scales_system_owner;
alter table grade_scales
  add constraint grade_scales_system_owner
  check ((is_system = true and user_id is null) or (is_system = false and user_id is not null));

update modules set credits = 0.5 where credits <= 0;
update preset_modules set credits = 0.5 where credits <= 0;

alter table modules drop constraint if exists modules_credits_positive;
alter table modules add constraint modules_credits_positive check (credits > 0);

alter table preset_modules drop constraint if exists preset_modules_credits_positive;
alter table preset_modules add constraint preset_modules_credits_positive check (credits > 0);

with ranked as (
  select
    id,
    (row_number() over (partition by degree_id order by sem_index, created_at, id) - 1) as new_index
  from semesters
)
update semesters s
set sem_index = ranked.new_index
from ranked
where s.id = ranked.id
  and s.sem_index is distinct from ranked.new_index;

create unique index if not exists semesters_degree_sem_index_unique
  on semesters (degree_id, sem_index);

revoke all on function public.generate_preset_code() from public;
revoke all on function public.generate_preset_code() from anon;
grant execute on function public.generate_preset_code() to authenticated;

revoke all on function public.publish_preset(uuid, text, text, text, boolean) from public;
revoke all on function public.publish_preset(uuid, text, text, text, boolean) from anon;
grant execute on function public.publish_preset(uuid, text, text, text, boolean) to authenticated;

revoke all on function public.clone_preset(text, uuid, text) from public;
revoke all on function public.clone_preset(text, uuid, text) from anon;
grant execute on function public.clone_preset(text, uuid, text) to authenticated;

revoke all on function public.sync_preset(uuid, uuid) from public;
revoke all on function public.sync_preset(uuid, uuid) from anon;
grant execute on function public.sync_preset(uuid, uuid) to authenticated;

revoke all on function public.get_preset_with_scale(text) from public;
grant execute on function public.get_preset_with_scale(text) to anon, authenticated;
