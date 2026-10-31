import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  getSemestersForDegree, 
  saveSemester, 
  deleteSemester
} from '../lib/queries/semesters'
import type { ModuleData } from '@/components/calculator/ModuleRow'
import { toast } from 'sonner'
import { friendlyError } from '@/lib/errors'

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
      toast.success('Semester saved')
    },
    onError: (error: unknown) => {
      toast.error(friendlyError(error, "Couldn't save the semester. Try again."))
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (semesterId: string) => deleteSemester(semesterId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      toast.success('Semester deleted')
    },
    onError: (error: unknown) => {
      toast.error(friendlyError(error, "Couldn't delete the semester. Try again."))
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
