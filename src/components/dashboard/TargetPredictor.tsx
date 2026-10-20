import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import type { GradeRow } from '@/lib/queries/gradeScales'
import { bandsForScale } from '@/lib/bands'
import { formatGpa, GPA_DECIMALS } from '@/lib/score'

type TargetPredictorProps = {
  currentCgpa: number
  gradedCredits: number
  highestGpa: number
  gradeScale: GradeRow[]
  initialRemaining?: number
  target: number | null
  onTargetChange: (value: number | null) => void
}

export function TargetPredictor({
  currentCgpa,
  gradedCredits,
  highestGpa,
  gradeScale,
  initialRemaining = 0,
  target,
  onTargetChange,
}: TargetPredictorProps) {
  const [remainingCredits, setRemainingCredits] = useState(
    initialRemaining > 0 ? String(initialRemaining) : '',
  )
  const track = bandsForScale(gradeScale)
  const classBands = track.bands.filter((band) => band.tone !== 'plain' && band.label)
  const maxPoints = gradeScale.length > 0 ? Math.max(...gradeScale.map((grade) => Number(grade.points))) : track.max

  useEffect(() => {
    setRemainingCredits(initialRemaining > 0 ? String(initialRemaining) : '')
  }, [initialRemaining])

  const remaining = Number(remainingCredits)
  const requiredGpa = requiredAverage(currentCgpa, gradedCredits, target, remaining)

  return (
    <Card className="rounded-[22px] border-border bg-card p-6 shadow-none">
      <h2 className="text-lg font-semibold text-foreground">Target planner</h2>

      {classBands.length > 0 ? (
        <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Target class">
          {classBands.map((band) => {
            const selected = target === band.min
            return (
              <Button
                key={band.id}
                type="button"
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
        <div className="mt-5 space-y-2">
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

      <div className="mt-8">
        <p className="text-sm text-muted-foreground">You need an average of</p>
        {requiredGpa !== null && requiredGpa > 0 && requiredGpa <= maxPoints ? (
          <p className="mt-1 font-display text-6xl font-semibold tabular-nums tracking-tight text-band-first">
            {requiredGpa.toFixed(GPA_DECIMALS)}
          </p>
        ) : (
          <p className="mt-3 text-2xl font-semibold text-foreground">
            {requiredGpa !== null && requiredGpa <= 0 ? 'Already secured' : '—'}
          </p>
        )}
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {plannerCopy({
            requiredGpa,
            target,
            remaining,
            remainingText: remainingCredits,
            maxPoints,
            highestGpa,
          })}
        </p>
      </div>

      <div className="mt-6 space-y-2">
        <Label htmlFor="remaining-credits">Remaining credits</Label>
        <Input
          id="remaining-credits"
          type="number"
          step="1"
          min="1"
          value={remainingCredits}
          onChange={(event) => setRemainingCredits(event.target.value)}
        />
      </div>
    </Card>
  )
}

function requiredAverage(
  currentCgpa: number,
  gradedCredits: number,
  target: number | null,
  remaining: number,
): number | null {
  if (target === null || Number.isNaN(target) || Number.isNaN(remaining) || remaining <= 0) return null
  if (gradedCredits === 0) return target
  const needed = target * (gradedCredits + remaining) - currentCgpa * gradedCredits
  return needed / remaining
}

function plannerCopy({
  requiredGpa,
  target,
  remaining,
  remainingText,
  maxPoints,
  highestGpa,
}: {
  requiredGpa: number | null
  target: number | null
  remaining: number
  remainingText: string
  maxPoints: number
  highestGpa: number
}): string {
  if (target === null) return 'Choose a class to see the average you need.'
  if (remainingText.trim() === '' || Number.isNaN(remaining) || remaining <= 0) {
    return 'Enter the credits you still have to take.'
  }
  if (requiredGpa === null) return 'Enter the credits you still have to take.'
  if (requiredGpa <= 0) return 'You have already secured this target.'
  if (requiredGpa > maxPoints) return 'That average is above the top of this scale.'

  const lead = `across your remaining ${formatCredits(remaining)} credits to finish on ${formatGpa(target)}.`
  if (highestGpa <= 0) return lead

  const delta = Math.round((requiredGpa - highestGpa) * 100) / 100
  const best = formatGpa(highestGpa)
  if (delta > 0) {
    return `${lead} That is ${delta.toFixed(2)} above your best semester so far (${best}), so the remaining semesters have to beat it on average.`
  }
  if (delta < 0) {
    return `${lead} That is ${Math.abs(delta).toFixed(2)} below your best semester so far (${best}).`
  }
  return `${lead} That matches your best semester so far (${best}).`
}

function formatCredits(value: number): string {
  const rounded = Math.round(value * 10) / 10
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
}
