import { getSystemClassificationSchemes, matchingScheme, type ClassificationScheme } from './classificationSchemes'
import { supabase } from '../supabase'

export type GradeRow = {
  grade: string
  points: number
}

export type GradeScale = {
  id: string
  user_id: string | null
  label: string
  is_system: boolean
  grades: GradeRow[]
  classification_scheme_id?: string | null
  classification_scheme?: ClassificationScheme | null
  /** Present on preset snapshots taken before the scheme relation is joined. */
  classification_bands?: unknown
  created_at: string
}

export const GRADE_SCALE_SELECT = `
  *,
  classification_scheme:classification_schemes(*)
`

export async function getGradeScales(): Promise<GradeScale[]> {
  const { data, error } = await supabase
    .from('grade_scales')
    .select(GRADE_SCALE_SELECT)
    .order('is_system', { ascending: false }) // system scales first
    .order('created_at', { ascending: true })

  if (error) throw error
  return data as GradeScale[]
}

async function schemeIdForGrades(grades: GradeRow[], currentSchemeId?: string | null): Promise<string | null> {
  if (currentSchemeId) {
    const { data, error } = await supabase
      .from('classification_schemes')
      .select('is_system')
      .eq('id', currentSchemeId)
      .maybeSingle()
    if (error) throw error
    if (data && data.is_system === false) return currentSchemeId
  }

  const schemes = await getSystemClassificationSchemes()
  return matchingScheme(schemes, grades)?.id ?? null
}

export async function createGradeScale(label: string, grades: GradeRow[]): Promise<GradeScale> {
  const { data: userData, error: authError } = await supabase.auth.getUser()
  if (authError) throw authError

  const classificationSchemeId = await schemeIdForGrades(grades)
  const { data, error } = await supabase
    .from('grade_scales')
    .insert({
      user_id: userData.user.id,
      label,
      is_system: false,
      grades,
      classification_scheme_id: classificationSchemeId,
    })
    .select(GRADE_SCALE_SELECT)
    .single()

  if (error) throw error
  return data as GradeScale
}

export async function updateGradeScale(id: string, label: string, grades: GradeRow[]): Promise<GradeScale> {
  const { data: existing, error: existingError } = await supabase
    .from('grade_scales')
    .select('classification_scheme_id')
    .eq('id', id)
    .single()
  if (existingError) throw existingError

  const classificationSchemeId = await schemeIdForGrades(grades, existing.classification_scheme_id)
  const { data, error } = await supabase
    .from('grade_scales')
    .update({ label, grades, classification_scheme_id: classificationSchemeId })
    .eq('id', id)
    .select(GRADE_SCALE_SELECT)
    .single()

  if (error) throw error
  return data as GradeScale
}

export async function deleteGradeScale(id: string): Promise<void> {
  const { error } = await supabase
    .from('grade_scales')
    .delete()
    .eq('id', id)

  if (error) throw error
}
