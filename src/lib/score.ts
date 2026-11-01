import type { Band } from './bands'
import type { GradeRow } from './queries/gradeScales'

export type ModuleWithGrade = {
  credits: number
  grade: string
}

/** Postgres `numeric` columns arrive as strings. Addition would concatenate them. */
export function toCredits(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

export const CLASSIFICATION_META: Record<string, { label: string; badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline'; color: string }> = {
  'First Class': { label: 'First Class', badgeVariant: 'default', color: 'bg-emerald-400 text-emerald-950' },
  'Second Upper': { label: 'Second Class (Upper)', badgeVariant: 'secondary', color: 'bg-blue-400 text-blue-950' },
  'Second Lower': { label: 'Second Class (Lower)', badgeVariant: 'secondary', color: 'bg-amber-400 text-amber-950' },
  'General Pass': { label: 'General Pass', badgeVariant: 'outline', color: 'bg-slate-400 text-slate-950' },
  'Fail': { label: 'Fail', badgeVariant: 'destructive', color: 'bg-rose-400 text-rose-950' },
  'Unknown': { label: 'No Data', badgeVariant: 'outline', color: 'bg-slate-700 text-slate-300' },
}

/** Display precision for GPA. The calculation itself keeps four decimals. */
export const GPA_DECIMALS = 2

export function formatGpa(value: number): string {
  if (!Number.isFinite(value)) return '—'
  return value.toFixed(GPA_DECIMALS)
}

export const UNGRADED_GRADE = 'Not graded'

export function isUngradedGrade(grade: string): boolean {
  const normalized = grade.trim().toUpperCase()
  return normalized === '' || normalized === 'N/A' || normalized === UNGRADED_GRADE.toUpperCase()
}

function pointsByGrade(scale: GradeRow[]): Map<string, number> {
  const gradeToPoints = new Map<string, number>()
  for (const row of scale) gradeToPoints.set(row.grade.trim().toUpperCase(), Number(row.points))
  return gradeToPoints
}

export type RetakeModule = ModuleWithGrade & {
  id: string
  retakes_module_id?: string | null
}

/** Drops an earlier attempt when a later module points at it. The later attempt is kept. */
export function withoutReplacedAttempts<T extends { id: string; retakes_module_id?: string | null }>(modules: T[]): T[] {
  const replaced = new Set(
    modules.map((mod) => mod.retakes_module_id).filter((id): id is string => Boolean(id)),
  )
  return modules.filter((mod) => !replaced.has(mod.id))
}

export function totalCredits(modules: ModuleWithGrade[]): number {
  return modules.reduce((sum, mod) => sum + toCredits(mod.credits), 0)
}

/** Credits with a passing grade. A grade worth 0 points, such as F, is not earned. */
export function earnedCredits(modules: ModuleWithGrade[], scale: GradeRow[]): number {
  const gradeToPoints = pointsByGrade(scale)
  return modules.reduce((sum, mod) => {
    const points = gradeToPoints.get(mod.grade.trim().toUpperCase())
    if (points !== undefined && points > 0) return sum + toCredits(mod.credits)
    return sum
  }, 0)
}

/** Credits with any scale grade, including fails. This is the GPA denominator. */
export function attemptedCredits(modules: ModuleWithGrade[], scale: GradeRow[]): number {
  const gradeToPoints = pointsByGrade(scale)
  return modules.reduce((sum, mod) => {
    if (isUngradedGrade(mod.grade)) return sum
    if (gradeToPoints.has(mod.grade.trim().toUpperCase())) return sum + toCredits(mod.credits)
    return sum
  }, 0)
}

export function ungradedCredits(modules: ModuleWithGrade[], scale: GradeRow[]): number {
  const gradeToPoints = pointsByGrade(scale)
  return modules.reduce((sum, mod) => {
    if (isUngradedGrade(mod.grade) || !gradeToPoints.has(mod.grade.trim().toUpperCase())) {
      return sum + toCredits(mod.credits)
    }
    return sum
  }, 0)
}

export function computeScore(modules: ModuleWithGrade[], scale: GradeRow[]): number {
  if (modules.length === 0) return 0
  if (scale.length === 0) return 0

  const gradeToPoints = new Map<string, number>()
  scale.forEach(row => gradeToPoints.set(row.grade.trim().toUpperCase(), row.points))

  let totalPoints = 0
  let validCredits = 0

  for (const mod of modules) {
    if (isUngradedGrade(mod.grade)) continue
    const points = gradeToPoints.get(mod.grade.trim().toUpperCase())
    const credits = toCredits(mod.credits)
    if (points !== undefined) {
      totalPoints += points * credits
      validCredits += credits
    }
  }

  if (validCredits === 0) return 0
  return Number((totalPoints / validCredits).toFixed(4))
}

/** True when at least one module has a scale grade and a positive credit value. */
export function hasGradedWork(modules: ModuleWithGrade[], scale: GradeRow[]): boolean {
  return attemptedCredits(modules, scale) > 0
}

const CLASS_BY_TONE = {
  pass: 'General Pass',
  'second-lower': 'Second Lower',
  'second-upper': 'Second Upper',
  first: 'First Class',
} as const

export function classify(score: number, graded = false, classBands: Band[] = []): keyof typeof CLASSIFICATION_META {
  const bands = classBands
    .filter((band): band is Band & { tone: keyof typeof CLASS_BY_TONE } => band.tone !== 'plain')
    .sort((a, b) => b.min - a.min)
  if (bands.length === 0) return 'Unknown'
  for (const band of bands) {
    if (score >= band.min) return CLASS_BY_TONE[band.tone]
  }
  if (score > 0 || graded) return 'Fail'
  return 'Unknown'
}

export function standingLabel(score: number, graded: boolean, classBands: Band[] = []): string {
  if (!classBands.some((band) => band.tone !== 'plain')) return ''
  return CLASSIFICATION_META[classify(score, graded, classBands)].label
}
