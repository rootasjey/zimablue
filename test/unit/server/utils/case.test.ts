import { describe, it, expect } from 'vitest'
import { camelToSnake, keysToSnake } from '../../../../server/utils/case'

describe('camelToSnake', () => {
  it('converts camelCase to snake_case', () => {
    expect(camelToSnake('camelCase')).toBe('camel_case')
  })

  it('handles single word', () => {
    expect(camelToSnake('word')).toBe('word')
  })

  it('handles multiple consecutive capitals', () => {
    expect(camelToSnake('parseJSON')).toBe('parse_j_s_o_n')
  })

  it('handles empty string', () => {
    expect(camelToSnake('')).toBe('')
  })
})

describe('keysToSnake', () => {
  it('converts object keys from camelCase to snake_case', () => {
    const input = { firstName: 'John', lastName: 'Doe' }
    const result = keysToSnake(input)
    expect(result).toEqual({ first_name: 'John', last_name: 'Doe' })
  })

  it('handles nested objects', () => {
    const input = { userData: { firstName: 'John' } }
    const result = keysToSnake(input)
    expect(result).toEqual({ user_data: { first_name: 'John' } })
  })

  it('handles arrays of objects', () => {
    const input = [{ itemId: 1 }, { itemId: 2 }]
    const result = keysToSnake(input)
    expect(result).toEqual([{ item_id: 1 }, { item_id: 2 }])
  })

  it('returns primitives as-is', () => {
    expect(keysToSnake(42)).toBe(42)
    expect(keysToSnake('hello')).toBe('hello')
    expect(keysToSnake(null)).toBe(null)
  })

  it('returns undefined as-is', () => {
    expect(keysToSnake(undefined)).toBe(undefined)
  })
})
