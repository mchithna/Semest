-- Each degree keeps its own copy of the class cuts.
-- Safe to re-run. Copies the scale's scheme only while class_bands is still empty.
-- A later change to the shared scheme does not move an existing degree.

alter table degrees add column if not exists class_bands jsonb;

update degrees d
set class_bands = copied.bands
from (
  select
    degree.id,
    (
      select jsonb_agg(
        jsonb_build_object(
          'id', band->>'id',
          'label', band->>'label',
          'min', (band->>'min')::numeric
        )
        order by (band->>'min')::numeric
      )
      from grade_scales gs
      join classification_schemes cs on cs.id = gs.classification_scheme_id
      cross join lateral jsonb_array_elements(cs.bands) as band
      where gs.id = degree.grade_scale_id
        and coalesce(band->>'id', '') <> ''
        and coalesce(band->>'label', '') <> ''
        and (band->>'min') ~ '^[0-9]+([.][0-9]+)?$'
    ) as bands
  from degrees degree
) copied
where d.id = copied.id
  and d.class_bands is null
  and copied.bands is not null;

update degrees
set class_bands = '[
  {"id":"pass","label":"Pass","min":2},
  {"id":"second-lower","label":"Second lower","min":3},
  {"id":"second-upper","label":"Second upper","min":3.3},
  {"id":"first","label":"First","min":3.7}
]'::jsonb
where class_bands is null;

alter table degrees alter column class_bands set default '[
  {"id":"pass","label":"Pass","min":2},
  {"id":"second-lower","label":"Second lower","min":3},
  {"id":"second-upper","label":"Second upper","min":3.3},
  {"id":"first","label":"First","min":3.7}
]'::jsonb;

alter table degrees alter column class_bands set not null;

alter table degrees drop constraint if exists degrees_class_bands_array;
alter table degrees add constraint degrees_class_bands_array
  check (jsonb_typeof(class_bands) = 'array' and jsonb_array_length(class_bands) > 0);
