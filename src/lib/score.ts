import type { GradeRow } from './queries/gradeScales'

export type ModuleWithGrade = {
  credits: number
  grade: string
}

export const CLASSIFICATION_META: Record<string, { label: string; badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline'; color: string }> = {
  'First Class': { label: 'First Class', badgeVariant: 'default', color: 'bg-emerald-400 text-emerald-950' },
  'Second Upper': { label: 'Second Class (Upper)', badgeVariant: 'secondary', color: 'bg-blue-400 text-blue-950' },
  'Second Lower': { label: 'Second Class (Lower)', badgeVariant: 'secondary', color: 'bg-amber-400 text-amber-950' },
  'General Pass': { label: 'General Pass', badgeVariant: 'outline', color: 'bg-slate-400 text-slate-950' },
  'Fail': { label: 'Fail', badgeVariant: 'destructive', color: 'bg-rose-400 text-rose-950' },
  'Unknown': { label: 'Unknown', badgeVariant: 'outline', color: 'bg-slate-700 text-slate-300' },
}

export function totalCredits(modules: ModuleWithGrade[]): number {
  return modules.reduce((sum, mod) => sum + mod.credits, 0)
}

export function earnedCredits(modules: ModuleWithGrade[], scale: GradeRow[]): number {
  if (scale.length === 0) return 0
  const gradeToPoints = new Map<string, number>()
  scale.forEach(row => gradeToPoints.set(row.grade.trim().toUpperCase(), row.points))
  
  return modules.reduce((sum, mod) => {
    if (gradeToPoints.has(mod.grade.trim().toUpperCase())) {
      return sum + mod.credits
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
    const points = gradeToPoints.get(mod.grade.trim().toUpperCase())
    if (points !== undefined) {
      totalPoints += points * mod.credits
      validCredits += mod.credits
    }
  }

  if (validCredits === 0) return 0
  return Number((totalPoints / validCredits).toFixed(4))
}

export function classify(score: number): keyof typeof CLASSIFICATION_META {
  if (score >= 3.7) return 'First Class'
  if (score >= 3.3) return 'Second Upper'
  if (score >= 3.0) return 'Second Lower'
  if (score >= 2.0) return 'General Pass'
  if (score > 0) return 'Fail'
  return 'Unknown'
}
