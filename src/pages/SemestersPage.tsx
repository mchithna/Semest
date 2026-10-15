import { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { Plus, Trash2, Edit2, Calendar, LayoutGrid, Milestone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDegrees } from '@/hooks/useDegrees'
import { useSemesters } from '@/hooks/useSemesters'
import { attemptedCredits, computeScore, earnedCredits, formatGpa, hasGradedWork, honorsApply } from '@/lib/score'
import { ClassificationBadge } from '@/components/ui/ClassificationBadge'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { SemesterWithModules } from '@/lib/queries/semesters'
import type { GradeRow } from '@/lib/queries/gradeScales'

type SemesterLayout = 'grid' | 'timeline'

const LAYOUT_STORAGE_KEY = 'semest-semester-layout'

function readSemesterLayout(): SemesterLayout {
  try {
    return localStorage.getItem(LAYOUT_STORAGE_KEY) === 'timeline' ? 'timeline' : 'grid'
  } catch {
    return 'grid'
  }
}

function semesterStats(semester: SemesterWithModules, scale: GradeRow[]) {
  const earned = earnedCredits(semester.modules, scale)
  const attempted = attemptedCredits(semester.modules, scale)
  return {
    earned,
    attempted,
    score: computeScore(semester.modules, scale),
    graded: hasGradedWork(semester.modules, scale),
  }
}

function SemesterActions({
  title,
  onEdit,
  onDelete,
}: {
  title: string
  onEdit: () => void
  onDelete: (event: React.MouseEvent) => void
}) {
  return (
    <div className="relative z-10 flex sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity gap-1">
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Edit ${title}`}
        onClick={onEdit}
        className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-sm"
      >
        <Edit2 className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Delete ${title}`}
        onClick={onDelete}
        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-sm"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  )
}

function SemesterMetrics({
  earned,
  attempted,
  score,
  graded,
  scale,
}: {
  earned: number
  attempted: number
  score: number
  graded: boolean
  scale: GradeRow[]
}) {
  return (
    <div className="flex flex-col gap-3 min-w-0">
      <div className="grid grid-cols-3 gap-3">
        <div className="min-w-0">
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Passed</p>
          <p className="font-mono text-sm font-semibold tabular-nums text-foreground">{earned.toFixed(1)}</p>
        </div>
        <div className="min-w-0">
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Graded</p>
          <p className="font-mono text-sm font-semibold tabular-nums text-foreground">{attempted.toFixed(1)}</p>
        </div>
        <div className="min-w-0">
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">GPA</p>
          <p className={`font-mono text-sm font-semibold tabular-nums ${attempted > 0 ? 'text-primary' : 'text-muted-foreground'}`}>
            {attempted > 0 ? formatGpa(score) : '—'}
          </p>
        </div>
      </div>
      {honorsApply(scale) && (
        <ClassificationBadge
          score={score}
          graded={graded}
          className="h-auto w-fit whitespace-normal"
        />
      )}
    </div>
  )
}

function LayoutToggle({
  value,
  onChange,
}: {
  value: SemesterLayout
  onChange: (next: SemesterLayout) => void
}) {
  const options: { id: SemesterLayout; label: string; icon: typeof LayoutGrid }[] = [
    { id: 'grid', label: 'Grid', icon: LayoutGrid },
    { id: 'timeline', label: 'Timeline', icon: Milestone },
  ]

  return (
    <div role="group" aria-label="Semester view" className="inline-flex self-end rounded-lg border border-border bg-muted/40 p-0.5">
      {options.map((option) => {
        const Icon = option.icon
        const selected = value === option.id
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.id)}
            className={cn(
              'inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium',
              selected
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="size-3.5" aria-hidden="true" />
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

export default function SemestersPage() {
  const { degreeId } = useParams()
  const navigate = useNavigate()
  
  const { degrees, isLoading: isDegreesLoading } = useDegrees()
  const { semesters, isLoading: isSemestersLoading, deleteSemester } = useSemesters(degreeId || '')
  const [layout, setLayout] = useState<SemesterLayout>(readSemesterLayout)

  const chooseLayout = (next: SemesterLayout) => {
    setLayout(next)
    try {
      localStorage.setItem(LAYOUT_STORAGE_KEY, next)
    } catch {
      // The view still switches for this visit.
    }
  }

  const degree = degrees.find(d => d.id === degreeId)

  if (isDegreesLoading || isSemestersLoading) {
    return (
      <div role="status" className="min-h-screen bg-background text-foreground p-4 sm:p-8">
        <title>Semesters · Semest</title>
        <span className="sr-only">Loading</span>
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
        <title>Semesters · Semest</title>
        <p>Degree not found.</p>
        <Button onClick={() => navigate('/degrees')} className="mt-4" variant="outline">
          Back to Degrees
        </Button>
      </div>
    )
  }

  const handleDelete = async (id: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm(`Delete ${title}? Its modules and grades will be removed.`)) return
    try {
      await deleteSemester(id)
    } catch (err: any) {
      // toast is handled in the hook
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-8">
      <title>{`${degree.title} · Semest`}</title>
      <div className="max-w-6xl mx-auto space-y-8 animate-slideUp">
        
        {/* Header */}
        <div className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-2 min-w-0">
            <Breadcrumb items={[{ label: degree.title }]} />
            <h1 className="text-2xl font-sans font-bold tracking-tight text-foreground">
              {degree.title}
            </h1>
            <p className="text-muted-foreground text-sm">
              Manage semesters for this degree.
            </p>
          </div>
          <div className="flex flex-col items-stretch gap-2 sm:items-end">
            {semesters.length > 0 && (
              <LayoutToggle value={layout} onChange={chooseLayout} />
            )}
            <Button
              onClick={() => navigate(`/degrees/${degreeId}/semesters/new`)}
              className="self-end bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl text-xs"
            >
              <Plus className="w-4 h-4 mr-2" />
              New semester
            </Button>
          </div>
        </div>

        {/* Semesters Grid */}
        {semesters.length === 0 ? (
          <div className="bg-card border border-border border-dashed rounded-xl p-12 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-foreground font-sans text-lg font-semibold mb-2">No semesters found</h3>
            <p className="text-muted-foreground text-sm mb-6">Create your first semester to start calculating your GPA.</p>
            <Button
              onClick={() => navigate(`/degrees/${degreeId}/semesters/new`)}
              variant="outline"
              className="border-border text-primary hover:bg-muted hover:text-primary rounded-xl text-xs"
            >
              Add semester
            </Button>
          </div>
        ) : layout === 'grid' ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {semesters.map((sem) => {
              const scale = degree.grade_scale?.grades || []
              const stats = semesterStats(sem, scale)

              return (
                <div
                  key={sem.id}
                  className="bg-card border border-border rounded-xl p-6 relative group transition-all hover:border-primary/50 flex flex-col h-full min-w-0 overflow-hidden hover:shadow-lg hover:-translate-y-1"
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary/50 rounded-l-xl"></div>

                  <div className="flex justify-between items-start gap-3 mb-4 min-w-0">
                    <div className="min-w-0">
                      <h3 className="font-mono text-lg font-bold text-foreground group-hover:text-primary transition-colors truncate">
                        <Link
                          to={`/degrees/${degreeId}/semesters/${sem.id}/edit`}
                          className="after:absolute after:inset-0"
                        >
                          {sem.title}
                        </Link>
                      </h3>
                      {sem.term && (
                        <p className="text-sm font-mono text-muted-foreground mt-1">
                          {sem.term}
                        </p>
                      )}
                    </div>
                    <SemesterActions
                      title={sem.title}
                      onEdit={() => navigate(`/degrees/${degreeId}/semesters/${sem.id}/edit`)}
                      onDelete={(event) => handleDelete(sem.id, sem.title, event)}
                    />
                  </div>

                  <div className="mt-auto pt-4 border-t">
                    <SemesterMetrics scale={scale} {...stats} />
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <ol aria-label="Semesters in order" className="max-w-3xl">
            {semesters.map((sem, index) => {
              const scale = degree.grade_scale?.grades || []
              const stats = semesterStats(sem, scale)

              return (
                <li key={sem.id} className="relative pb-6 last:pb-0">
                  {index < semesters.length - 1 && (
                    <span
                      aria-hidden="true"
                      className="absolute left-4 top-12 bottom-0 w-px -translate-x-1/2 bg-border"
                    />
                  )}
                  <span className="absolute left-0 top-6 z-10 flex size-8 items-center justify-center rounded-full border border-primary bg-background font-mono text-xs font-bold tabular-nums text-primary">
                    {index + 1}
                  </span>
                  <div className="ml-12 bg-card border border-border rounded-xl p-5 relative group min-w-0 transition-colors hover:border-primary/50">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-mono text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                          <Link
                            to={`/degrees/${degreeId}/semesters/${sem.id}/edit`}
                            className="after:absolute after:inset-0"
                          >
                            {sem.title}
                          </Link>
                        </h3>
                        {sem.term && (
                          <p className="text-sm font-mono text-muted-foreground mt-1">
                            {sem.term}
                          </p>
                        )}
                      </div>
                      <SemesterActions
                        title={sem.title}
                        onEdit={() => navigate(`/degrees/${degreeId}/semesters/${sem.id}/edit`)}
                        onDelete={(event) => handleDelete(sem.id, sem.title, event)}
                      />
                    </div>
                    <div className="mt-4 pt-4 border-t">
                      <SemesterMetrics scale={scale} {...stats} />
                    </div>
                  </div>
                </li>
              )
            })}
          </ol>
        )}
      </div>
    </div>
  )
}
