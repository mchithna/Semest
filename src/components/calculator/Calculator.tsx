import { useRef, useState, useEffect, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import confetti from 'canvas-confetti'
import { ModuleRow, type ModuleData, type PriorModuleOption } from './ModuleRow'
import type { GradeRow } from '@/lib/queries/gradeScales'
import { computeScore, formatGpa, hasGradedWork, isUngradedGrade, totalCredits, type RetakeModule } from '@/lib/score'
import { AnimatedNumber } from '@/components/ui/AnimatedNumber'
import { prefersReducedMotion } from '@/lib/motion'
import { isUntouchedDraft, modulesMatch } from '@/lib/semesterDraft'
import { CLASS_CUTOFFS, bandAt, bandsForScale, standingSentence } from '@/lib/bands'
import { MiniRuler } from '@/components/ruler/MiniRuler'
import { BAND_TEXT_CLASS } from '@/components/ruler/tone'
import { projectCumulative } from '@/lib/semesterProjection'
import { cn } from '@/lib/utils'

const CONFETTI_COLORS = ['#5B6CFF', '#38B6C9', '#E6B84A', '#F07A5A']

type CalculatorProps = {
  initialModules?: ModuleData[]
  gradeScale: GradeRow[]
  priorModules?: PriorModuleOption[]
  onSave?: (modules: ModuleData[]) => void
  isSaving?: boolean
  /** Saved modules for an existing semester. A new semester has no baseline. */
  baselineModules?: ModuleData[]
  /** Title or term differs from the values the page opened with. */
  detailsChanged?: boolean
  /** Title and term fields, rendered above the module list. */
  details?: ReactNode
  /**
   * Modules from the rest of the degree. When set, the result card shows the
   * cumulative GPA before and after this draft is saved. Omit it for the guest calculator.
   */
  savedElsewhere?: RetakeModule[]
  className?: string
}

export function Calculator({
  initialModules = [],
  gradeScale,
  priorModules = [],
  onSave,
  isSaving = false,
  baselineModules,
  detailsChanged = false,
  details,
  savedElsewhere,
  className,
}: CalculatorProps) {
  const [modules, setModules] = useState<ModuleData[]>(
    initialModules.length > 0
      ? initialModules
      : [{ id: crypto.randomUUID(), name: '', credits: 3, grade: '' }]
  )

  const modulesChanged = baselineModules
    ? !modulesMatch(modules, baselineModules)
    : !isUntouchedDraft(modules)
  const canSave = (modulesChanged || detailsChanged) && modules.length > 0
  const score = computeScore(modules, gradeScale)
  const credits = totalCredits(modules)
  const graded = hasGradedWork(modules, gradeScale)
  const previousScore = useRef<{ score: number; credits: number } | null>(null)
  const track = bandsForScale(gradeScale)
  const band = graded ? bandAt(score, track) : null
  const sentence = standingSentence(score, graded, track)
  const showCumulative = savedElsewhere !== undefined
  const projection = showCumulative
    ? projectCumulative(savedElsewhere, (baselineModules ?? []).map(asRetake), modules.map(asRetake), gradeScale)
    : null
  const unmarked = modules
    .filter((mod) => mod.name.trim() && isUngradedGrade(mod.grade))
    .map((mod) => mod.name.trim())

  useEffect(() => {
    const previous = previousScore.current
    const isFirst = score >= CLASS_CUTOFFS.first && credits >= 12
    const wasFirst = previous !== null && previous.score >= CLASS_CUTOFFS.first && previous.credits >= 12
    if (previous && isFirst && !wasFirst && !prefersReducedMotion()) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: CONFETTI_COLORS,
      })
    }
    previousScore.current = { score, credits }
  }, [score, credits])

  const handleAddModule = () => {
    setModules([
      ...modules,
      { id: crypto.randomUUID(), name: '', credits: 3, grade: '' },
    ])
  }

  const handleUpdateModule = (id: string, field: keyof Omit<ModuleData, 'id'>, value: string | number | null) => {
    setModules(
      modules.map((mod) => (mod.id === id ? { ...mod, [field]: value } : mod))
    )
  }

  const handleRemoveModule = (id: string) => {
    setModules(modules.filter((mod) => mod.id !== id))
  }

  const save = () => onSave?.(modules)

  return (
    <div className={cn('grid items-start gap-8 pb-24 lg:grid-cols-[minmax(0,1fr)_22rem] lg:pb-0', className)}>
      <div>
        {details}
        <div className={cn('flex items-baseline justify-between gap-3', details ? 'mt-8' : undefined)}>
          <h2 className="text-lg font-semibold">Modules</h2>
          <p className="text-sm text-muted-foreground">
            {modules.length} {modules.length === 1 ? 'module' : 'modules'}, {credits.toFixed(1)} credits
          </p>
        </div>
        <div className="mt-4 hidden grid-cols-[minmax(0,1fr)_5.5rem_8.5rem_2.25rem] gap-2 px-1 text-xs text-muted-foreground sm:grid">
          <span>Module</span>
          <span>Credits</span>
          <span>Grade</span>
          <span className="sr-only">Remove</span>
        </div>
        <div className="mt-2 flex flex-col gap-3">
          {modules.map((module) => (
            <ModuleRow
              key={module.id}
              module={module}
              gradeScale={gradeScale}
              priorModules={priorModules}
              onChange={handleUpdateModule}
              onRemove={handleRemoveModule}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={handleAddModule}
          className="mt-4 flex h-11 w-full items-center justify-center rounded-full border border-dashed border-foreground/25 text-sm text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
        >
          Add module
        </button>
      </div>

      <aside className="rounded-[22px] bg-card p-6 lg:sticky lg:top-24">
        <p className="text-sm text-muted-foreground">Semester GPA</p>
        <p className="mt-1 font-display text-6xl font-semibold tabular-nums tracking-tight">
          {graded ? <AnimatedNumber value={score} decimals={2} /> : '—'}
        </p>
        {sentence && (
          <p className={cn('mt-1 text-sm font-medium', BAND_TEXT_CLASS[band?.tone ?? 'plain'])}>{sentence}</p>
        )}
        <MiniRuler className="mt-5" track={track} value={graded ? score : null} />

        {projection && (
          <div className="mt-6 border-t border-border/70 pt-5">
            <p className="text-sm text-muted-foreground">Cumulative GPA after saving</p>
            <p className="mt-2 flex items-baseline gap-3 font-display text-3xl font-semibold tabular-nums tracking-tight">
              <span>{projection.beforeGraded ? formatGpa(projection.before) : '—'}</span>
              <span aria-hidden="true" className="text-xl text-muted-foreground">→</span>
              <span>{projection.afterGraded ? formatGpa(projection.after) : '—'}</span>
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {projectionNote(projection.gradedCredits, unmarked)}
            </p>
          </div>
        )}

        {onSave && (
          <Button className="mt-6 hidden w-full lg:inline-flex" onClick={save} disabled={isSaving || !canSave}>
            {isSaving ? 'Saving...' : 'Save semester'}
          </Button>
        )}
      </aside>

      {onSave && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/95 px-4 py-3 backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Semester GPA</p>
              <p className="font-display text-3xl font-semibold tabular-nums">{graded ? formatGpa(score) : '—'}</p>
            </div>
            <Button onClick={save} disabled={isSaving || !canSave}>
              {isSaving ? 'Saving...' : 'Save semester'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function asRetake(module: ModuleData): RetakeModule {
  return {
    id: module.id,
    credits: module.credits,
    grade: module.grade,
    retakes_module_id: module.retakesModuleId || null,
  }
}

function projectionNote(gradedCredits: number, unmarked: string[]): string {
  const base = gradedCredits > 0
    ? `Based on ${gradedCredits.toFixed(1)} graded ${gradedCredits === 1 ? 'credit' : 'credits'}.`
    : 'No credits are graded yet.'
  if (unmarked.length === 0) return base
  const names = unmarked.length === 1
    ? unmarked[0]
    : `${unmarked.slice(0, -1).join(', ')} and ${unmarked[unmarked.length - 1]}`
  return `${base} ${names} ${unmarked.length === 1 ? 'is' : 'are'} not graded yet.`
}
