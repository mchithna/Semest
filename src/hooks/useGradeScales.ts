import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getGradeScales,
  createGradeScale,
  updateGradeScale,
  deleteGradeScale,
  type GradeRow,
} from '../lib/queries/gradeScales'

export const gradeScalesKeys = {
  all: ['gradeScales'] as const,
}

export function useGradeScales() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: gradeScalesKeys.all,
    queryFn: getGradeScales,
  })

  const createMutation = useMutation({
    mutationFn: ({ label, grades }: { label: string; grades: GradeRow[] }) =>
      createGradeScale(label, grades),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gradeScalesKeys.all })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, label, grades }: { id: string; label: string; grades: GradeRow[] }) =>
      updateGradeScale(id, label, grades),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gradeScalesKeys.all })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteGradeScale(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gradeScalesKeys.all })
    },
  })

  return {
    scales: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    createScale: createMutation.mutateAsync,
    updateScale: updateMutation.mutateAsync,
    deleteScale: deleteMutation.mutateAsync,
    isMutating: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
  }
}
