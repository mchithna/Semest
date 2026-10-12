import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  getSemestersForDegree, 
  saveSemester, 
  deleteSemester
} from '../lib/queries/semesters'
import type { ModuleData } from '@/components/calculator/ModuleRow'
import { toast } from 'sonner'

export function useSemesters(degreeId: string) {
  const queryClient = useQueryClient()

  const queryKey = ['semesters', degreeId]

  const semestersQuery = useQuery({
    queryKey,
    queryFn: () => getSemestersForDegree(degreeId),
    enabled: !!degreeId,
  })

  const saveMutation = useMutation({
    mutationFn: (params: { 
      title: string; 
      modules: ModuleData[]; 
      term?: string; 
      semIndex?: number; 
      semesterId?: string 
    }) => saveSemester(
      degreeId, 
      params.title, 
      params.modules, 
      params.term || null,
      params.semIndex,
      params.semesterId
    ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      toast.success('Semester saved successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save semester')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (semesterId: string) => deleteSemester(semesterId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      toast.success('Semester deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete semester')
    }
  })

  return {
    semesters: semestersQuery.data || [],
    isLoading: semestersQuery.isLoading,
    error: semestersQuery.error,
    saveSemester: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    deleteSemester: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending
  }
}
