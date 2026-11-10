import { describe, expect, it } from 'vitest'
import schemaSql from '../../supabase/schema.sql?raw'
import { SRI_LANKAN_HONORS_BANDS } from './classBands.fixture'
import { classBandsOf, withPresetBands } from './bands'

function functionBody(name: string): string {
  const start = schemaSql.indexOf(`create or replace function ${name}`)
  const end = schemaSql.indexOf('\n$$;', start)
  return schemaSql.slice(start, end)
}

describe('preset degree bands', () => {
  it('saves the degree copy when a preset is published or synced', () => {
    expect(functionBody('publish_preset')).toContain("'classification_bands', d.class_bands")
    expect(functionBody('sync_preset')).toContain("'classification_bands', d.class_bands")
  })

  it('shows the saved copy when a preset is opened', () => {
    expect(functionBody('get_preset_with_scale')).toContain(
      "coalesce(p.scale_snapshot->'classification_bands', cs.bands)",
    )
  })

  it('copies the bands onto a new degree and leaves an existing degree alone', () => {
    const body = functionBody('clone_preset')
    expect(body).toContain('insert into degrees (user_id, title, institution, grade_scale_id, class_bands)')
    expect(body).toContain('update degrees set grade_scale_id = v_scale_id where id = v_degree_id;')
    expect(body).not.toContain('update degrees set grade_scale_id = v_scale_id, class_bands')
  })

  it('lets the saved cuts win over the live shared scheme', () => {
    const merged = withPresetBands(
      { classification_scheme: { bands: SRI_LANKAN_HONORS_BANDS } },
      {
        classification_bands: [
          { id: 'merit', label: 'Merit', min: 2.5 },
          { id: 'first', label: 'First', min: 3.7 },
        ],
      },
    )
    expect(classBandsOf(merged).map((band) => band.label)).toEqual(['Merit', 'First'])
  })
})
