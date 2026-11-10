import { useState } from 'react'
import { Edit2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'
import { useDegrees } from '@/hooks/useDegrees'
import { useSemesters } from '@/hooks/useSemesters'
import { getCumulativeMetrics } from '@/lib/analytics'
import { bandsForScale, classBandsOf, type Band } from '@/lib/bands'
import { friendlyError } from '@/lib/errors'
import type { DegreeWithScale } from '@/lib/queries/degrees'
import type { GradeRow } from '@/lib/queries/gradeScales'
import { CreateDegreeDialog } from '@/components/degrees/CreateDegreeDialog'
import { MiniRuler } from '@/components/ruler/MiniRuler'
import { EmptyState } from '@/components/EmptyState'
import { Button } from '@/components/ui/button'

function DegreeTrack({ degreeId, grades, classBands }: { degreeId: string; grades: GradeRow[]; classBands: Band[] }) {
  const { semesters, isLoading } = useSemesters(degreeId)
  const track = bandsForScale(grades, classBands)
  if (isLoading) return <div className="h-1.5 animate-pulse rounded-full bg-muted" />
  const metrics = getCumulativeMetrics(semesters, grades, classBands)
  return <MiniRuler track={track} value={metrics.attemptedCredits > 0 ? metrics.cgpa : null} />
}

export default function DegreesPage() {
  const { degrees, isLoading, createDegree, updateDegree, deleteDegree } = useDegrees()
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingDegree, setEditingDegree] = useState<DegreeWithScale | undefined>()

  const handleCreate = () => {
    setEditingDegree(undefined)
    setEditorOpen(true)
  }

  const handleEdit = (degree: DegreeWithScale, event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setEditingDegree(degree)
    setEditorOpen(true)
  }

  const handleDelete = async (id: string, event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    if (!confirm('Are you sure you want to delete this degree? All semesters and modules will be lost.')) return
    try {
      await deleteDegree(id)
      toast.success('Degree deleted')
    } catch (err: unknown) {
      toast.error(friendlyError(err, "Couldn't delete the degree. Try again."))
    }
  }

  const handleSave = async (data: { title: string; institution: string | null; started_year: number | null; grade_scale_id: string | null }) => {
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
      <div role="status" className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <title>Degrees · Semest</title>
        <span className="sr-only">Loading</span>
        <div className="h-16 w-48 animate-pulse rounded-full bg-muted" />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-44 animate-pulse rounded-[22px] bg-muted" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <title>Degrees · Semest</title>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-5xl font-semibold tracking-tight sm:text-6xl">Degrees</h1>
            <p className="mt-3 text-sm text-muted-foreground">Manage your academic programs.</p>
          </div>
          <Button onClick={handleCreate}>New degree</Button>
        </div>

        {degrees.length === 0 ? (
          <EmptyState
            className="mt-12 rounded-[22px] border border-dashed border-foreground/20 px-8 py-12 text-center"
            title="No degrees yet"
            body="Create a degree to start a GPA."
            ruler={<MiniRuler track={bandsForScale([])} value={null} className="mx-auto mb-8 max-w-sm" />}
            action={
              <Button variant="outline" onClick={handleCreate}>
                Create degree
              </Button>
            }
          />
        ) : (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {degrees.map((degree) => (
              <article key={degree.id} className="group relative flex h-full animate-card-enter flex-col rounded-[22px] bg-card p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-semibold">
                      <Link to={`/degrees/${degree.id}/semesters`} className="after:absolute after:inset-0">
                        {degree.title}
                      </Link>
                    </h2>
                    <p className="mt-1 truncate text-sm text-muted-foreground">
                      {degree.institution?.trim() ? (
                        <>
                          {degree.institution.trim()}
                          {degree.started_year ? ` · ${degree.started_year}` : ''}
                        </>
                      ) : (
                        <>
                          {degree.started_year ? `${degree.started_year} · ` : null}
                          <button
                            type="button"
                            className="relative z-10 hover:text-foreground"
                            onClick={(event) => handleEdit(degree, event)}
                          >
                            Add institution
                          </button>
                        </>
                      )}
                    </p>
                  </div>
                  <div className="relative z-10 flex gap-0.5 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                    <Button variant="ghost" size="icon-sm" aria-label={`Edit ${degree.title}`} onClick={(event) => handleEdit(degree, event)}>
                      <Edit2 />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Delete ${degree.title}`}
                      onClick={(event) => handleDelete(degree.id, event)}
                      className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>
                <div className="mt-6">
                  <DegreeTrack degreeId={degree.id} grades={degree.grade_scale?.grades || []} classBands={classBandsOf(degree)} />
                </div>
              </article>
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
