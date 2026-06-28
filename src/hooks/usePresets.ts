import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getPublicPresets,
  getMyPresets,
  getPresetByCode,
  publishPreset,
  clonePreset,
  syncPreset
} from '../lib/queries/presets'

export function usePublicPresets() {
  return useQuery({
    queryKey: ['presets', 'public'],
    queryFn: getPublicPresets
  })
}

export function useMyPresets() {
  return useQuery({
    queryKey: ['presets', 'mine'],
    queryFn: getMyPresets
  })
}

export function usePreset(code: string) {
  return useQuery({
    queryKey: ['preset', code],
    queryFn: () => getPresetByCode(code),
    enabled: !!code
  })
}

export function useCreatePreset() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: { degreeId: string, title: string, description?: string, institution?: string, isPublic?: boolean }) => 
      publishPreset(params.degreeId, params.title, params.description, params.institution, params.isPublic),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['presets', 'mine'] })
      queryClient.invalidateQueries({ queryKey: ['presets', 'public'] })
    }
  })
}

export function useApplyPreset() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: { presetCode: string, targetDegreeId?: string, degreeTitle?: string }) => 
      clonePreset(params.presetCode, params.targetDegreeId, params.degreeTitle),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['degrees'] })
      queryClient.invalidateQueries({ queryKey: ['presets'] })
      queryClient.invalidateQueries({ queryKey: ['semesters'] })
    }
  })
}

export function useSyncPreset() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: { presetId: string, degreeId: string }) => 
      syncPreset(params.presetId, params.degreeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['presets', 'mine'] })
      queryClient.invalidateQueries({ queryKey: ['preset'] })
    }
  })
}
