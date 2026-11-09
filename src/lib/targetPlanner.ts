import { formatGpa } from './score'

export type PlannerTone = 'secured' | 'reach' | 'hard' | 'unreachable'

export type PlannerView =
  | { kind: 'number'; value: number; title: string; tone: PlannerTone; detail: string }
  | { kind: 'statement'; title: string; tone: PlannerTone; detail: string }
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

  const name = targetName(target, targetLabel)
  const credits = creditsPhrase(remaining)

  if (requiredGpa <= 0) {
    return {
      kind: 'statement',
      title: `${name} is already secured`,
      tone: 'secured',
      detail: `The ${credits} left cannot drop you below it.`,
    }
  }
  if (requiredGpa > maxPoints) {
    return {
      kind: 'statement',
      title: `${name} is out of reach`,
      tone: 'unreachable',
      detail: `Even a ${formatGpa(maxPoints)} on the ${credits} left is not enough. Reaching it would take ${formatGpa(requiredGpa)}.`,
    }
  }

  const task = `Average this on the ${credits} left to reach ${name}.`
  if (highestGpa <= 0) {
    return { kind: 'number', value: requiredGpa, title: 'Within reach', tone: 'reach', detail: task }
  }

  const delta = Math.round((requiredGpa - highestGpa) * 100) / 100
  const best = formatGpa(highestGpa)
  if (delta > 0) {
    return {
      kind: 'number',
      value: requiredGpa,
      title: 'This is hard',
      tone: 'hard',
      detail: `${task} That is above your best semester, ${best}.`,
    }
  }
  if (delta < 0) {
    return {
      kind: 'number',
      value: requiredGpa,
      title: 'Within reach',
      tone: 'reach',
      detail: `${task} That is below your best semester, ${best}.`,
    }
  }
  return {
    kind: 'number',
    value: requiredGpa,
    title: 'Within reach',
    tone: 'reach',
    detail: `${task} That matches your best semester, ${best}.`,
  }
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
