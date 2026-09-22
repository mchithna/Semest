import { describe, it, expect } from 'vitest'
import { compareSemesters, nextSemesterIndex } from './semesterOrder'

describe('Semester order', () => {
  it('starts the first semester at index 0', () => {
    expect(nextSemesterIndex([])).toBe(0)
  })

  it('uses one past the highest existing index', () => {
    expect(nextSemesterIndex([0])).toBe(1)
    expect(nextSemesterIndex([0, 0, 0])).toBe(1)
    expect(nextSemesterIndex([0, 2, 1])).toBe(3)
  })

  it('sorts by index, then created time when indexes tie', () => {
    const rows = [
      { id: 'c', sem_index: 0, created_at: '2026-03-01T00:00:00Z' },
      { id: 'a', sem_index: 0, created_at: '2026-01-01T00:00:00Z' },
      { id: 'b', sem_index: 1, created_at: '2026-02-01T00:00:00Z' },
    ]

    expect([...rows].sort(compareSemesters).map((row) => row.id)).toEqual(['a', 'c', 'b'])
  })

  it('breaks a remaining tie by id', () => {
    const rows = [
      { id: 'b', sem_index: 0, created_at: '2026-01-01T00:00:00Z' },
      { id: 'a', sem_index: 0, created_at: '2026-01-01T00:00:00Z' },
    ]

    expect([...rows].sort(compareSemesters).map((row) => row.id)).toEqual(['a', 'b'])
  })
})
