import { describe, it, expect } from 'vitest'
import { apiSuccess, apiError, computePagination } from '../../../../server/utils/api-response'

describe('apiSuccess', () => {
  it('wraps data in success response', () => {
    const result = apiSuccess({ id: 1, name: 'test' })
    expect(result).toEqual({
      success: true,
      data: { id: 1, name: 'test' },
    })
  })

  it('includes pagination when provided', () => {
    const pagination = { total: 100, limit: 20, offset: 0, hasMore: true }
    const result = apiSuccess(['item'], pagination)
    expect(result.success).toBe(true)
    expect(result.pagination).toEqual(pagination)
    expect(result.data).toEqual(['item'])
  })

  it('omits pagination key when not provided', () => {
    const result = apiSuccess(null)
    expect(result).not.toHaveProperty('pagination')
  })

  it('handles primitive data', () => {
    expect(apiSuccess(42).data).toBe(42)
    expect(apiSuccess('hello').data).toBe('hello')
    expect(apiSuccess(true).data).toBe(true)
  })

  it('handles empty array', () => {
    const result = apiSuccess([])
    expect(result.data).toEqual([])
    expect(Array.isArray(result.data)).toBe(true)
  })
})

describe('apiError', () => {
  it('creates error response with message and status', () => {
    const result = apiError('Not found', 404)
    expect(result).toEqual({
      success: false,
      error: { message: 'Not found', status: 404, code: undefined },
    })
  })

  it('includes error code when provided', () => {
    const result = apiError('Validation failed', 422, 'VALIDATION_ERROR')
    expect(result.error.code).toBe('VALIDATION_ERROR')
  })

  it('defaults to 400 status', () => {
    const result = apiError('Bad request')
    expect(result.error.status).toBe(400)
  })
})

describe('computePagination', () => {
  it('computes hasMore=true when more pages exist', () => {
    const result = computePagination(100, 20, 0)
    expect(result).toEqual({ total: 100, limit: 20, offset: 0, hasMore: true })
  })

  it('computes hasMore=false on last page', () => {
    const result = computePagination(100, 20, 80)
    expect(result.hasMore).toBe(false)
  })

  it('computes hasMore=false when offset+limit >= total', () => {
    const result = computePagination(100, 20, 100)
    expect(result.hasMore).toBe(false)
  })

  it('handles exact boundary (offset+limit === total)', () => {
    const result = computePagination(50, 25, 25)
    expect(result.hasMore).toBe(false)
  })

  it('handles empty dataset', () => {
    const result = computePagination(0, 20, 0)
    expect(result).toEqual({ total: 0, limit: 20, offset: 0, hasMore: false })
  })

  it('handles zero limit gracefully', () => {
    const result = computePagination(100, 0, 0)
    expect(result.hasMore).toBe(false)
  })
})
