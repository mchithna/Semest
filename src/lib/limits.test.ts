import { describe, expect, it } from 'vitest'
import { assertSemester, assertText, LIMITS } from './limits'

describe('input limits', () => {
  it('allows a value at the cap', () => {
    expect(() => assertText('a'.repeat(LIMITS.moduleName), LIMITS.moduleName, 'Module name')).not.toThrow()
  })

  it('rejects a value past the cap', () => {
    expect(() => assertText('a'.repeat(LIMITS.moduleName + 1), LIMITS.moduleName, 'Module name')).toThrow(
      'Module name must be 120 characters or fewer',
    )
  })

  it('allows empty optional text', () => {
    expect(() => assertText(null, LIMITS.term, 'Term')).not.toThrow()
    expect(() => assertText('', LIMITS.term, 'Term')).not.toThrow()
  })

  it('rejects a semester that is too large', () => {
    const modules = Array.from({ length: LIMITS.modulesPerSemester + 1 }, () => ({
      name: 'Calculus',
      grade: 'A',
      credits: 3,
    }))
    expect(() => assertSemester('Year 1', null, modules)).toThrow('at most 60 modules')
  })
})
