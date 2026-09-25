import { describe, it, expect } from 'vitest'
import { getCumulativeMetrics } from './analytics'
import type { SemesterWithModules } from './queries/semesters'
import type { GradeRow } from './queries/gradeScales'

describe('Analytics Utility', () => {
  const gradeScale: GradeRow[] = [
    { grade: 'A+', points: 4.2 },
    { grade: 'A', points: 4.0 },
    { grade: 'B', points: 3.0 },
    { grade: 'C', points: 2.0 },
    { grade: 'F', points: 0.0 },
  ]

  it('returns No Data standing for empty semesters array', () => {
    const metrics = getCumulativeMetrics([], gradeScale)
    expect(metrics.cgpa).toBe(0)
    expect(metrics.earnedCredits).toBe(0)
    expect(metrics.highestGpa).toBe(0)
    expect(metrics.standing).toBe('No Data')
  })

  it('calculates CGPA, earned credits, and highest GPA across multiple semesters', () => {
    const semesters: SemesterWithModules[] = [
      {
        id: 'sem-1',
        degree_id: 'deg-1',
        user_id: 'user-1',
        title: 'Semester 1',
        term: 'Fall 2025',
        sem_index: 1,
        created_at: '',
        updated_at: '',
        modules: [
          { id: 'm1', semester_id: 'sem-1', user_id: 'user-1', name: 'Math 101', credits: 3, grade: 'A', position: 0, created_at: '' },
          { id: 'm2', semester_id: 'sem-1', user_id: 'user-1', name: 'Physics 101', credits: 4, grade: 'B', position: 1, created_at: '' },
        ],
      },
      {
        id: 'sem-2',
        degree_id: 'deg-1',
        user_id: 'user-1',
        title: 'Semester 2',
        term: 'Spring 2026',
        sem_index: 2,
        created_at: '',
        updated_at: '',
        modules: [
          { id: 'm3', semester_id: 'sem-2', user_id: 'user-1', name: 'CS 101', credits: 3, grade: 'A+', position: 0, created_at: '' },
          { id: 'm4', semester_id: 'sem-2', user_id: 'user-1', name: 'Chemistry', credits: 3, grade: 'A', position: 1, created_at: '' },
        ],
      },
    ]

    // Sem 1: (3*4.0 + 4*3.0) / 7 = 24 / 7 ≈ 3.4286
    // Sem 2: (3*4.2 + 3*4.0) / 6 = 24.6 / 6 = 4.10
    // Total CGPA: (12 + 12 + 12.6 + 12) / 13 = 48.6 / 13 ≈ 3.7385
    const metrics = getCumulativeMetrics(semesters, gradeScale)
    expect(metrics.earnedCredits).toBe(13)
    expect(metrics.highestGpa).toBe(4.1)
    expect(metrics.cgpa).toBeCloseTo(3.7385, 3)
    expect(metrics.standing).toBe('First Class')
  })

  it('keeps a numeric CGPA when module credits arrive as strings', () => {
    const semesters: SemesterWithModules[] = [
      {
        id: 'sem-1',
        degree_id: 'deg-1',
        user_id: 'user-1',
        title: 'Semester 1',
        term: null,
        sem_index: 1,
        created_at: '',
        updated_at: '',
        modules: [
          { id: 'm1', semester_id: 'sem-1', user_id: 'user-1', name: 'Math', credits: '3.0' as unknown as number, grade: 'A', position: 0, created_at: '' },
          { id: 'm2', semester_id: 'sem-1', user_id: 'user-1', name: 'Physics', credits: '4.0' as unknown as number, grade: 'B', position: 1, created_at: '' },
        ],
      },
    ]

    const metrics = getCumulativeMetrics(semesters, gradeScale)
    expect(metrics.earnedCredits).toBe(7)
    expect(metrics.cgpa).toBeCloseTo(3.4286, 3)
  })

  it('classifies a low CGPA as Fail', () => {
    const semesters: SemesterWithModules[] = [
      {
        id: 'sem-1',
        degree_id: 'deg-1',
        user_id: 'user-1',
        title: 'Semester 1',
        term: null,
        sem_index: 1,
        created_at: '',
        updated_at: '',
        modules: [
          { id: 'm1', semester_id: 'sem-1', user_id: 'user-1', name: 'Subject 1', credits: 3, grade: 'F', position: 0, created_at: '' },
          { id: 'm2', semester_id: 'sem-1', user_id: 'user-1', name: 'Subject 2', credits: 3, grade: 'C', position: 1, created_at: '' },
        ],
      },
    ]
    // GPA = 6 / 6 = 1.0
    const metrics = getCumulativeMetrics(semesters, gradeScale)
    expect(metrics.cgpa).toBe(1.0)
    expect(metrics.standing).toBe('Fail')
  })

  it('classifies an all-F record as Fail and ungraded work as No Data', () => {
    const failed: SemesterWithModules[] = [
      {
        id: 'sem-1',
        degree_id: 'deg-1',
        user_id: 'user-1',
        title: 'Semester 1',
        term: null,
        sem_index: 1,
        created_at: '',
        updated_at: '',
        modules: [
          { id: 'm1', semester_id: 'sem-1', user_id: 'user-1', name: 'Subject 1', credits: 3, grade: 'F', position: 0, created_at: '' },
        ],
      },
    ]
    expect(getCumulativeMetrics(failed, gradeScale).cgpa).toBe(0)
    expect(getCumulativeMetrics(failed, gradeScale).standing).toBe('Fail')

    const ungraded: SemesterWithModules[] = [
      {
        id: 'sem-1',
        degree_id: 'deg-1',
        user_id: 'user-1',
        title: 'Semester 1',
        term: null,
        sem_index: 1,
        created_at: '',
        updated_at: '',
        modules: [
          { id: 'm1', semester_id: 'sem-1', user_id: 'user-1', name: 'Subject 1', credits: 3, grade: 'N/A', position: 0, created_at: '' },
        ],
      },
    ]
    expect(getCumulativeMetrics(ungraded, gradeScale).standing).toBe('No Data')
  })

  it('uses the same second-class cuts as the semester badge', () => {
    const semesters: SemesterWithModules[] = [
      {
        id: 'sem-1',
        degree_id: 'deg-1',
        user_id: 'user-1',
        title: 'Semester 1',
        term: null,
        sem_index: 1,
        created_at: '',
        updated_at: '',
        modules: [
          { id: 'm1', semester_id: 'sem-1', user_id: 'user-1', name: 'Subject 1', credits: 3, grade: 'B', position: 0, created_at: '' },
          { id: 'm2', semester_id: 'sem-1', user_id: 'user-1', name: 'Subject 2', credits: 3, grade: 'A', position: 1, created_at: '' },
        ],
      },
    ]
    // GPA = (3*3.0 + 3*4.0) / 6 = 21 / 6 = 3.5
    const metrics = getCumulativeMetrics(semesters, gradeScale)
    expect(metrics.cgpa).toBe(3.5)
    expect(metrics.standing).toBe('Second Class (Upper)')

    const lower = getCumulativeMetrics(
      [{
        ...semesters[0],
        modules: [
          { id: 'm1', semester_id: 'sem-1', user_id: 'user-1', name: 'Subject 1', credits: 3, grade: 'B', position: 0, created_at: '' },
          { id: 'm2', semester_id: 'sem-1', user_id: 'user-1', name: 'Subject 2', credits: 3, grade: 'C', position: 1, created_at: '' },
        ],
      }],
      gradeScale,
    )
    // GPA = (3*3.0 + 3*2.0) / 6 = 2.5 is a pass. 3.0 exactly is the lower cut.
    expect(lower.cgpa).toBe(2.5)
    expect(lower.standing).toBe('General Pass')
  })
})
