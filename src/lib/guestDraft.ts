import type { GradeRow } from './queries/gradeScales'
import type { ModuleData } from '@/components/calculator/ModuleRow'

export const GUEST_SCALE_LABEL = 'Standard 4.0'

export const GUEST_SCALE: GradeRow[] = [
  { grade: 'A+', points: 4.0 }, { grade: 'A', points: 4.0 }, { grade: 'A-', points: 3.7 },
  { grade: 'B+', points: 3.3 }, { grade: 'B', points: 3.0 }, { grade: 'B-', points: 2.7 },
  { grade: 'C+', points: 2.3 }, { grade: 'C', points: 2.0 }, { grade: 'C-', points: 1.7 },
  { grade: 'D+', points: 1.3 }, { grade: 'D', points: 1.0 }, { grade: 'F', points: 0.0 },
]

export type GuestDraft = {
  scaleLabel: string
  grades: GradeRow[]
  modules: ModuleData[]
}

export function saveGuestDraft(modules: ModuleData[]) {
  const draft: GuestDraft = { scaleLabel: GUEST_SCALE_LABEL, grades: GUEST_SCALE, modules }
  sessionStorage.setItem('semest_guest_draft', JSON.stringify(draft))
}

export function loadGuestDraft(raw: string): GuestDraft | null {
  const parsed = JSON.parse(raw) as GuestDraft | ModuleData[]
  if (Array.isArray(parsed)) {
    return { scaleLabel: GUEST_SCALE_LABEL, grades: GUEST_SCALE, modules: parsed }
  }
  if (!parsed || !Array.isArray(parsed.modules)) return null
  return {
    scaleLabel: parsed.scaleLabel || GUEST_SCALE_LABEL,
    grades: Array.isArray(parsed.grades) ? parsed.grades : GUEST_SCALE,
    modules: parsed.modules,
  }
}

export function sameGradeScale(a: GradeRow[], b: GradeRow[]): boolean {
  const key = (rows: GradeRow[]) =>
    rows
      .map((row) => `${row.grade.trim().toUpperCase()}:${Number(row.points)}`)
      .sort()
      .join('|')
  return key(a) === key(b)
}
