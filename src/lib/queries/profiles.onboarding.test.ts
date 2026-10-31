import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  forgetOnboarded,
  hasFinishedOnboarding,
  rememberOnboarded,
  resolveOnboarding,
} from '../onboardingMemory'

const store = new Map<string, string>()

afterEach(() => {
  store.clear()
})

vi.stubGlobal('localStorage', {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => {
    store.set(key, value)
  },
  removeItem: (key: string) => {
    store.delete(key)
  },
})

describe('resolveOnboarding', () => {
  it('keeps a remembered account when the profile request fails', () => {
    expect(resolveOnboarding(true, null, true)).toBe('yes')
  })

  it('does not treat an unknown failure as a new account', () => {
    expect(resolveOnboarding(true, null, false)).toBe('unknown')
  })

  it('follows the server when the request succeeds', () => {
    expect(resolveOnboarding(false, '2026-01-01T00:00:00Z', false)).toBe('yes')
    expect(resolveOnboarding(false, null, true)).toBe('no')
  })
})

describe('onboarding memory', () => {
  it('remembers a user on this device until the server says otherwise', () => {
    expect(hasFinishedOnboarding('user-1')).toBe(false)
    rememberOnboarded('user-1')
    expect(hasFinishedOnboarding('user-1')).toBe(true)
    forgetOnboarded('user-1')
    expect(hasFinishedOnboarding('user-1')).toBe(false)
  })
})
