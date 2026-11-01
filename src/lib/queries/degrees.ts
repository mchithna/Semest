import { supabase } from '../supabase'
import { GRADE_SCALE_SELECT, type GradeScale } from './gradeScales'

export type Degree = {
  id: string
  user_id: string
  title: string
  institution: string | null
  started_year: number | null
  grade_scale_id: string | null
  created_at: string
}

export type DegreeWithScale = Degree & {
  grade_scale?: GradeScale | null
}

export async function getDegrees(): Promise<DegreeWithScale[]> {
  const { data, error } = await supabase
    .from('degrees')
    .select(`
      *,
      grade_scale:grade_scales(${GRADE_SCALE_SELECT})
    `)
    .order('created_at', { ascending: false })

  if (error) throw error
  // The join might return an array or single object depending on relation, Supabase returns a single object for foreign keys.
  // Just to be safe, if it's an array for some reason, we take the first item. Usually it's an object.
  return data?.map(d => ({
    ...d,
    grade_scale: Array.isArray(d.grade_scale) ? d.grade_scale[0] : d.grade_scale
  })) as DegreeWithScale[]
}

export async function createDegree(degree: Omit<Degree, 'id' | 'user_id' | 'created_at'>): Promise<Degree> {
  const { data: userData, error: authError } = await supabase.auth.getUser()
  if (authError) throw authError

  const { data, error } = await supabase
    .from('degrees')
    .insert({
      user_id: userData.user.id,
      ...degree,
    })
    .select()
    .single()

  if (error) throw error
  return data as Degree
}

export async function updateDegree(id: string, degree: Partial<Omit<Degree, 'id' | 'user_id' | 'created_at'>>): Promise<Degree> {
  const { data, error } = await supabase
    .from('degrees')
    .update(degree)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Degree
}

export async function deleteDegree(id: string): Promise<void> {
  const { error } = await supabase
    .from('degrees')
    .delete()
    .eq('id', id)

  if (error) throw error
}
