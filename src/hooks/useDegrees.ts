import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getDegrees,
  createDegree,
  updateDegree,
  deleteDegree,
} from '../lib/queries/degrees'

export const degreesKeys = {
  all: ['degrees'] as const,
}

export function useDegrees() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: degreesKeys.all,
    queryFn: getDegrees,
  })

  const createMutation = useMutation({
    mutationFn: createDegree,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: degreesKeys.all })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: Parameters<typeof updateDegree>[1] & { id: string }) =>
      updateDegree(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: degreesKeys.all })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteDegree,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: degreesKeys.all })
    },
  })

  return {
    degrees: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    createDegree: createMutation.mutateAsync,
    updateDegree: updateMutation.mutateAsync,
    deleteDegree: deleteMutation.mutateAsync,
    isMutating: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
  }
}
