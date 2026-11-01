-- Input length limits. Numbers match src/lib/limits.ts.
-- Safe to re-run. Caps are maxima only, so existing short rows stay valid.
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

  if char_length(coalesce(p_title, '')) > 80 then
    raise exception 'Semester title must be 80 characters or fewer';
  end if;
  if char_length(coalesce(p_term, '')) > 40 then
    raise exception 'Term must be 40 characters or fewer';
  end if;
  if jsonb_array_length(coalesce(p_modules, '[]'::jsonb)) > 60 then
    raise exception 'A semester can have at most 60 modules';
  end if;
  if exists (
    select 1
    from jsonb_array_elements(coalesce(p_modules, '[]'::jsonb)) elem
    where char_length(coalesce(elem->>'name', '')) > 120
       or char_length(coalesce(elem->>'grade', '')) > 32
  ) then
    raise exception 'Module name must be 120 characters or fewer and grade must be 32 characters or fewer';
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
       or (elem->>'credits')::numeric > 999.9
  ) then
    raise exception 'Credits must be greater than 0 and at most 999.9';
  end if;

  declare
    v_keep uuid[] := '{}';
    v_mod_id uuid;
    v_retake uuid;
    v_elem jsonb;
    v_ord int;
  begin
    delete from modules
    where semester_id = v_semester_id
      and id not in (
        select (elem->>'id')::uuid
        from jsonb_array_elements(coalesce(p_modules, '[]'::jsonb)) elem
        where coalesce(elem->>'id', '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      );

    for v_elem, v_ord in
      select elem, ord
      from jsonb_array_elements(coalesce(p_modules, '[]'::jsonb)) with ordinality as t(elem, ord)
    loop
      v_mod_id := null;
      if coalesce(v_elem->>'id', '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
        update modules
        set
          name = coalesce(nullif(btrim(v_elem->>'name'), ''), 'Untitled Module'),
          credits = (v_elem->>'credits')::numeric,
          grade = coalesce(v_elem->>'grade', ''),
          position = (v_ord - 1)::int
        where id = (v_elem->>'id')::uuid
          and semester_id = v_semester_id
          and user_id = auth.uid()
        returning id into v_mod_id;
      end if;

      if v_mod_id is null then
        insert into modules (semester_id, user_id, name, credits, grade, position)
        values (
          v_semester_id,
          auth.uid(),
          coalesce(nullif(btrim(v_elem->>'name'), ''), 'Untitled Module'),
          (v_elem->>'credits')::numeric,
          coalesce(v_elem->>'grade', ''),
          (v_ord - 1)::int
        )
        returning id into v_mod_id;
      end if;

      v_keep := v_keep || v_mod_id;
      v_retake := null;
      if coalesce(v_elem->>'retakesModuleId', '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
        v_retake := (v_elem->>'retakesModuleId')::uuid;
      end if;
      if v_retake is not null and exists (
        select 1
        from modules earlier
        join semesters sem on sem.id = earlier.semester_id
        where earlier.id = v_retake
          and earlier.user_id = auth.uid()
          and sem.degree_id = p_degree_id
          and earlier.id <> v_mod_id
      ) then
        update modules set retakes_module_id = v_retake where id = v_mod_id;
      else
        update modules set retakes_module_id = null where id = v_mod_id;
      end if;
    end loop;

    delete from modules
    where semester_id = v_semester_id
      and not (id = any(v_keep));
  end;

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
          'retakes_module_id', m.retakes_module_id,
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

-- ─────────────────────────────────────────────────
-- INPUT LENGTH LIMITS
-- Numbers match src/lib/limits.ts. Existing projects: run supabase/input_limits.sql.
-- Caps are maxima only, so empty descriptions and short existing rows stay valid.
-- ─────────────────────────────────────────────────
create or replace function grade_list_within_limits(grades jsonb)
returns boolean
language sql
immutable
set search_path = public
as $$
  select
    jsonb_typeof(grades) = 'array'
    and jsonb_array_length(grades) between 1 and 40
    and not exists (
      select 1
      from jsonb_array_elements(grades) elem
      where char_length(coalesce(elem->>'grade', '')) < 1
         or char_length(coalesce(elem->>'grade', '')) > 32
         or (elem->>'points') is null
         or (elem->>'points')::numeric < 0
         or (elem->>'points')::numeric > 100
    );
$$;

alter table profiles drop constraint if exists profiles_display_name_length;
alter table profiles add constraint profiles_display_name_length
  check (display_name is null or char_length(display_name) <= 80);

alter table degrees drop constraint if exists degrees_title_length;
alter table degrees add constraint degrees_title_length
  check (char_length(title) <= 120);

alter table degrees drop constraint if exists degrees_institution_length;
alter table degrees add constraint degrees_institution_length
  check (institution is null or char_length(institution) <= 120);

alter table semesters drop constraint if exists semesters_title_length;
alter table semesters add constraint semesters_title_length
  check (char_length(title) <= 80);

alter table semesters drop constraint if exists semesters_term_length;
alter table semesters add constraint semesters_term_length
  check (term is null or char_length(term) <= 40);

alter table modules drop constraint if exists modules_name_length;
alter table modules add constraint modules_name_length
  check (char_length(name) <= 120);

alter table modules drop constraint if exists modules_grade_length;
alter table modules add constraint modules_grade_length
  check (char_length(grade) <= 32);

alter table presets drop constraint if exists presets_title_length;
alter table presets add constraint presets_title_length
  check (char_length(title) <= 120);

alter table presets drop constraint if exists presets_description_length;
alter table presets add constraint presets_description_length
  check (description is null or char_length(description) <= 500);

alter table presets drop constraint if exists presets_institution_length;
alter table presets add constraint presets_institution_length
  check (institution is null or char_length(institution) <= 120);

alter table preset_semesters drop constraint if exists preset_semesters_title_length;
alter table preset_semesters add constraint preset_semesters_title_length
  check (char_length(title) <= 80);

alter table preset_modules drop constraint if exists preset_modules_name_length;
alter table preset_modules add constraint preset_modules_name_length
  check (char_length(name) <= 120);

alter table grade_scales drop constraint if exists grade_scales_label_length;
alter table grade_scales add constraint grade_scales_label_length
  check (char_length(label) <= 80);

alter table grade_scales drop constraint if exists grade_scales_grades_shape;
alter table grade_scales add constraint grade_scales_grades_shape
  check (grade_list_within_limits(grades));

create or replace function enforce_module_count()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if (
    select count(*)
    from modules
    where semester_id = new.semester_id
      and id is distinct from new.id
  ) >= 60 then
    raise exception 'A semester can have at most 60 modules';
  end if;
  return new;
end;
$$;

drop trigger if exists modules_limit_per_semester on modules;
create trigger modules_limit_per_semester
  before insert or update of semester_id on modules
  for each row
  execute function enforce_module_count();
