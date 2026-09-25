import { describe, it, expect } from 'vitest'
import { computeScore, totalCredits, earnedCredits, classify, toCredits, type ModuleWithGrade } from './score'
import type { GradeRow } from './queries/gradeScales'

describe('Score Logic', () => {
  const scale: GradeRow[] = [
    { grade: 'A+', points: 4.2 },
    { grade: 'A', points: 4.0 },
    { grade: 'A-', points: 3.7 },
    { grade: 'B', points: 3.0 },
    { grade: 'C', points: 2.0 },
    { grade: 'F', points: 0.0 },
  ]

  it('computes total credits correctly', () => {
    const modules: ModuleWithGrade[] = [
      { credits: 3, grade: 'A' },
      { credits: 4, grade: 'B' },
      { credits: 1.5, grade: 'C' },
    ]
    expect(totalCredits(modules)).toBe(8.5)
  })

  it('computes earned credits correctly (only counting modules with valid scale grades)', () => {
    const modules: ModuleWithGrade[] = [
      { credits: 3, grade: 'A' },
      { credits: 4, grade: 'B' },
      { credits: 2, grade: 'Pending' }, // Invalid grade, not earned yet
    ]
    expect(earnedCredits(modules, scale)).toBe(7)
  })

  it('computes weighted average GPA correctly', () => {
    const modules: ModuleWithGrade[] = [
      { credits: 3, grade: 'A' },   // 3 * 4.0 = 12
      { credits: 4, grade: 'B' },   // 4 * 3.0 = 12
      { credits: 1, grade: 'F' },   // 1 * 0 = 0
    ]
    // Total points = 24. Total credits = 8. GPA = 3.0.
    expect(computeScore(modules, scale)).toBe(3.0)
  })

  it('handles missing grades in scale by ignoring them in the average', () => {
    const modules: ModuleWithGrade[] = [
      { credits: 3, grade: 'A' },       // 3 * 4.0 = 12
      { credits: 2, grade: 'P' },       // Not in scale, skipped
    ]
    // Only 'A' is valid. points = 12, credits = 3. GPA = 4.0
    expect(computeScore(modules, scale)).toBe(4.0)
  })

  it('is case-insensitive for grades', () => {
    const modules: ModuleWithGrade[] = [
      { credits: 3, grade: 'a+' },
    ]
    expect(computeScore(modules, scale)).toBe(4.2)
  })

  it('treats numeric strings from the database as numbers', () => {
    const modules = [
      { credits: '3.0', grade: 'A' },
      { credits: '4.0', grade: 'B' },
      { credits: '1.5', grade: 'C' },
    ] as unknown as ModuleWithGrade[]

    // Without coercion, 0 + "3.0" + "4.0" concatenates to "03.04.0".
    expect(totalCredits(modules)).toBe(8.5)
    expect(earnedCredits(modules, scale)).toBe(8.5)
    // (3*4.0 + 4*3.0 + 1.5*2.0) / 8.5 = 27 / 8.5
    expect(computeScore(modules, scale)).toBe(3.1765)
  })

  it('treats a non-numeric credit string as zero', () => {
    const modules = [
      { credits: '3', grade: 'A' },
      { credits: 'abc', grade: 'F' },
    ] as unknown as ModuleWithGrade[]

    expect(toCredits('abc')).toBe(0)
    expect(toCredits('')).toBe(0)
    expect(toCredits(null)).toBe(0)
    expect(totalCredits(modules)).toBe(3)
    expect(computeScore(modules, scale)).toBe(4)
  })

  it('classifies scores correctly', () => {
    expect(classify(3.8)).toBe('First Class')
    expect(classify(3.5)).toBe('Second Upper')
    expect(classify(3.1)).toBe('Second Lower')
    expect(classify(2.5)).toBe('General Pass')
    expect(classify(1.5)).toBe('Fail')
    expect(classify(0)).toBe('Unknown')
    expect(classify(0, true)).toBe('Fail')
  })
})
