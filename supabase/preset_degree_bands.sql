-- Presets carry the degree's class cuts.
-- Publishing and syncing save degrees.class_bands. Opening a preset prefers that copy.
-- Cloning into a new degree copies the cuts. Cloning into an existing degree leaves its cuts alone.
-- Existing projects: run this file once. It replaces the four preset functions.

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

  if char_length(coalesce(p_title, '')) > 120 then
    raise exception 'Preset title must be 120 characters or fewer';
  end if;
  if char_length(coalesce(p_description, '')) > 500 then
    raise exception 'Description must be 500 characters or fewer';
  end if;
  if char_length(coalesce(p_institution, '')) > 120 then
    raise exception 'Institution must be 120 characters or fewer';
  end if;

  select d.grade_scale_id, jsonb_build_object(
    'label', gs.label,
    'grades', gs.grades,
    'classification_scheme_id', gs.classification_scheme_id,
    'classification_bands', d.class_bands
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
  v_class_bands     jsonb;
  v_next_sem_index  int;
  v_sem_record      record;
  v_new_sem_id      uuid;
begin
  select * into v_preset from presets
  where code = p_preset_code and (is_public = true or creator_id = auth.uid());

  if not found then
    raise exception 'Preset not found or not accessible';
  end if;

  if char_length(coalesce(p_degree_title, '')) > 120 then
    raise exception 'Degree title must be 120 characters or fewer';
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
      left((v_preset.scale_snapshot->>'label') || ' (from preset ' || p_preset_code || ')', 80),
      false,
      v_preset.scale_snapshot->'grades',
      v_scheme_id
    )
    returning id into v_scale_id;
  else
    v_scale_id := null;
  end if;

  select jsonb_agg(
    jsonb_build_object(
      'id', band->>'id',
      'label', band->>'label',
      'min', (band->>'min')::numeric
    )
    order by (band->>'min')::numeric
  )
  into v_class_bands
  from jsonb_array_elements(coalesce(v_preset.scale_snapshot->'classification_bands', '[]'::jsonb)) as band
  where coalesce(band->>'id', '') <> ''
    and coalesce(band->>'label', '') <> ''
    and (band->>'min') ~ '^[0-9]+([.][0-9]+)?$';

  if p_target_degree_id is null then
    if v_class_bands is null then
      insert into degrees (user_id, title, institution, grade_scale_id)
      values (auth.uid(), coalesce(p_degree_title, v_preset.title), v_preset.institution, v_scale_id)
      returning id into v_degree_id;
    else
      insert into degrees (user_id, title, institution, grade_scale_id, class_bands)
      values (auth.uid(), coalesce(p_degree_title, v_preset.title), v_preset.institution, v_scale_id, v_class_bands)
      returning id into v_degree_id;
    end if;
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
    'classification_bands', d.class_bands
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
                     'classification_bands', coalesce(p.scale_snapshot->'classification_bands', cs.bands)
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
