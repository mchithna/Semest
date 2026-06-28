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
  scale_snapshot?: any
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
    grade_scale: (Array.isArray(d.grade_scale) ? d.grade_scale[0] : d.grade_scale) || d.scale_snapshot
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
    grade_scale: (Array.isArray(d.grade_scale) ? d.grade_scale[0] : d.grade_scale) || d.scale_snapshot
  })) as PresetWithScale[]
}

export async function getPresetByCode(code: string): Promise<PresetFull> {
  const { data, error } = await supabase.rpc('get_preset_with_scale', {
    p_code: code.toUpperCase()
  })

  if (error) throw error
  if (!data) throw new Error("Preset not found")
  
  // Map the new RPC format back to our PresetFull format for the frontend
  return {
    ...data.preset,
    grade_scale: data.scale,
    semesters: data.semesters || []
  } as PresetFull
}

export async function publishPreset(
  degreeId: string,
  title: string,
  description?: string,
  institution?: string,
  isPublic = true
): Promise<string> {
  const { data, error } = await supabase.rpc('publish_preset', {
    p_degree_id:   degreeId,
    p_title:       title,
    p_description: description ?? null,
    p_institution: institution ?? null,
    p_is_public:   isPublic,
  });
  if (error) throw error;
  return data as string;
}

export async function clonePreset(
  code: string,
  targetDegreeId?: string,
  degreeTitle?: string
): Promise<string> {
  const { data, error } = await supabase.rpc('clone_preset', {
    p_preset_code:      code,
    p_target_degree_id: targetDegreeId ?? null,
    p_degree_title:     degreeTitle ?? null
  });
  if (error) throw error;
  return data as string;
}

export async function syncPreset(
  presetId: string,
  degreeId: string
): Promise<void> {
  const { error } = await supabase.rpc('sync_preset', {
    p_preset_id: presetId,
    p_degree_id: degreeId,
  });
  if (error) throw error;
}
