import { describe, it, expect } from 'vitest'
import {
  validateContactInput,
  isAllowedImageType,
  mapDbUserToApiUser,
  getFileExtension,
  getBaseName,
} from '../../../../server/utils/contact'
import type { DbUser } from '#shared/types/database'

describe('validateContactInput', () => {
  it('accepts valid input', () => {
    const result = validateContactInput({ email: 'a@b.com', subject: 'Hi', message: 'Test' })
    expect(result.valid).toBe(true)
  })

  it('rejects missing email', () => {
    const result = validateContactInput({ subject: 'Hi', message: 'Test' })
    expect(result.valid).toBe(false)
    expect(result.error).toContain('Email')
  })

  it('rejects missing subject', () => {
    const result = validateContactInput({ email: 'a@b.com', message: 'Test' })
    expect(result.valid).toBe(false)
    expect(result.error).toContain('subject')
  })

  it('rejects missing message', () => {
    const result = validateContactInput({ email: 'a@b.com', subject: 'Hi' })
    expect(result.valid).toBe(false)
    expect(result.error).toContain('message')
  })

  it('rejects empty body', () => {
    const result = validateContactInput({})
    expect(result.valid).toBe(false)
  })

  it('rejects null body', () => {
    const result = validateContactInput(null)
    expect(result.valid).toBe(false)
  })
})

describe('isAllowedImageType', () => {
  it('accepts jpeg', () => {
    expect(isAllowedImageType('image/jpeg')).toBe(true)
  })

  it('accepts png', () => {
    expect(isAllowedImageType('image/png')).toBe(true)
  })

  it('rejects webp', () => {
    expect(isAllowedImageType('image/webp')).toBe(false)
  })

  it('rejects svg', () => {
    expect(isAllowedImageType('image/svg+xml')).toBe(false)
  })
})

describe('mapDbUserToApiUser', () => {
  it('transforms snake_case DB user to camelCase API user', () => {
    const dbUser: DbUser = {
      id: 1, name: 'John', email: 'john@test.com',
      password: 'hashed', role: 'admin',
      biography: 'Bio', job: 'Dev',
      language: 'en', location: 'NY',
      socials: '[]',
      created_at: '2025-01-01',
      updated_at: '2025-06-01',
    }
    const apiUser = mapDbUserToApiUser(dbUser)

    expect(apiUser.id).toBe(1)
    expect(apiUser.name).toBe('John')
    expect(apiUser.role).toBe('admin')
    expect(apiUser.createdAt).toBe('2025-01-01')
    expect(apiUser.updatedAt).toBe('2025-06-01')
    expect(apiUser.password).toBeUndefined()
  })

  it('falls back updatedAt to createdAt when missing', () => {
    const dbUser: DbUser = {
      id: 2, name: 'Jane', email: 'jane@test.com',
      password: 'hashed', role: 'user',
      biography: null, job: null,
      language: null, location: null,
      socials: null,
      created_at: '2025-01-01',
      updated_at: '',
    }
    const apiUser = mapDbUserToApiUser(dbUser)

    expect(apiUser.updatedAt).toBe('2025-01-01')
  })
})

describe('getFileExtension', () => {
  it('extracts extension from MIME type', () => {
    expect(getFileExtension('image/png')).toBe('png')
    expect(getFileExtension('image/jpeg')).toBe('jpeg')
  })

  it('extracts extension even for non-image types', () => {
    expect(getFileExtension('application/pdf')).toBe('pdf')
  })
})

describe('getBaseName', () => {
  it('strips file extension', () => {
    expect(getBaseName('photo.jpg')).toBe('photo')
  })

  it('handles multiple dots', () => {
    expect(getBaseName('my.photo.jpg')).toBe('my.photo')
  })

  it('returns full string when no extension', () => {
    expect(getBaseName('photo')).toBe('photo')
  })
})
