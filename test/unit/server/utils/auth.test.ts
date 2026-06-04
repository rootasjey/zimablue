import { describe, it, expect } from 'vitest'
import { isAdminSession } from '../../../../server/utils/auth'

describe('isAdminSession', () => {
  it('returns true when user role is admin', () => {
    const session = {
      user: { id: 1, name: 'admin', role: 'admin' },
    } as any
    expect(isAdminSession(session)).toBe(true)
  })

  it('returns false when user role is user', () => {
    const session = {
      user: { id: 2, name: 'user', role: 'user' },
    } as any
    expect(isAdminSession(session)).toBe(false)
  })

  it('returns false when user has no role', () => {
    const session = {
      user: { id: 3, name: 'nobody' },
    } as any
    expect(isAdminSession(session)).toBe(false)
  })

  it('returns false when session has no user', () => {
    const session = {} as any
    expect(isAdminSession(session)).toBe(false)
  })

  it('returns false when session is empty object', () => {
    const session = {} as any
    expect(isAdminSession(session)).toBe(false)
  })
})
