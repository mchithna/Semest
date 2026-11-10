import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { CreateDegreeDialog } from '@/components/degrees/CreateDegreeDialog'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { Ruler } from '@/components/ruler/Ruler'
import { bandColor } from '@/components/ruler/tone'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useDegrees } from '@/hooks/useDegrees'
import { useSemesters } from '@/hooks/useSemesters'
import { bandsForScale, DEFAULT_CLASS_CUTS, expandClassCuts, parseClassCuts, type ClassCut } from '@/lib/bands'
import {
  BAND_LIMIT,
  bandDraftIssues,
  blankBandDraft,
  cutsToDraft,
  draftCuts,
  draftMatchesCuts,
  isCustomClassCuts,
  lowestStart,
  previewCuts,
  runsToValue,
  scaleTopOf,
  type BandDraft,
} from '@/lib/classBandEditor'
import { friendlyError } from '@/lib/errors'
import type { DegreeWithScale } from '@/lib/queries/degrees'
import type { GradeRow } from '@/lib/queries/gradeScales'
import { formatGpa, hasGradedWork } from '@/lib/score'

function savedCuts(degree: DegreeWithScale): ClassCut[] {
  const own = parseClassCuts(degree.class_bands)
  return own.length > 0 ? own : DEFAULT_CLASS_CUTS
}

export default function ClassificationPage() {
  const { degreeId = '' } = useParams()
  const navigate = useNavigate()
  const { degrees, isLoading, updateDegree } = useDegrees()
  const { semesters } = useSemesters(degreeId)
  const [scaleOpen, setScaleOpen] = useState(false)
  const degree = degrees.find((item) => item.id === degreeId)

  if (isLoading) {
    return (
      <div role="status" className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <title>Classification · Semest</title>
        <span className="sr-only">Loading</span>
        <div className="h-8 w-48 animate-pulse rounded-full bg-muted" />
        <div className="mt-6 h-16 w-80 animate-pulse rounded-full bg-muted" />
        <div className="mt-10 h-40 animate-pulse rounded-[22px] bg-muted" />
      </div>
    )
  }

  if (!degree) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-lg items-center px-4">
        <title>Classification · Semest</title>
        <div className="w-full rounded-[22px] border border-dashed border-foreground/20 px-8 py-12 text-center">
          <h1 className="font-display text-3xl font-semibold tracking-tight">Degree not found</h1>
          <Button variant="outline" className="mt-6" onClick={() => navigate('/degrees')}>
            Back to Degrees
          </Button>
        </div>
      </div>
    )
  }

  const grades = degree.grade_scale?.grades ?? []
  const scaleTop = scaleTopOf(grades)
  const graded = semesters.some((semester) => hasGradedWork(semester.modules, grades))

  return (
    <div className="min-h-screen bg-background text-foreground">
      <title>{`Classification · ${degree.title} · Semest`}</title>
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <Breadcrumb
          items={[
            { label: degree.title, path: `/degrees/${degree.id}/semesters` },
            { label: 'Classification' },
          ]}
        />
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-5xl font-semibold tracking-tight sm:text-6xl">Classification</h1>
          {isCustomClassCuts(degree.class_bands) ? <Badge variant="outline">Custom bands</Badge> : null}
        </div>
        <p className="mt-3 max-w-xl text-sm text-muted-foreground">
          Bands decide your class. They are saved with this degree, and presets you share carry them too.
        </p>

        {scaleTop == null ? (
          <div className="mt-10 rounded-[22px] border border-dashed border-foreground/20 px-8 py-12 text-center">
            <h2 className="font-display text-3xl font-semibold tracking-tight">Choose a grade scale first</h2>
            <p className="mx-auto mt-3 max-w-sm text-sm text-muted-foreground">
              Classification uses the top grade on the scale. Pick a scale for this degree, then set its bands.
            </p>
            <Button className="mt-6" onClick={() => setScaleOpen(true)}>
              Choose a scale
            </Button>
          </div>
        ) : (
          <ClassificationEditor
            key={`${degree.id}:${scaleTop}`}
            grades={grades}
            scaleTop={scaleTop}
            saved={savedCuts(degree)}
            graded={graded}
            onSave={(cuts) => updateDegree({ id: degree.id, class_bands: cuts })}
          />
        )}
      </div>

      <CreateDegreeDialog
        open={scaleOpen}
        onOpenChange={setScaleOpen}
        initialData={degree}
        onSave={async (data) => {
          await updateDegree({ id: degree.id, ...data })
          toast.success('Degree updated')
        }}
      />
    </div>
  )
}

function ClassificationEditor({
  grades,
  scaleTop,
  saved,
  graded,
  onSave,
}: {
  grades: GradeRow[]
  scaleTop: number
  saved: ClassCut[]
  graded: boolean
  onSave: (cuts: ClassCut[]) => Promise<unknown>
}) {
  const sourceKey = JSON.stringify(saved)
  const [rows, setRows] = useState<BandDraft[]>(() => cutsToDraft(saved))
  const [appliedKey, setAppliedKey] = useState(sourceKey)
  const [saving, setSaving] = useState(false)

  if (appliedKey !== sourceKey) {
    setAppliedKey(sourceKey)
    setRows(cutsToDraft(saved))
  }

  const issues = bandDraftIssues(rows, scaleTop)
  const issueByKey = new Map(issues.map((issue) => [issue.key, issue]))
  const cuts = draftCuts(rows, scaleTop)
  const dirty = !draftMatchesCuts(rows, saved)
  const canSave = cuts != null && dirty && !saving
  const preview = previewCuts(rows, scaleTop)
  const track = bandsForScale(grades, preview.length > 0 ? expandClassCuts(preview, scaleTop) : [])
  const floor = lowestStart(rows)
  const atLimit = rows.length >= BAND_LIMIT

  const updateRow = (key: string, patch: Partial<Pick<BandDraft, 'label' | 'min'>>) => {
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)))
  }

  const save = async () => {
    if (!cuts) return
    setSaving(true)
    try {
      await onSave(cuts)
      toast.success('Classification saved')
    } catch (err: unknown) {
      toast.error(friendlyError(err, "Couldn't save the classification. Try again."))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form
      className="mt-8"
      onSubmit={(event) => {
        event.preventDefault()
        if (canSave) void save()
      }}
    >
      <Ruler track={track} />

      <div className="mt-8 flex items-baseline justify-between gap-3">
        <h2 className="text-base font-semibold">Bands</h2>
        <p className="text-sm tabular-nums text-muted-foreground">
          {rows.length} of {BAND_LIMIT}
        </p>
      </div>

      <div className="mt-4 hidden grid-cols-[0.625rem_minmax(0,1fr)_6.5rem_5.75rem_2.25rem] gap-3 px-1 text-xs text-muted-foreground sm:grid">
        <span />
        <span>Name</span>
        <span>Starts at</span>
        <span>Runs to</span>
        <span className="sr-only">Remove</span>
      </div>

      <ul className="mt-2 space-y-3" aria-label="Classification bands">
        {rows.map((row, index) => {
          const issue = issueByKey.get(row.key)
          const errorId = `band-error-${row.key}`
          const runs = runsToValue(rows, index, scaleTop)
          const name = row.label.trim() || `band ${index + 1}`
          return (
            <li key={row.key}>
              <div className="grid grid-cols-[0.625rem_minmax(0,1fr)_2.25rem] items-center gap-x-3 gap-y-2 sm:grid-cols-[0.625rem_minmax(0,1fr)_6.5rem_5.75rem_2.25rem]">
                <span
                  aria-hidden="true"
                  className="size-2.5 justify-self-center rounded-full"
                  style={{ backgroundColor: bandColor(index, rows.length) }}
                />
                <Input
                  aria-label={`Name for ${name}`}
                  value={row.label}
                  aria-invalid={issue?.field === 'label' || undefined}
                  aria-describedby={issue ? errorId : undefined}
                  onChange={(event) => updateRow(row.key, { label: event.target.value })}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="col-start-3 row-start-1 justify-self-end sm:col-start-5"
                  aria-label={`Remove ${name}`}
                  disabled={rows.length <= 2}
                  onClick={() => setRows((current) => current.filter((item) => item.key !== row.key))}
                >
                  <X />
                </Button>
                <div className="col-start-2 flex items-center gap-3 sm:contents">
                  <Input
                    className="w-24 tabular-nums sm:w-full"
                    inputMode="decimal"
                    aria-label={`Starts at for ${name}`}
                    value={row.min}
                    aria-invalid={issue?.field === 'min' || undefined}
                    aria-describedby={issue ? errorId : undefined}
                    onChange={(event) => updateRow(row.key, { min: event.target.value })}
                    onBlur={() => {
                      const text = row.min.trim()
                      if (/^\d+(\.\d+)?$/.test(text)) updateRow(row.key, { min: formatGpa(Number(text)) })
                    }}
                  />
                  <p className="text-sm tabular-nums text-muted-foreground">
                    to {runs == null ? '—' : formatGpa(runs)}
                  </p>
                </div>
              </div>
              {issue ? (
                <p id={errorId} className="mt-1 ps-5 text-sm text-destructive">
                  {issue.message}
                </p>
              ) : null}
            </li>
          )
        })}
      </ul>

      <Button
        type="button"
        variant="outline"
        className="mt-4 w-full"
        disabled={atLimit}
        onClick={() => setRows((current) => [...current, blankBandDraft()])}
      >
        Add band
      </Button>

      <div className="mt-3 space-y-2 text-sm text-muted-foreground" aria-live="polite">
        <p>
          Anything below {formatGpa(floor ?? DEFAULT_CLASS_CUTS[0].min)} is not classified. Bands are sorted by where they start, so you never leave gaps or overlaps.
        </p>
        {atLimit ? <p>Remove a band to add another. Eight is the most a ruler can show clearly.</p> : null}
        {issues.length > 0 ? <p className="text-destructive">Saving is paused until this is fixed.</p> : null}
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-foreground/10 pt-6">
        <Button
          type="button"
          variant="outline"
          disabled={draftMatchesCuts(rows, DEFAULT_CLASS_CUTS) || saving}
          onClick={() => setRows(cutsToDraft(DEFAULT_CLASS_CUTS))}
        >
          Reset to default
        </Button>
        <div className="flex flex-wrap items-center justify-end gap-3">
          {graded && dirty ? <p className="text-sm text-muted-foreground">Your class may change.</p> : null}
          <Button type="submit" disabled={!canSave}>
            {saving ? 'Saving' : 'Save'}
          </Button>
        </div>
      </div>
    </form>
  )
}
