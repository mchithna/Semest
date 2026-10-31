import { isUngradedGrade } from '@/lib/score'

export type DraftModule = {
  id?: string
  name: string
  credits: number
  grade: string
  retakesModuleId?: string | null
}

function sameFields(current: DraftModule, saved: DraftModule): boolean {
  const currentGrade = isUngradedGrade(current.grade) ? '' : current.grade
  const savedGrade = isUngradedGrade(saved.grade) ? '' : saved.grade
  return current.name === saved.name
    && Number(current.credits) === Number(saved.credits)
    && currentGrade === savedGrade
    && (current.retakesModuleId || null) === (saved.retakesModuleId || null)
}

/** True when the calculator still shows the untouched starter row. */
export function isUntouchedDraft(modules: DraftModule[]): boolean {
  return modules.length === 1 && sameFields(modules[0], {
    name: '',
    credits: 3,
    grade: '',
    retakesModuleId: null,
  })
}

/** True when the open semester still matches the saved modules, in order. */
export function modulesMatch(current: DraftModule[], saved: DraftModule[]): boolean {
  if (current.length !== saved.length) return false
  return current.every((mod, index) => {
    const other = saved[index]
    return mod.id === other.id && sameFields(mod, other)
  })
}
