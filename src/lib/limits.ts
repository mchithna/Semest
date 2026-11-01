/** Caps shared by the forms and the database checks. */
export const LIMITS = {
  displayName: 80,
  degreeTitle: 120,
  institution: 120,
  semesterTitle: 80,
  term: 40,
  moduleName: 120,
  grade: 32,
  modulesPerSemester: 60,
  presetTitle: 120,
  presetDescription: 500,
  scaleLabel: 80,
  scaleGrade: 32,
  gradesPerScale: 40,
  creditsMax: 999.9,
  /** New passwords and resets. Sign-in stays at 6 so existing accounts still work. */
  passwordMin: 8,
  passwordMax: 72,
  signInPasswordMin: 6,
} as const

export function textError(value: string | null | undefined, max: number, label: string): string | null {
  if (value == null || value.length <= max) return null
  return `${label} must be ${max} characters or fewer`
}

export function assertText(value: string | null | undefined, max: number, label: string) {
  const message = textError(value, max, label)
  if (message) throw new Error(message)
}

export function assertSemester(
  title: string,
  term: string | null,
  modules: { name?: string; grade?: string; credits: number }[],
) {
  assertText(title, LIMITS.semesterTitle, 'Semester title')
  assertText(term, LIMITS.term, 'Term')
  if (modules.length > LIMITS.modulesPerSemester) {
    throw new Error(`A semester can have at most ${LIMITS.modulesPerSemester} modules`)
  }
  for (const mod of modules) {
    assertText(mod.name, LIMITS.moduleName, 'Module name')
    assertText(mod.grade, LIMITS.grade, 'Grade')
    if (!(mod.credits > 0) || mod.credits > LIMITS.creditsMax) {
      throw new Error(`Credits must be greater than 0 and at most ${LIMITS.creditsMax}`)
    }
  }
}

export function assertGradeScale(label: string, grades: { grade: string; points: number }[]) {
  assertText(label, LIMITS.scaleLabel, 'Scale name')
  if (grades.length > LIMITS.gradesPerScale) {
    throw new Error(`A scale can have at most ${LIMITS.gradesPerScale} grades`)
  }
  for (const row of grades) {
    assertText(row.grade, LIMITS.scaleGrade, 'Grade')
    if (!(row.points >= 0) || row.points > 100) {
      throw new Error('Points must be between 0 and 100')
    }
  }
}
