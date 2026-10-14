import { afterEach, describe, expect, it, vi } from 'vitest'
import { friendlyError } from './errors'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('friendlyError', () => {
  it('maps known auth and network failures', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(friendlyError({ message: 'Invalid login credentials' }, 'fallback')).toBe(
      'Wrong email or password. Try again or reset your password.',
    )
    expect(friendlyError({ message: 'User already registered' }, 'fallback')).toBe(
      'An account with this email already exists. Sign in instead.',
    )
    expect(friendlyError({ message: 'Email not confirmed' }, 'fallback')).toBe(
      'Confirm your email first. Check your inbox for the link.',
    )
    expect(friendlyError(new Error('Email rate limit exceeded'), 'fallback')).toBe(
      'Too many attempts. Wait a minute and try again.',
    )
    expect(friendlyError(new TypeError('Failed to fetch'), 'fallback')).toBe(
      "Can't reach the server. Check your connection and try again.",
    )
  })

  it('uses the fallback and logs the original error', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const err = { message: 'new row violates row-level security policy' }
    expect(friendlyError(err, "Couldn't save the degree. Try again.")).toBe(
      "Couldn't save the degree. Try again.",
    )
    expect(spy).toHaveBeenCalledWith(err)
  })
})
