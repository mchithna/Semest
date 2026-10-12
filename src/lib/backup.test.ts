import { describe, expect, it } from 'vitest'
import { parseBackup } from './backup'
import { withoutReplacedAttempts } from './score'

describe('backup import', () => {
  it('rejects a file that is not a backup', () => {
    expect(() => parseBackup(null)).toThrow(/not a Semest backup/)
    expect(() => parseBackup({ hello: true })).toThrow(/not a Semest backup/)
  })

  it('reads degrees and custom scales', () => {
    const parsed = parseBackup({
      degrees: [{ title: 'BSc' }],
      customScales: [{ id: '1', label: 'Mine', grades: [{ grade: 'A', points: 4 }] }],
    })
    expect(parsed.degrees).toHaveLength(1)
    expect(parsed.customScales[0].label).toBe('Mine')
  })
})

describe('retakes', () => {
  it('drops the earlier attempt and keeps the later one', () => {
    const modules = [
      { id: 'old', credits: 3, grade: 'F', retakes_module_id: null },
      { id: 'new', credits: 3, grade: 'A', retakes_module_id: 'old' },
    ]
    expect(withoutReplacedAttempts(modules).map((mod) => mod.id)).toEqual(['new'])
  })
})
