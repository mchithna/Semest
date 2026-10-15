import { useRef, useState, useEffect } from 'react'
import { Plus, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import confetti from 'canvas-confetti'
import { ModuleRow, type ModuleData, type PriorModuleOption } from './ModuleRow'
import type { GradeRow } from '@/lib/queries/gradeScales'
import { computeScore, GPA_DECIMALS, hasGradedWork, honorsApply, totalCredits } from '@/lib/score'
import { AnimatedNumber } from '@/components/ui/AnimatedNumber'
import { prefersReducedMotion } from '@/lib/motion'
import { ClassificationBadge } from '@/components/ui/ClassificationBadge'
import { isUntouchedDraft, modulesMatch } from '@/lib/semesterDraft'

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
}

export function Calculator({
  initialModules = [],
  gradeScale,
  priorModules = [],
  onSave,
  isSaving = false,
  baselineModules,
  detailsChanged = false,
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

  useEffect(() => {
    const previous = previousScore.current
    const isFirst = score >= 3.7 && credits >= 12
    const wasFirst = previous !== null && previous.score >= 3.7 && previous.credits >= 12
    if (previous && isFirst && !wasFirst && !prefersReducedMotion()) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#aa3bff', '#c084fc', '#f4f3ec'],
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
      modules.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    )
  }

  const handleRemoveModule = (id: string) => {
    setModules(modules.filter((m) => m.id !== id))
  }

  return (
    <Card className="p-6 w-full max-w-2xl mx-auto flex flex-col gap-6 shadow-xl relative overflow-hidden bg-background/50 backdrop-blur-md border-border/50">
      <div className="flex flex-col gap-3">
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

      <Button
        variant="outline"
        className="w-full border-dashed"
        onClick={handleAddModule}
      >
        <Plus className="w-4 h-4 mr-2" />
        Add module
      </Button>

      <div className="h-px bg-border/50 w-full" />

      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-sm text-muted-foreground font-medium">Total credits</span>
          <span className="text-2xl font-mono tabular-nums text-foreground font-semibold">
            <AnimatedNumber value={credits} decimals={1} />
          </span>
        </div>

        <div className="flex flex-col items-end gap-1">
          <span className="text-sm text-muted-foreground font-medium flex items-center gap-2">
            GPA {honorsApply(gradeScale) && <ClassificationBadge score={score} graded={graded} />}
          </span>
          <span className="text-4xl font-mono font-bold tracking-tight tabular-nums text-primary">
            <AnimatedNumber value={score} decimals={GPA_DECIMALS} />
          </span>
        </div>
      </div>

      {onSave && (
        <Button
          className="w-full mt-2"
          onClick={() => onSave(modules)}
          disabled={isSaving || !canSave}
        >
          {isSaving ? (
            <span className="animate-pulse">Saving...</span>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save semester
            </>
          )}
        </Button>
      )}
    </Card>
  )
}
