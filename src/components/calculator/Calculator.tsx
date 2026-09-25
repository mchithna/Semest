import { useState, useEffect } from 'react'
import { Plus, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import confetti from 'canvas-confetti'
import { ModuleRow, type ModuleData } from './ModuleRow'
import type { GradeRow } from '@/lib/queries/gradeScales'
import { computeScore, hasGradedWork, totalCredits } from '@/lib/score'
import { AnimatedNumber } from '@/components/ui/AnimatedNumber'
import { ClassificationBadge } from '@/components/ui/ClassificationBadge'

type CalculatorProps = {
  initialModules?: ModuleData[]
  gradeScale: GradeRow[]
  onSave?: (modules: ModuleData[]) => void
  isSaving?: boolean
}

export function Calculator({
  initialModules = [],
  gradeScale,
  onSave,
  isSaving = false,
}: CalculatorProps) {
  const [modules, setModules] = useState<ModuleData[]>(
    initialModules.length > 0
      ? initialModules
      : [{ id: crypto.randomUUID(), name: '', credits: 3, grade: '' }]
  )

  const score = computeScore(modules, gradeScale)
  const credits = totalCredits(modules)
  const graded = hasGradedWork(modules, gradeScale)

  // Trigger confetti when score hits First Class threshold
  useEffect(() => {
    if (score >= 3.7 && credits >= 12) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#aa3bff', '#c084fc', '#f4f3ec'],
      })
    }
  }, [score, credits])

  const handleAddModule = () => {
    setModules([
      ...modules,
      { id: crypto.randomUUID(), name: '', credits: 3, grade: '' },
    ])
  }

  const handleUpdateModule = (id: string, field: keyof Omit<ModuleData, 'id'>, value: string | number) => {
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
        Add Module
      </Button>

      <div className="h-px bg-border/50 w-full" />

      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-sm text-muted-foreground font-medium">Total Credits</span>
          <span className="text-2xl font-mono text-foreground font-semibold">
            <AnimatedNumber value={credits} decimals={1} />
          </span>
        </div>

        <div className="flex flex-col items-end gap-1">
          <span className="text-sm text-muted-foreground font-medium flex items-center gap-2">
            GPA <ClassificationBadge score={score} graded={graded} />
          </span>
          <span className="text-4xl font-mono font-bold tracking-tight text-primary">
            <AnimatedNumber value={score} decimals={4} />
          </span>
        </div>
      </div>

      {onSave && (
        <Button
          className="w-full mt-2"
          onClick={() => onSave(modules)}
          disabled={isSaving || modules.length === 0}
        >
          {isSaving ? (
            <span className="animate-pulse">Saving...</span>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Semester
            </>
          )}
        </Button>
      )}
    </Card>
  )
}
