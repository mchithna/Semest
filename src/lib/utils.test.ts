import { describe, it, expect } from 'vitest'
import { cn } from './utils'

describe('cn utility', () => {
  it('combines simple class names', () => {
    expect(cn('flex', 'items-center')).toBe('flex items-center')
  })

  it('handles conditional class names', () => {
    const isTrue = true
    const isFalse = false
    expect(cn('base', isTrue && 'active', isFalse && 'hidden')).toBe('base active')
  })

  it('merges conflicting tailwind classes correctly', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4')
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500')
  })

  it('handles undefined, null, and empty string inputs gracefully', () => {
    expect(cn('text-sm', undefined, null, '', 'font-bold')).toBe('text-sm font-bold')
  })
})
