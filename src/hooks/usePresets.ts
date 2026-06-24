import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getPublicPresets,
  getMyPresets,
  getPresetByCode,
  createPresetFromDegree,
  applyPresetToDegree
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
    mutationFn: (params: { degreeId: string, title: string, description: string, isPublic: boolean }) => 
      createPresetFromDegree(params.degreeId, params.title, params.description, params.isPublic),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['presets', 'mine'] })
      queryClient.invalidateQueries({ queryKey: ['presets', 'public'] })
    }
  })
}

export function useApplyPreset() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: { presetCode: string, degreeTitle?: string }) => 
      applyPresetToDegree(params.presetCode, params.degreeTitle),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['degrees'] })
      queryClient.invalidateQueries({ queryKey: ['presets'] })
    }
  })
}
