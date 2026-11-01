import { assertSemester } from '../limits'
import { supabase } from '../supabase'
import type { ModuleData } from '@/components/calculator/ModuleRow'
import { toCredits } from '@/lib/score'
import { compareSemesters } from '@/lib/semesterOrder'

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
  retakes_module_id?: string | null
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
    .order('created_at', { ascending: true })

  if (error) throw error

  return (data || []).map(sem => ({
    ...sem,
    modules: Array.isArray(sem.modules)
      ? sem.modules
          .map((mod: SemesterModule) => ({ ...mod, credits: toCredits(mod.credits) }))
          .sort((a: SemesterModule, b: SemesterModule) => a.position - b.position)
      : []
  })).sort(compareSemesters) as SemesterWithModules[]
}

export async function saveSemester(
  degreeId: string,
  title: string,
  modules: ModuleData[],
  term: string | null = null,
  semIndex?: number,
  semesterId?: string
): Promise<SemesterWithModules> {
  const payload = modules.map((mod) => ({
    id: mod.id,
    name: mod.name || 'Untitled Module',
    credits: mod.credits,
    grade: mod.grade,
    retakesModuleId: mod.retakesModuleId || null,
  }))
  assertSemester(title, term, payload)

  const { data, error } = await supabase.rpc('save_semester', {
    p_degree_id: degreeId,
    p_title: title,
    p_modules: payload,
    p_term: term,
    p_sem_index: semIndex ?? null,
    p_semester_id: semesterId ?? null,
  })

  if (error) throw error
  if (!data) throw new Error('Semester save returned no data')

  const saved = data as SemesterWithModules
  return {
    ...saved,
    modules: (saved.modules ?? [])
      .map((mod) => ({ ...mod, credits: toCredits(mod.credits) }))
      .sort((a, b) => a.position - b.position),
  }
}

export async function deleteSemester(semesterId: string): Promise<void> {
  const { error } = await supabase
    .from('semesters')
    .delete()
    .eq('id', semesterId)

  if (error) throw error
}
