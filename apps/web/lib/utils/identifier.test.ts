import { describe, it, expect } from 'vitest'
import { validateIdentifier, suggestIdentifier } from './identifier'

describe('validateIdentifier', () => {
  it('returns null for valid identifiers', () => {
    expect(validateIdentifier('my-agent')).toBeNull()
    expect(validateIdentifier('agent1')).toBeNull()
    expect(validateIdentifier('ab')).toBeNull()
    expect(validateIdentifier('a-b-c-123')).toBeNull()
  })

  it('rejects empty string', () => {
    expect(validateIdentifier('')).toBe('标识符不能为空')
  })

  it('rejects single character', () => {
    expect(validateIdentifier('a')).toBe('至少 2 个字符')
  })

  it('rejects identifiers longer than 40 characters', () => {
    expect(validateIdentifier('a'.repeat(41))).toBe('不超过 40 个字符')
  })

  it('rejects identifiers starting with a digit', () => {
    expect(validateIdentifier('1agent')).toBe('仅允许小写字母、数字和连字符，须以字母开头')
  })

  it('rejects identifiers with uppercase letters', () => {
    expect(validateIdentifier('MyAgent')).toBe('仅允许小写字母、数字和连字符，须以字母开头')
  })

  it('rejects identifiers with underscores', () => {
    expect(validateIdentifier('my_agent')).toBe('仅允许小写字母、数字和连字符，须以字母开头')
  })

  it('rejects identifiers with spaces', () => {
    expect(validateIdentifier('my agent')).toBe('仅允许小写字母、数字和连字符，须以字母开头')
  })
})

describe('suggestIdentifier', () => {
  it('converts name to slug', () => {
    expect(suggestIdentifier('My Agent')).toBe('my-agent')
  })

  it('handles special characters', () => {
    expect(suggestIdentifier('Hello, World!')).toBe('hello-world')
  })

  it('handles Chinese characters (non-ascii)', () => {
    expect(suggestIdentifier('我的代理')).toBe('agent')
  })

  it('collapses multiple separators', () => {
    expect(suggestIdentifier('hello   world')).toBe('hello-world')
  })

  it('strips leading and trailing hyphens', () => {
    expect(suggestIdentifier('  hello  ')).toBe('hello')
  })
})
