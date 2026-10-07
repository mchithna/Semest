import { useParams, useNavigate } from 'react-router-dom'
import { Plus, Trash2, Edit2, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDegrees } from '@/hooks/useDegrees'
import { useSemesters } from '@/hooks/useSemesters'
import { attemptedCredits, computeScore, earnedCredits, hasGradedWork, honorsApply } from '@/lib/score'
import { ClassificationBadge } from '@/components/ui/ClassificationBadge'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { Skeleton } from '@/components/ui/skeleton'

export default function SemestersPage() {
  const { degreeId } = useParams()
  const navigate = useNavigate()
  
  const { degrees, isLoading: isDegreesLoading } = useDegrees()
  const { semesters, isLoading: isSemestersLoading, deleteSemester } = useSemesters(degreeId || '')

  const degree = degrees.find(d => d.id === degreeId)

  if (isDegreesLoading || isSemestersLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex justify-between items-end border-b pb-6">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-5 w-32 bg-muted" />
              <Skeleton className="h-8 w-64 bg-muted" />
              <Skeleton className="h-4 w-48 bg-muted" />
            </div>
            <Skeleton className="h-9 w-36 bg-muted" />
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 bg-muted rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!degree) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center">
        <p>Degree not found.</p>
        <Button onClick={() => navigate('/degrees')} className="mt-4" variant="outline">
          Back to Degrees
        </Button>
      </div>
    )
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this semester?')) return
    try {
      await deleteSemester(id)
    } catch (err: any) {
      // toast is handled in the hook
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-6xl mx-auto space-y-8 animate-slideUp">
        
        {/* Header */}
        <div className="flex justify-between items-end border-b pb-6">
          <div className="flex flex-col gap-2">
            <Breadcrumb items={[{ label: degree.title }]} />
            <h1 className="text-2xl font-mono font-bold tracking-widest uppercase text-foreground">
              {degree.title}
            </h1>
            <p className="text-muted-foreground font-mono text-sm">
              Manage semesters for this degree.
            </p>
          </div>
          <Button
            onClick={() => navigate(`/degrees/${degreeId}/semesters/new`)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl font-mono text-xs uppercase tracking-widest"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Semester
          </Button>
        </div>

        {/* Semesters Grid */}
        {semesters.length === 0 ? (
          <div className="bg-card border border-border border-dashed rounded-xl p-12 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-foreground font-mono text-lg mb-2">No semesters found</h3>
            <p className="text-muted-foreground font-mono text-sm mb-6">Create your first semester to start calculating your GPA.</p>
            <Button
              onClick={() => navigate(`/degrees/${degreeId}/semesters/new`)}
              variant="outline"
              className="border-border text-primary hover:bg-muted hover:text-primary rounded-xl font-mono text-xs uppercase tracking-widest"
            >
              Add Semester
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {semesters.map((sem) => {
              const scale = degree.grade_scale?.grades || []
              const score = computeScore(sem.modules, scale)
              const earned = earnedCredits(sem.modules, scale)
              const attempted = attemptedCredits(sem.modules, scale)
              
              return (
                <div 
                  key={sem.id} 
                  onClick={() => navigate(`/degrees/${degreeId}/semesters/${sem.id}/edit`)}
                  className="bg-card border border-border rounded-xl p-6 relative group transition-all hover:border-primary/50 cursor-pointer flex flex-col h-full min-w-0 overflow-hidden hover:shadow-lg hover:-translate-y-1"
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary/50 rounded-l-xl"></div>
                  
                  <div className="flex justify-between items-start gap-3 mb-4 min-w-0">
                    <div className="min-w-0">
                      <h3 className="font-mono text-lg font-bold text-foreground group-hover:text-primary transition-colors truncate">
                        {sem.title}
                      </h3>
                      {sem.term && (
                        <p className="text-sm font-mono text-muted-foreground mt-1">
                          {sem.term}
                        </p>
                      )}
                    </div>
                    <div className="flex opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/degrees/${degreeId}/semesters/${sem.id}/edit`)
                        }}
                        className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-sm"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleDelete(sem.id, e)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-auto pt-4 border-t flex flex-col gap-3 min-w-0">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="min-w-0">
                        <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Passed</p>
                        <p className="font-mono text-sm font-semibold text-foreground">{earned.toFixed(1)}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Graded</p>
                        <p className="font-mono text-sm font-semibold text-foreground">{attempted.toFixed(1)}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">GPA</p>
                        <p className="font-mono text-sm font-semibold text-primary">{score.toFixed(2)}</p>
                      </div>
                    </div>
                    {honorsApply(scale) && (
                      <ClassificationBadge
                        score={score}
                        graded={hasGradedWork(sem.modules, scale)}
                        className="h-auto whitespace-normal"
                      />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
