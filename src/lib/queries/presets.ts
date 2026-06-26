import { supabase } from '../supabase'
import type { GradeScale } from './gradeScales'

export type Preset = {
  id: string
  code: string
  creator_id: string | null
  title: string
  description: string | null
  institution: string | null
  grade_scale_id: string | null
  is_public: boolean
  use_count: number
  created_at: string
  updated_at: string
}

export type PresetWithScale = Preset & {
  grade_scale?: GradeScale | null
}

export type PresetModule = {
  id: string
  preset_semester_id: string
  name: string
  credits: number
  position: number
}

export type PresetSemester = {
  id: string
  preset_id: string
  title: string
  sem_index: number
  position: number
  modules: PresetModule[]
}

export type PresetFull = PresetWithScale & {
  semesters: PresetSemester[]
}

export async function getPublicPresets(): Promise<PresetWithScale[]> {
  const { data, error } = await supabase
    .from('presets')
    .select(`
      *,
      grade_scale:grade_scales(*)
    `)
    .eq('is_public', true)
    .order('use_count', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw error
  
  return data?.map(d => ({
    ...d,
    grade_scale: Array.isArray(d.grade_scale) ? d.grade_scale[0] : d.grade_scale
  })) as PresetWithScale[]
}

export async function getMyPresets(): Promise<PresetWithScale[]> {
  const { data: authData } = await supabase.auth.getUser()
  if (!authData?.user) throw new Error("Not authenticated")

  const { data, error } = await supabase
    .from('presets')
    .select(`
      *,
      grade_scale:grade_scales(*)
    `)
    .eq('creator_id', authData.user.id)
    .order('created_at', { ascending: false })

  if (error) throw error
  
  return data?.map(d => ({
    ...d,
    grade_scale: Array.isArray(d.grade_scale) ? d.grade_scale[0] : d.grade_scale
  })) as PresetWithScale[]
}

export async function getPresetByCode(code: string): Promise<PresetFull> {
  const { data, error } = await supabase
    .from('presets')
    .select(`
      *,
      grade_scale:grade_scales(*),
      semesters:preset_semesters(
        *,
        modules:preset_modules(*)
      )
    `)
    .eq('code', code.toUpperCase())
    .single()

  if (error) throw error
  
  return {
    ...data,
    grade_scale: Array.isArray(data.grade_scale) ? data.grade_scale[0] : data.grade_scale,
    semesters: (data.semesters as any[]).map(sem => ({
      ...sem,
      modules: sem.modules || []
    })).sort((a, b) => a.sem_index - b.sem_index)
  } as PresetFull
}

export async function createPresetFromDegree(
  degreeId: string, 
  title: string, 
  description: string, 
  isPublic: boolean
): Promise<Preset> {
  const { data: authData } = await supabase.auth.getUser()
  if (!authData?.user) throw new Error("Not authenticated")

  // 1. Fetch degree details
  const { data: degree, error: degreeError } = await supabase
    .from('degrees')
    .select('*')
    .eq('id', degreeId)
    .single()
  
  if (degreeError) throw degreeError

  // 2. Fetch semesters and modules
  const { data: semesters, error: semError } = await supabase
    .from('semesters')
    .select('*, modules(*)')
    .eq('degree_id', degreeId)
  
  if (semError) throw semError

  // 3. Generate preset code
  const { data: code, error: codeError } = await supabase.rpc('generate_preset_code')
  if (codeError) throw codeError

  // 4. Create the preset
  const { data: preset, error: presetError } = await supabase
    .from('presets')
    .insert({
      code: code,
      creator_id: authData.user.id,
      title,
      description,
      institution: degree.institution,
      grade_scale_id: degree.grade_scale_id,
      is_public: isPublic
    })
    .select()
    .single()
  
  if (presetError) throw presetError

  // 5. Insert semesters and modules
  for (const sem of semesters || []) {
    const { data: presetSem, error: pSemError } = await supabase
      .from('preset_semesters')
      .insert({
        preset_id: preset.id,
        title: sem.title,
        sem_index: sem.sem_index,
        position: sem.sem_index
      })
      .select()
      .single()
    
    if (pSemError) throw pSemError

    if (sem.modules && sem.modules.length > 0) {
      const pModules = sem.modules.map((m: any) => ({
        preset_semester_id: presetSem.id,
        name: m.name,
        credits: m.credits,
        position: m.position
      }))

      const { error: pModError } = await supabase
        .from('preset_modules')
        .insert(pModules)
      
      if (pModError) throw pModError
    }
  }

  return preset as Preset
}

export async function applyPresetToDegree(presetCode: string, degreeTitle?: string): Promise<string> {
  const { data: authData } = await supabase.auth.getUser()
  if (!authData?.user) throw new Error("Not authenticated")

  const preset = await getPresetByCode(presetCode)

  // 1. Create new degree
  const { data: degree, error: degreeError } = await supabase
    .from('degrees')
    .insert({
      user_id: authData.user.id,
      title: degreeTitle || preset.title,
      institution: preset.institution,
      grade_scale_id: preset.grade_scale_id,
      started_year: new Date().getFullYear()
    })
    .select()
    .single()

  if (degreeError) throw degreeError

  // 2. Increment preset use_count
  const { error: rpcError } = await supabase.rpc('increment_preset_use_count', { p_id: preset.id })
  if (rpcError) {
    // Fallback if rpc doesn't exist or fails
    await supabase.from('presets').update({ use_count: preset.use_count + 1 }).eq('id', preset.id)
  }

  // 3. Create semesters and modules
  for (const pSem of preset.semesters) {
    const { data: sem, error: semError } = await supabase
      .from('semesters')
      .insert({
        degree_id: degree.id,
        user_id: authData.user.id,
        title: pSem.title,
        sem_index: pSem.sem_index
      })
      .select()
      .single()
    
    if (semError) throw semError

    if (pSem.modules && pSem.modules.length > 0) {
      const newModules = pSem.modules.map(m => ({
        semester_id: sem.id,
        user_id: authData.user.id,
        name: m.name,
        credits: m.credits,
        grade: 'N/A', // Empty default grade
        position: m.position
      }))

      const { error: modError } = await supabase
        .from('modules')
        .insert(newModules)
      
      if (modError) throw modError
    }
  }

  return degree.id
}
