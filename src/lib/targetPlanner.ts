import { formatGpa } from './score'

export type PlannerView =
  | { kind: 'number'; value: number; detail: string }
  | { kind: 'statement'; title: string; detail: string }
  | { kind: 'note'; detail: string }

export function requiredAverage(
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

export function plannerView({
  requiredGpa,
  target,
  targetLabel,
  remaining,
  remainingText,
  maxPoints,
  highestGpa,
}: {
  requiredGpa: number | null
  target: number | null
  targetLabel: string | null
  remaining: number
  remainingText: string
  maxPoints: number
  highestGpa: number
}): PlannerView {
  if (target === null) return { kind: 'note', detail: 'Choose a class to see the average you need.' }
  if (remainingText.trim() === '' || Number.isNaN(remaining) || remaining <= 0 || requiredGpa === null) {
    return { kind: 'note', detail: 'Enter the credits you still have to take.' }
  }
  if (requiredGpa <= 0) {
    return {
      kind: 'statement',
      title: 'Already secured',
      detail: `The ${creditsPhrase(remaining)} left cannot drop you below ${targetName(target, targetLabel)}.`,
    }
  }
  if (requiredGpa > maxPoints) {
    return {
      kind: 'statement',
      title: 'Out of reach',
      detail: `The ${creditsPhrase(remaining)} left would need to average ${formatGpa(requiredGpa)} to reach ${targetName(target, targetLabel)}. This scale tops out at ${formatGpa(maxPoints)}.`,
    }
  }

  const lead = `Across ${formatCredits(remaining)} credits still to take, to finish on ${formatGpa(target)}.`
  if (highestGpa <= 0) return { kind: 'number', value: requiredGpa, detail: lead }

  const delta = Math.round((requiredGpa - highestGpa) * 100) / 100
  const best = formatGpa(highestGpa)
  if (delta > 0) return { kind: 'number', value: requiredGpa, detail: `${lead} ${delta.toFixed(2)} above your best semester (${best}).` }
  if (delta < 0) return { kind: 'number', value: requiredGpa, detail: `${lead} ${Math.abs(delta).toFixed(2)} below your best semester (${best}).` }
  return { kind: 'number', value: requiredGpa, detail: `${lead} That matches your best semester (${best}).` }
}

function targetName(target: number, label: string | null): string {
  const name = label?.trim()
  return name ? name : formatGpa(target)
}

function creditsPhrase(value: number): string {
  const amount = formatCredits(value)
  const count = Math.round(value * 10) / 10
  return `${amount} ${count === 1 ? 'credit' : 'credits'}`
}

function formatCredits(value: number): string {
  const rounded = Math.round(value * 10) / 10
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
}
