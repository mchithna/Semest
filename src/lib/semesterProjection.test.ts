import { describe, expect, it } from 'vitest'
import { projectCumulative } from './semesterProjection'
import type { GradeRow } from './queries/gradeScales'

const scale: GradeRow[] = [
  { grade: 'A', points: 4 },
  { grade: 'B', points: 3 },
  { grade: 'F', points: 0 },
]

describe('projectCumulative', () => {
  it('adds a new semester onto the saved modules', () => {
    const saved = [{ id: 'old', credits: 3, grade: 'B', retakes_module_id: null }]
    const draft = [{ id: 'new', credits: 3, grade: 'A', retakes_module_id: null }]
    const projection = projectCumulative(saved, [], draft, scale)
    expect(projection.before).toBe(3)
    expect(projection.after).toBe(3.5)
    expect(projection.gradedCredits).toBe(3)
  })

  it('replaces the semester being edited and drops a retaken attempt', () => {
    const elsewhere = [{ id: 'old', credits: 3, grade: 'F', retakes_module_id: null }]
    const baseline = [{ id: 'kept', credits: 3, grade: 'B', retakes_module_id: null }]
    const draft = [{ id: 'retake', credits: 3, grade: 'A', retakes_module_id: 'old' }]
    const projection = projectCumulative(elsewhere, baseline, draft, scale)
    expect(projection.before).toBe(1.5)
    expect(projection.after).toBe(4)
    expect(projection.beforeGraded).toBe(true)
    expect(projection.afterGraded).toBe(true)
  })

  it('reports an ungraded draft without inventing a GPA', () => {
    const draft = [{ id: 'blank', credits: 3, grade: 'Not graded', retakes_module_id: null }]
    const projection = projectCumulative([], [], draft, scale)
    expect(projection.beforeGraded).toBe(false)
    expect(projection.afterGraded).toBe(false)
    expect(projection.gradedCredits).toBe(0)
  })
})
