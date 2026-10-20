import { useState } from 'react'
import { Plus, Edit2, Trash2, GraduationCap } from 'lucide-react'
import { toast } from 'sonner'
import { Link, useNavigate } from 'react-router-dom'
import { useDegrees } from '@/hooks/useDegrees'
import { useSemesters } from '@/hooks/useSemesters'
import { getCumulativeMetrics } from '@/lib/analytics'
import { formatGpa, honorsApply } from '@/lib/score'
import { friendlyError } from '@/lib/errors'
import type { DegreeWithScale } from '@/lib/queries/degrees'
import { CreateDegreeDialog } from '@/components/degrees/CreateDegreeDialog'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

function DegreeGpa({ degreeId, grades }: { degreeId: string; grades: { grade: string; points: number }[] }) {
  const { semesters, isLoading } = useSemesters(degreeId)
  if (isLoading) return <span className="text-xs font-mono text-muted-foreground">GPA …</span>
  const metrics = getCumulativeMetrics(semesters, grades)
  const graded = metrics.attemptedCredits > 0
  const label = graded && honorsApply(grades) && metrics.standing ? metrics.standing : ''
  return (
    <div className="bg-primary/10 text-primary px-2 py-1 rounded-sm text-xs font-mono font-bold tracking-widest">
      <span className="tabular-nums">GPA: {graded ? formatGpa(metrics.cgpa) : '—'}{label ? ` · ${label}` : ''}</span>
    </div>
  )
}

export default function DegreesPage() {
  const { degrees, isLoading, createDegree, updateDegree, deleteDegree } = useDegrees()
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingDegree, setEditingDegree] = useState<DegreeWithScale | undefined>()
  const navigate = useNavigate()

  const handleCreate = () => {
    setEditingDegree(undefined)
    setEditorOpen(true)
  }

  const handleEdit = (degree: DegreeWithScale, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingDegree(degree)
    setEditorOpen(true)
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this degree? All semesters and modules will be lost.')) return
    try {
      await deleteDegree(id)
      toast.success('Degree deleted')
    } catch (err: any) {
      toast.error(friendlyError(err, "Couldn't delete the degree. Try again."))
    }
  }

  const handleSave = async (data: any) => {
    if (editingDegree) {
      await updateDegree({ id: editingDegree.id, ...data })
      toast.success('Degree updated')
    } else {
      await createDegree(data)
      toast.success('Degree created')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground p-4 sm:p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex justify-between items-end border-b pb-6">
            <div>
              <Skeleton className="h-8 w-48 bg-muted" />
              <Skeleton className="h-4 w-64 bg-muted mt-3" />
            </div>
            <Skeleton className="h-9 w-32 bg-muted" />
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40 bg-muted rounded-sm" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-8 animate-slideUp">
        
        {/* Header */}
        <div className="flex justify-between items-end border-b pb-6">
          <div>
            <h1 className="text-2xl font-display font-bold tracking-tight text-primary">
              My degrees
            </h1>
            <p className="text-muted-foreground text-sm mt-2">
              Manage your academic programs.
            </p>
          </div>
          <Button
            onClick={handleCreate}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-sm text-xs"
          >
            <Plus className="w-4 h-4 mr-2" />
            New degree
          </Button>
        </div>

        {/* Degrees Grid */}
        {degrees.length === 0 ? (
          <div className="bg-card border border-border border-dashed rounded-sm p-12 text-center">
            <GraduationCap className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-foreground font-sans text-lg font-semibold mb-2">No degrees found</h3>
            <p className="text-muted-foreground text-sm mb-6">Create your first degree to start tracking your progress.</p>
            <Button
              onClick={handleCreate}
              variant="outline"
              className="text-primary hover:text-primary/80 rounded-sm text-xs"
            >
              Create degree
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {degrees.map((degree) => (
              <div 
                key={degree.id} 
                className="bg-card border border-border rounded-sm p-6 relative group transition-all hover:border-primary/50 hover:-translate-y-1 hover:shadow-2xl flex flex-col h-full"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-primary/50 group-hover:bg-primary transition-colors"></div>
                
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-mono text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                      <Link to={`/degrees/${degree.id}/semesters`} className="after:absolute after:inset-0">
                        {degree.title}
                      </Link>
                    </h3>
                    <p className="text-sm font-mono text-muted-foreground mt-1">
                      {degree.institution || 'Unknown Institution'} {degree.started_year ? `• ${degree.started_year}` : ''}
                    </p>
                  </div>
                  <div className="relative z-10 flex sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Edit ${degree.title}`}
                      onClick={(e) => handleEdit(degree, e)}
                      className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-sm"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Delete ${degree.title}`}
                      onClick={(e) => handleDelete(degree.id, e)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t border-border/50 flex justify-between items-center">
                  <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
                    Scale: <span className="text-foreground">{degree.grade_scale?.label || 'None'}</span>
                  </div>
                  <DegreeGpa degreeId={degree.id} grades={degree.grade_scale?.grades || []} />
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      <CreateDegreeDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        initialData={editingDegree}
        onSave={handleSave}
      />
    </div>
  )
}
