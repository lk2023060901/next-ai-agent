import { describe, it, expect } from 'vitest'
import { cn } from './cn'

describe('cn', () => {
  it('joins class names', () => {
    expect(cn('a', 'b')).toBe('a b')
  })

  it('handles conditional classes', () => {
    expect(cn('a', false && 'b', 'c')).toBe('a c')
  })

  it('handles undefined and null values', () => {
    expect(cn('a', undefined, null, 'b')).toBe('a b')
  })

  it('merges tailwind conflicts (last wins)', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })

  it('handles empty input', () => {
    expect(cn()).toBe('')
  })

  it('handles array of classes', () => {
    expect(cn(['a', 'b'], 'c')).toBe('a b c')
  })
})
