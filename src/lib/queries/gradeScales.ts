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
  created_at: string
}

export async function getGradeScales(): Promise<GradeScale[]> {
  const { data, error } = await supabase
    .from('grade_scales')
    .select('*')
    .order('is_system', { ascending: false }) // system scales first
    .order('created_at', { ascending: true })

  if (error) throw error
  return data as GradeScale[]
}

export async function createGradeScale(label: string, grades: GradeRow[]): Promise<GradeScale> {
  const { data: userData, error: authError } = await supabase.auth.getUser()
  if (authError) throw authError

  const { data, error } = await supabase
    .from('grade_scales')
    .insert({
      user_id: userData.user.id,
      label,
      is_system: false,
      grades,
    })
    .select()
    .single()

  if (error) throw error
  return data as GradeScale
}

export async function updateGradeScale(id: string, label: string, grades: GradeRow[]): Promise<GradeScale> {
  const { data, error } = await supabase
    .from('grade_scales')
    .update({ label, grades })
    .eq('id', id)
    .select()
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
