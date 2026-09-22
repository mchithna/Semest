import { supabase } from '../supabase'
import type { ModuleData } from '@/components/calculator/ModuleRow'
import { toCredits } from '@/lib/score'

export type Semester = {
  id: string
  degree_id: string
  user_id: string
  title: string
  term: string | null
  sem_index: number
  created_at: string
  updated_at: string
}

export type SemesterModule = {
  id: string
  semester_id: string
  user_id: string
  name: string
  credits: number
  grade: string
  position: number
  created_at: string
}

export type SemesterWithModules = Semester & {
  modules: SemesterModule[]
}

export async function getSemestersForDegree(degreeId: string): Promise<SemesterWithModules[]> {
  const { data, error } = await supabase
    .from('semesters')
    .select(`
      *,
      modules(*)
    `)
    .eq('degree_id', degreeId)
    .order('sem_index', { ascending: true })

  if (error) throw error

  return (data || []).map(sem => ({
    ...sem,
    modules: Array.isArray(sem.modules)
      ? sem.modules
          .map((mod: SemesterModule) => ({ ...mod, credits: toCredits(mod.credits) }))
          .sort((a: SemesterModule, b: SemesterModule) => a.position - b.position)
      : []
  })) as SemesterWithModules[]
}

export async function saveSemester(
  degreeId: string,
  title: string,
  modules: ModuleData[],
  term: string | null = null,
  semIndex: number = 0,
  semesterId?: string
): Promise<SemesterWithModules> {
  const { data: userData, error: authError } = await supabase.auth.getUser()
  if (authError) throw authError

  // 1. Upsert Semester
  const semesterPayload = {
    degree_id: degreeId,
    user_id: userData.user.id,
    title,
    term,
    sem_index: semIndex
  }
  
  const query = semesterId 
    ? supabase.from('semesters').update(semesterPayload).eq('id', semesterId).select().single()
    : supabase.from('semesters').insert(semesterPayload).select().single()

  const { data: semesterData, error: semesterError } = await query
  if (semesterError) throw semesterError

  // 2. Upsert/Delete Modules
  // First, if editing, we might delete existing modules and re-insert.
  if (semesterId) {
    const { error: deleteError } = await supabase
      .from('modules')
      .delete()
      .eq('semester_id', semesterData.id)
    if (deleteError) throw deleteError
  }

  // 3. Insert new modules
  const modulesPayload = modules.map((m, i) => ({
    semester_id: semesterData.id,
    user_id: userData.user.id,
    name: m.name || 'Untitled Module',
    credits: m.credits,
    grade: m.grade,
    position: i
  }))

  const { data: modulesData, error: modulesError } = await supabase
    .from('modules')
    .insert(modulesPayload)
    .select()

  if (modulesError) throw modulesError

  return {
    ...semesterData,
    modules: modulesData
      .map((mod) => ({ ...mod, credits: toCredits(mod.credits) }))
      .sort((a, b) => a.position - b.position)
  } as SemesterWithModules
}

export async function deleteSemester(semesterId: string): Promise<void> {
  const { error } = await supabase
    .from('semesters')
    .delete()
    .eq('id', semesterId)

  if (error) throw error
}
