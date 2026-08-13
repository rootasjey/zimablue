import { describe, expect, it } from 'vitest'
import { generatePasswordResetToken, hashPasswordResetToken } from '../../../../server/utils/password-reset'

describe('password reset tokens', () => {
  it('generates a random 256-bit token', () => {
    const token = generatePasswordResetToken()
    expect(token).toMatch(/^[a-f0-9]{64}$/)
  })

  it('hashes tokens deterministically without returning the raw token', async () => {
    const token = 'a'.repeat(64)
    const hash = await hashPasswordResetToken(token)
    expect(hash).toMatch(/^[a-f0-9]{64}$/)
    expect(hash).not.toBe(token)
    await expect(hashPasswordResetToken(token)).resolves.toBe(hash)
  })
})
