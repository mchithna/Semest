export type PriorModuleOption = {
  id: string
  name: string
  semesterTitle: string
  semesterIndex: number
}

type SemesterSource = {
  id: string
  title: string
  sem_index: number
  modules: Array<{ id: string; name: string }>
}

export type PriorModuleGroup = {
  label: string
  modules: PriorModuleOption[]
}

/**
 * Modules a semester can replace. A new semester (beforeIndex null) can
 * replace anything already saved, because it is appended at the end.
 * An existing semester can replace only earlier semesters.
 */
export function earlierModuleOptions(
  semesters: SemesterSource[],
  beforeIndex: number | null,
): PriorModuleOption[] {
  return semesters
    .filter((semester) => beforeIndex === null || semester.sem_index < beforeIndex)
    .flatMap((semester) =>
      semester.modules.map((mod) => ({
        id: mod.id,
        name: mod.name,
        semesterTitle: semester.title,
        semesterIndex: semester.sem_index,
      })),
    )
    .sort((a, b) => a.semesterIndex - b.semesterIndex || a.name.localeCompare(b.name))
}

/** Same-name matches come first. Everything else stays grouped by semester. */
export function groupPriorModules(modules: PriorModuleOption[], currentName: string): PriorModuleGroup[] {
  const needle = currentName.trim().toLowerCase()
  const sameName = needle
    ? modules.filter((mod) => mod.name.trim().toLowerCase() === needle)
    : []
  const sameIds = new Set(sameName.map((mod) => mod.id))
  const groups: PriorModuleGroup[] = []

  if (sameName.length > 0) {
    groups.push({ label: 'Same name', modules: sameName })
  }

  const bySemester = new Map<string, PriorModuleOption[]>()
  for (const mod of modules) {
    if (sameIds.has(mod.id)) continue
    const key = `${mod.semesterIndex}:${mod.semesterTitle}`
    const list = bySemester.get(key) ?? []
    list.push(mod)
    bySemester.set(key, list)
  }

  for (const list of bySemester.values()) {
    groups.push({ label: list[0].semesterTitle, modules: list })
  }

  return groups
}

export function priorModuleLabel(mod: Pick<PriorModuleOption, 'name' | 'semesterTitle'>): string {
  return `${mod.name} · ${mod.semesterTitle}`
}

export function priorSemesterKey(mod: Pick<PriorModuleOption, 'semesterIndex' | 'semesterTitle'>): string {
  return `${mod.semesterIndex}:${mod.semesterTitle}`
}

/** Semesters in chronological order, one entry each. */
export function priorSemesters(modules: PriorModuleOption[]): { key: string; title: string }[] {
  const seen = new Set<string>()
  const semesters: { key: string; title: string }[] = []
  for (const mod of modules) {
    const key = priorSemesterKey(mod)
    if (seen.has(key)) continue
    seen.add(key)
    semesters.push({ key, title: mod.semesterTitle })
  }
  return semesters
}
