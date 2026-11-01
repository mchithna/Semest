-- Classification schemes.
-- Safe to re-run. Links a grade scale only while classification_scheme_id is still empty.
-- Function bodies match supabase/schema.sql.
-- ─────────────────────────────────────────────────
-- CLASSIFICATION SCHEMES
-- Class cuts live here, separate from letter-grade points.
-- Existing databases: this block is safe to re-run.
-- It does not rewrite module rows. A scale is linked only
-- while its classification_scheme_id is still empty.
-- ─────────────────────────────────────────────────
create table if not exists classification_schemes (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete cascade,
  label         text not null,
  is_system     boolean not null default false,
  applies_up_to numeric,
  bands         jsonb not null,
  created_at    timestamptz not null default now(),
  constraint classification_schemes_owner
    check ((is_system = true and user_id is null) or (is_system = false and user_id is not null)),
  constraint classification_schemes_bands_array
    check (jsonb_typeof(bands) = 'array' and jsonb_array_length(bands) > 0),
  constraint classification_schemes_applies_up_to
    check (applies_up_to is null or applies_up_to > 0)
);

create unique index if not exists unique_system_classification_label
  on classification_schemes (label) where is_system = true;

create index if not exists classification_schemes_user_id_idx
  on classification_schemes (user_id);

alter table classification_schemes enable row level security;

drop policy if exists "Anyone can read system classifications" on classification_schemes;
create policy "Anyone can read system classifications"
  on classification_schemes for select
  using (is_system = true);

drop policy if exists "Users manage own classifications" on classification_schemes;
create policy "Users manage own classifications"
  on classification_schemes for all
  using ((select auth.uid()) = user_id and is_system = false)
  with check ((select auth.uid()) = user_id and is_system = false);

insert into classification_schemes (user_id, label, is_system, applies_up_to, bands)
values (
  null,
  'Sri Lankan honors',
  true,
  4.5,
  '[
    {"id":"pass","label":"Pass","min":2,"max":3,"tone":"pass"},
    {"id":"second-lower","label":"Second lower","min":3,"max":3.3,"tone":"second-lower"},
    {"id":"second-upper","label":"Second upper","min":3.3,"max":3.7,"tone":"second-upper"},
    {"id":"first","label":"First","min":3.7,"max":4,"tone":"first"}
  ]'::jsonb
)
on conflict (label) where is_system = true do nothing;

alter table grade_scales
  add column if not exists classification_scheme_id uuid references classification_schemes(id) on delete set null;

create index if not exists grade_scales_classification_scheme_id_idx
  on grade_scales (classification_scheme_id);

update grade_scales gs
set classification_scheme_id = scheme.id
from classification_schemes scheme
where scheme.is_system = true
  and scheme.label = 'Sri Lankan honors'
  and gs.classification_scheme_id is null
  and scheme.applies_up_to is not null
  and jsonb_typeof(gs.grades) = 'array'
  and jsonb_array_length(gs.grades) > 0
  and (
    select coalesce(max((elem->>'points')::numeric), 0)
    from jsonb_array_elements(gs.grades) elem
  ) <= scheme.applies_up_to;

update presets p
set scale_snapshot = p.scale_snapshot || jsonb_build_object(
  'classification_scheme_id', gs.classification_scheme_id,
  'classification_bands', cs.bands
)
from grade_scales gs
left join classification_schemes cs on cs.id = gs.classification_scheme_id
where p.grade_scale_id = gs.id
  and p.scale_snapshot is not null
  and not (p.scale_snapshot ? 'classification_bands');

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

  select d.grade_scale_id, jsonb_build_object(
    'label', gs.label,
    'grades', gs.grades,
    'classification_scheme_id', gs.classification_scheme_id,
    'classification_bands', cs.bands
  )
  into v_scale_id, v_scale_snap
  from degrees d
  left join grade_scales gs on gs.id = d.grade_scale_id
  left join classification_schemes cs on cs.id = gs.classification_scheme_id
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
  v_scheme_id       uuid;
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
    v_scheme_id := null;
    if coalesce(v_preset.scale_snapshot->>'classification_scheme_id', '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
      select cs.id into v_scheme_id
      from classification_schemes cs
      where cs.id = (v_preset.scale_snapshot->>'classification_scheme_id')::uuid
        and cs.is_system = true;
    end if;

    if v_scheme_id is null
       and jsonb_typeof(v_preset.scale_snapshot->'classification_bands') = 'array'
       and jsonb_array_length(v_preset.scale_snapshot->'classification_bands') > 0 then
      insert into classification_schemes (user_id, label, is_system, applies_up_to, bands)
      values (
        auth.uid(),
        coalesce(nullif(v_preset.scale_snapshot->>'label', ''), 'Custom') || ' classes',
        false,
        null,
        v_preset.scale_snapshot->'classification_bands'
      )
      returning id into v_scheme_id;
    end if;

    insert into grade_scales (user_id, label, is_system, grades, classification_scheme_id)
    values (
      auth.uid(),
      (v_preset.scale_snapshot->>'label') || ' (from preset ' || p_preset_code || ')',
      false,
      v_preset.scale_snapshot->'grades',
      v_scheme_id
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
    if v_scale_id is not null then
      update degrees set grade_scale_id = v_scale_id where id = v_degree_id;
    end if;
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

  select d.grade_scale_id, jsonb_build_object(
    'label', gs.label,
    'grades', gs.grades,
    'classification_scheme_id', gs.classification_scheme_id,
    'classification_bands', cs.bands
  )
  into v_scale_id, v_scale_snap
  from degrees d
  left join grade_scales gs on gs.id = d.grade_scale_id
  left join classification_schemes cs on cs.id = gs.classification_scheme_id
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
                  (select jsonb_build_object(
                     'label', gs.label,
                     'grades', gs.grades,
                     'classification_scheme_id', gs.classification_scheme_id,
                     'classification_bands', cs.bands
                   )
                   from grade_scales gs
                   left join classification_schemes cs on cs.id = gs.classification_scheme_id
                   where gs.id = p.grade_scale_id),
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

