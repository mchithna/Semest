import { describe, expect, it } from 'vitest'
import { matchingScheme } from './classificationSchemes'

const honors = { id: 'honors', is_system: true, applies_up_to: 4.5 }
const wide = { id: 'wide', is_system: true, applies_up_to: 100 }
const custom = { id: 'custom', is_system: false, applies_up_to: 4.5 }

describe('matchingScheme', () => {
  it('links a scale to the narrowest system scheme that still covers its top grade', () => {
    expect(matchingScheme([wide, honors, custom], [{ points: 4 }, { points: 0 }])?.id).toBe('honors')
    expect(matchingScheme([wide, honors], [{ points: 4.5 }])?.id).toBe('honors')
  })

  it('leaves a wider scale unlinked', () => {
    expect(matchingScheme([honors, custom], [{ points: 10 }])).toBeNull()
  })

  it('does not treat a user scheme as the default', () => {
    expect(matchingScheme([custom], [{ points: 4 }])).toBeNull()
  })
})
