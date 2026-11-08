import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import type { GradeRow } from '@/lib/queries/gradeScales'
import { bandsForScale, type Band } from '@/lib/bands'
import { GPA_DECIMALS } from '@/lib/score'
import { plannerView, requiredAverage } from '@/lib/targetPlanner'
import { AnimatedNumber } from '@/components/ui/AnimatedNumber'

type TargetPredictorProps = {
  currentCgpa: number
  gradedCredits: number
  highestGpa: number
  gradeScale: GradeRow[]
  classBands?: Band[]
  initialRemaining?: number
  target: number | null
  onTargetChange: (value: number | null) => void
}

export function TargetPredictor({
  currentCgpa,
  gradedCredits,
  highestGpa,
  gradeScale,
  classBands = [],
  initialRemaining = 0,
  target,
  onTargetChange,
}: TargetPredictorProps) {
  const [remainingCredits, setRemainingCredits] = useState(
    initialRemaining > 0 ? String(initialRemaining) : '',
  )
  const track = bandsForScale(gradeScale, classBands)
  const labeledBands = track.bands.filter((band) => band.tone !== 'plain' && band.label)
  const maxPoints = gradeScale.length > 0 ? Math.max(...gradeScale.map((grade) => Number(grade.points))) : track.max

  useEffect(() => {
    setRemainingCredits(initialRemaining > 0 ? String(initialRemaining) : '')
  }, [initialRemaining])

  const remaining = Number(remainingCredits)
  const requiredGpa = requiredAverage(currentCgpa, gradedCredits, target, remaining)
  const targetLabel = labeledBands.find((band) => band.min === target)?.label ?? null
  const view = plannerView({
    requiredGpa,
    target,
    targetLabel,
    remaining,
    remainingText: remainingCredits,
    maxPoints,
    highestGpa,
  })

  return (
    <Card size="sm" className="gap-4 rounded-[22px] border-border bg-card p-5 shadow-none">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-foreground">Target planner</h2>
        <div className="flex items-center gap-2">
          <Label htmlFor="remaining-credits" className="text-xs text-muted-foreground">
            Credits left
          </Label>
          <Input
            id="remaining-credits"
            type="number"
            step="1"
            min="1"
            value={remainingCredits}
            onChange={(event) => setRemainingCredits(event.target.value)}
            className="h-8 w-16 px-2 text-right"
          />
        </div>
      </div>

      <div>
        {view.kind === 'number' ? (
          <>
            <p className="text-sm text-muted-foreground">You need an average of</p>
            <p className="mt-1 font-display text-5xl font-semibold tabular-nums tracking-tight text-band-first">
              <AnimatedNumber value={view.value} decimals={GPA_DECIMALS} />
            </p>
          </>
        ) : view.kind === 'statement' ? (
          <p className="text-2xl font-semibold text-foreground">{view.title}</p>
        ) : null}
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{view.detail}</p>
      </div>

      {labeledBands.length > 0 ? (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Target class">
          {labeledBands.map((band) => {
            const selected = target === band.min
            return (
              <Button
                key={band.id}
                type="button"
                size="sm"
                variant={selected ? 'default' : 'outline'}
                aria-pressed={selected}
                onClick={() => onTargetChange(band.min)}
              >
                {band.label}
              </Button>
            )
          })}
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="desired-cgpa">Target GPA</Label>
          <Input
            id="desired-cgpa"
            type="number"
            step="0.01"
            min="0"
            max={maxPoints}
            value={target ?? ''}
            onChange={(event) => {
              const next = Number(event.target.value)
              onTargetChange(event.target.value === '' || Number.isNaN(next) ? null : next)
            }}
          />
        </div>
      )}
    </Card>
  )
}

