import { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { Trash2, Edit2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDegrees } from '@/hooks/useDegrees'
import { useSemesters } from '@/hooks/useSemesters'
import { computeScore, formatGpa, hasGradedWork, totalCredits } from '@/lib/score'
import { bandAt, bandsForScale, classBandsOf, standingSentence, type RulerMarker } from '@/lib/bands'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { MiniRuler } from '@/components/ruler/MiniRuler'
import { EmptyState } from '@/components/EmptyState'
import { Ruler } from '@/components/ruler/Ruler'
import { BAND_BORDER_CLASS, BAND_TEXT_CLASS } from '@/components/ruler/tone'
import { cn } from '@/lib/utils'
import type { SemesterWithModules } from '@/lib/queries/semesters'
import type { GradeRow } from '@/lib/queries/gradeScales'
import type { BandTrack } from '@/lib/bands'

type SemesterLayout = 'grid' | 'timeline'

const LAYOUT_STORAGE_KEY = 'semest-semester-layout'

function readSemesterLayout(): SemesterLayout {
  try {
    return localStorage.getItem(LAYOUT_STORAGE_KEY) === 'timeline' ? 'timeline' : 'grid'
  } catch {
    return 'grid'
  }
}

function formatCredits(value: number): string {
  const rounded = Math.round(value * 10) / 10
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
}

function semesterStats(semester: SemesterWithModules, scale: GradeRow[]) {
  return {
    credits: totalCredits(semester.modules),
    moduleCount: semester.modules.length,
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
    <div className="relative z-10 flex gap-0.5 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={`Edit ${title}`}
        onClick={onEdit}
      >
        <Edit2 />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={`Delete ${title}`}
        onClick={onDelete}
        className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
      >
        <Trash2 />
      </Button>
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
  const options: { id: SemesterLayout; label: string }[] = [
    { id: 'grid', label: 'Grid' },
    { id: 'timeline', label: 'Timeline' },
  ]

  return (
    <div role="group" aria-label="Semester view" className="inline-flex items-center gap-1">
      {options.map((option) => {
        const selected = value === option.id
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.id)}
            className={cn(
              'h-10 rounded-full px-4 text-sm font-medium transition-colors',
              selected
                ? 'bg-primary text-primary-foreground'
                : 'bg-card text-muted-foreground hover:text-foreground',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

function SemesterCard({
  semester,
  degreeId,
  scale,
  track,
  onDelete,
  compact = false,
}: {
  semester: SemesterWithModules
  degreeId: string
  scale: GradeRow[]
  track: BandTrack
  onDelete: (event: React.MouseEvent) => void
  compact?: boolean
}) {
  const navigate = useNavigate()
  const stats = semesterStats(semester, scale)
  const editPath = `/degrees/${degreeId}/semesters/${semester.id}/edit`
  const band = stats.graded ? bandAt(stats.score, track) : null
  const sentence = standingSentence(stats.score, stats.graded, track)
  const tone = band?.tone ?? 'plain'
  const detail = stats.moduleCount === 0
    ? 'No modules added'
    : `${formatCredits(stats.credits)} ${stats.credits === 1 ? 'credit' : 'credits'}`

  if (compact) {
    return (
      <article
        className={cn(
          'group relative flex min-w-0 flex-col gap-3 rounded-[22px] px-4 py-3 sm:flex-row sm:items-center sm:gap-5',
          stats.graded
            ? cn('border bg-card', BAND_BORDER_CLASS[tone])
            : 'border border-dashed border-foreground/20',
        )}
      >
        <div className="flex min-w-0 items-start justify-between gap-2 sm:w-44 sm:shrink-0">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-medium">
              <Link to={editPath} className="after:absolute after:inset-0">
                {semester.title}
              </Link>
            </h3>
            <p className="text-xs text-muted-foreground">
              {detail}
              {semester.term ? ` · ${semester.term}` : ''}
            </p>
          </div>
          <div className="sm:hidden">
            <SemesterActions
              title={semester.title}
              onEdit={() => navigate(editPath)}
              onDelete={onDelete}
            />
          </div>
        </div>
        {stats.graded ? (
          <>
            <p className="font-display text-3xl font-semibold tabular-nums tracking-tight sm:w-16 sm:shrink-0">
              {formatGpa(stats.score)}
            </p>
            {sentence && (
              <p className={cn('truncate text-sm font-medium sm:w-60 sm:shrink-0', BAND_TEXT_CLASS[tone])}>
                {sentence}
              </p>
            )}
            <MiniRuler className="min-w-0 flex-1" track={track} value={stats.score} />
          </>
        ) : (
          <>
            <MiniRuler className="min-w-0 flex-1" track={track} value={null} />
            <Button variant="outline" size="sm" className="relative z-10 w-fit shrink-0" asChild>
              <Link to={editPath}>{stats.moduleCount === 0 ? 'Add modules' : 'Add grades'}</Link>
            </Button>
          </>
        )}
        <div className="hidden sm:block">
          <SemesterActions
            title={semester.title}
            onEdit={() => navigate(editPath)}
            onDelete={onDelete}
          />
        </div>
      </article>
    )
  }

  return (
    <article
      className={cn(
        'group relative flex h-full min-w-0 flex-col rounded-[22px] p-5',
        stats.graded
          ? cn('border bg-card', BAND_BORDER_CLASS[tone])
          : 'border border-dashed border-foreground/20',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-medium">
            <Link to={editPath} className="after:absolute after:inset-0">
              {semester.title}
            </Link>
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {detail}
            {semester.term ? ` · ${semester.term}` : ''}
          </p>
        </div>
        <SemesterActions
          title={semester.title}
          onEdit={() => navigate(editPath)}
          onDelete={onDelete}
        />
      </div>

      {stats.graded ? (
        <div className="mt-8">
          <p className="font-display text-5xl font-semibold tabular-nums tracking-tight">
            {formatGpa(stats.score)}
          </p>
          {sentence && (
            <p className={cn('mt-1 text-sm font-medium', BAND_TEXT_CLASS[tone])}>{sentence}</p>
          )}
          <MiniRuler className="mt-6" track={track} value={stats.score} />
        </div>
      ) : (
        <div className="mt-8 flex flex-1 flex-col justify-end">
          <MiniRuler className="mb-5" track={track} value={null} />
          <Button variant="outline" size="sm" className="relative z-10 w-fit" asChild>
            <Link to={editPath}>{stats.moduleCount === 0 ? 'Add modules' : 'Add grades'}</Link>
          </Button>
        </div>
      )}
    </article>
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

  const degree = degrees.find((item) => item.id === degreeId)

  if (isDegreesLoading || isSemestersLoading) {
    return (
      <div role="status" className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <title>Semesters · Semest</title>
        <span className="sr-only">Loading</span>
        <div className="h-4 w-40 animate-pulse rounded-full bg-muted" />
        <div className="mt-4 h-16 w-64 animate-pulse rounded-full bg-muted" />
        <div className="mt-10 h-10 animate-pulse rounded-full bg-muted" />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-52 animate-pulse rounded-[22px] bg-muted" />
          ))}
        </div>
      </div>
    )
  }

  if (!degree || !degreeId) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-lg items-center px-4">
        <title>Semesters · Semest</title>
        <div className="w-full rounded-[22px] border border-dashed border-foreground/20 px-8 py-12 text-center">
          <MiniRuler track={bandsForScale([])} value={null} className="mb-8" />
          <h1 className="font-display text-3xl font-semibold tracking-tight">Degree not found</h1>
          <Button variant="outline" className="mt-6" onClick={() => navigate('/degrees')}>
            Back to Degrees
          </Button>
        </div>
      </div>
    )
  }

  const handleDelete = async (id: string, title: string, event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    if (!confirm(`Delete ${title}? Its modules and grades will be removed.`)) return
    try {
      await deleteSemester(id)
    } catch {
      // toast is handled in the hook
    }
  }

  const scale = degree.grade_scale?.grades || []
  const track = bandsForScale(scale, classBandsOf(degree.grade_scale))

  return (
    <div className="min-h-screen bg-background text-foreground">
      <title>{`${degree.title} · Semest`}</title>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="min-w-0">
          <Breadcrumb items={[{ label: degree.title }]} />
          <h1 className="font-display text-5xl font-semibold tracking-tight sm:text-7xl">
            {degree.title}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Manage semesters for this degree.
          </p>
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          {semesters.length > 0 ? (
            <LayoutToggle value={layout} onChange={chooseLayout} />
          ) : (
            <span />
          )}
          <Button className="ml-auto" onClick={() => navigate(`/degrees/${degreeId}/semesters/new`)}>
            New semester
          </Button>
        </div>

        {semesters.length === 0 ? (
          <EmptyState
            className="mt-12 rounded-[22px] border border-dashed border-foreground/20 px-8 py-12 text-center"
            title="No semesters yet"
            body="Add a semester to put a mark on the ruler."
            ruler={<MiniRuler track={track} value={null} className="mx-auto mb-8 max-w-sm" />}
            action={
              <Button variant="outline" onClick={() => navigate(`/degrees/${degreeId}/semesters/new`)}>
                Add semester
              </Button>
            }
          />
        ) : (
          <>
            <Ruler className="mt-10" track={track} markers={semesterPins(semesters, scale)} />
            <div className="mt-10">
              {layout === 'grid' ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {semesters.map((semester) => (
                    <SemesterCard
                      key={semester.id}
                      semester={semester}
                      degreeId={degreeId}
                      scale={scale}
                      track={track}
                      onDelete={(event) => handleDelete(semester.id, semester.title, event)}
                    />
                  ))}
                </div>
              ) : (
                <ol aria-label="Semesters in order" className="relative space-y-2 ps-10">
                  <span aria-hidden="true" className="absolute start-3 top-3 bottom-3 w-px bg-border" />
                  {semesters.map((semester, index) => (
                    <li key={semester.id} className="relative">
                      <span className="absolute -start-10 top-1/2 z-10 flex size-6 -translate-y-1/2 items-center justify-center rounded-full border border-foreground/25 bg-background text-xs tabular-nums text-muted-foreground">
                        {index + 1}
                      </span>
                      <SemesterCard
                        compact
                        semester={semester}
                        degreeId={degreeId}
                        scale={scale}
                        track={track}
                        onDelete={(event) => handleDelete(semester.id, semester.title, event)}
                      />
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function semesterPins(semesters: SemesterWithModules[], scale: GradeRow[]): RulerMarker[] {
  const pins: RulerMarker[] = []
  for (const semester of semesters) {
    if (!hasGradedWork(semester.modules, scale)) continue
    const score = computeScore(semester.modules, scale)
    pins.push({
      id: semester.id,
      value: score,
      label: semester.title,
      scoreLabel: formatGpa(score),
      kind: 'pin',
    })
  }
  return pins
}
