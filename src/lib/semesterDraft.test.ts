import { describe, expect, it } from 'vitest'
import { isUntouchedDraft, modulesMatch } from './semesterDraft'

describe('isUntouchedDraft', () => {
  it('treats the starter row as unchanged', () => {
    expect(isUntouchedDraft([
      { id: 'new', name: '', credits: 3, grade: '', retakesModuleId: null },
    ])).toBe(true)
  })

  it('treats an explicit not-graded value as the starter grade', () => {
    expect(isUntouchedDraft([
      { id: 'new', name: '', credits: 3, grade: 'Not graded' },
    ])).toBe(true)
  })

  it('notices a typed name, a credit change, or an extra row', () => {
    expect(isUntouchedDraft([
      { id: 'new', name: 'Algorithms', credits: 3, grade: '' },
    ])).toBe(false)
    expect(isUntouchedDraft([
      { id: 'new', name: '', credits: 4, grade: '' },
    ])).toBe(false)
    expect(isUntouchedDraft([
      { id: 'a', name: '', credits: 3, grade: '' },
      { id: 'b', name: '', credits: 3, grade: '' },
    ])).toBe(false)
  })
})

describe('modulesMatch', () => {
  const saved = [{ id: 'a', name: 'Algorithms', credits: 3, grade: 'A', retakesModuleId: null }]

  it('matches the saved row when nothing changed', () => {
    expect(modulesMatch(saved, saved)).toBe(true)
  })

  it('notices a grade, retake, or replaced row', () => {
    expect(modulesMatch([{ ...saved[0], grade: 'B' }], saved)).toBe(false)
    expect(modulesMatch([{ ...saved[0], retakesModuleId: 'old' }], saved)).toBe(false)
    expect(modulesMatch([{ ...saved[0], id: 'b' }], saved)).toBe(false)
  })
})
