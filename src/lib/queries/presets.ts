import { supabase } from '../supabase'
import { GRADE_SCALE_SELECT, type GradeScale } from './gradeScales'

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

export const PUBLIC_PRESET_PAGE_SIZE = 12

export async function getPublicPresets(page = 0, search = ''): Promise<{ presets: PresetWithScale[]; hasMore: boolean }> {
  const from = page * PUBLIC_PRESET_PAGE_SIZE
  const to = from + PUBLIC_PRESET_PAGE_SIZE - 1
  let query = supabase
    .from('presets')
    .select(`
      *,
      grade_scale:grade_scales(${GRADE_SCALE_SELECT})
    `, { count: 'exact' })
    .eq('is_public', true)
    .order('use_count', { ascending: false })
    .order('created_at', { ascending: false })
    .range(from, to)

  const term = search.trim().replace(/[,]/g, ' ')
  if (term) {
    const pattern = `%${term}%`
    query = query.or(`title.ilike.${pattern},institution.ilike.${pattern},description.ilike.${pattern},code.ilike.${pattern}`)
  }

  const { data, error, count } = await query
  if (error) throw error

  const presets = (data ?? []).map(d => ({
    ...d,
    grade_scale: (Array.isArray(d.grade_scale) ? d.grade_scale[0] : d.grade_scale) || d.scale_snapshot
  })) as PresetWithScale[]

  return { presets, hasMore: (count ?? 0) > to + 1 }
}

export async function getMyPresets(): Promise<PresetWithScale[]> {
  const { data: authData } = await supabase.auth.getUser()
  if (!authData?.user) throw new Error("Not authenticated")

  const { data, error } = await supabase
    .from('presets')
    .select(`
      *,
      grade_scale:grade_scales(${GRADE_SCALE_SELECT})
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

export async function updatePreset(
  presetId: string,
  fields: { title: string; description?: string; institution?: string; isPublic: boolean }
): Promise<void> {
  const { error } = await supabase
    .from('presets')
    .update({
      title: fields.title,
      description: fields.description ?? null,
      institution: fields.institution ?? null,
      is_public: fields.isPublic,
    })
    .eq('id', presetId)
  if (error) throw error
}

export async function deletePreset(presetId: string): Promise<void> {
  const { error } = await supabase.from('presets').delete().eq('id', presetId)
  if (error) throw error
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
