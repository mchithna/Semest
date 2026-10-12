export type SemesterOrderKey = {
  sem_index: number
  created_at: string
  id?: string
}

/** Next index for a new semester. Empty degrees start at 0. */
export function nextSemesterIndex(existingIndexes: number[]): number {
  if (existingIndexes.length === 0) return 0
  return Math.max(...existingIndexes) + 1
}

/**
 * Chronological order. Equal indexes (older rows that were all saved as 0)
 * fall back to created time, then id.
 */
export function compareSemesters(a: SemesterOrderKey, b: SemesterOrderKey): number {
  if (a.sem_index !== b.sem_index) return a.sem_index - b.sem_index
  if (a.created_at !== b.created_at) return a.created_at < b.created_at ? -1 : 1
  if (a.id && b.id && a.id !== b.id) return a.id < b.id ? -1 : 1
  return 0
}
