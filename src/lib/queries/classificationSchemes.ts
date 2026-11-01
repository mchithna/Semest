import { parseClassBands, type Band } from '../bands'
import { supabase } from '../supabase'

export type ClassificationScheme = {
  id: string
  user_id: string | null
  label: string
  is_system: boolean
  applies_up_to: number | null
  bands: Band[]
  created_at: string
}

type SchemeRow = Omit<ClassificationScheme, 'applies_up_to' | 'bands'> & {
  applies_up_to: number | string | null
  bands: unknown
}

function asScheme(row: SchemeRow): ClassificationScheme {
  return {
    ...row,
    applies_up_to: row.applies_up_to == null || row.applies_up_to === '' ? null : Number(row.applies_up_to),
    bands: parseClassBands(row.bands),
  }
}

/** System schemes are world-readable. User schemes stay on the owning account. */
export async function getSystemClassificationSchemes(): Promise<ClassificationScheme[]> {
  const { data, error } = await supabase
    .from('classification_schemes')
    .select('*')
    .eq('is_system', true)
    .order('applies_up_to', { ascending: true })

  if (error) throw error
  return ((data ?? []) as SchemeRow[]).map(asScheme)
}

/**
 * Picks the narrowest system scheme whose `applies_up_to` still covers the scale.
 * The cutoff lives on the scheme row, so a new scale can be linked without a code constant.
 */
export function matchingScheme<T extends { is_system: boolean; applies_up_to: number | null }>(
  schemes: T[],
  grades: { points: number }[],
): T | null {
  const points = grades.map((row) => Number(row.points)).filter((value) => Number.isFinite(value))
  if (points.length === 0) return null
  const max = Math.max(...points)
  const matches = schemes.filter((scheme) => {
    if (!scheme.is_system || scheme.applies_up_to == null) return false
    return max <= Number(scheme.applies_up_to)
  })
  matches.sort((a, b) => Number(a.applies_up_to) - Number(b.applies_up_to))
  return matches[0] ?? null
}
