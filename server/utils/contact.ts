export interface ContactInput {
  email?: string
  subject?: string
  message?: string
}

export interface ValidationResult {
  valid: boolean
  error?: string
}

export function validateContactInput(body: unknown): ValidationResult {
  const input = body as ContactInput
  if (!input?.email || !input?.subject || !input?.message) {
    return { valid: false, error: 'Email, subject, and message are required' }
  }
  return { valid: true }
}

export function isAllowedImageType(mimeType: string): boolean {
  return ['image/jpeg', 'image/png', 'image/bmp', 'image/tiff', 'image/x-ms-bmp', 'image/gif'].includes(mimeType)
}

export function mapDbUserToApiUser(userData: DbUser) {
  return {
    id: userData.id,
    name: userData.name,
    email: userData.email,
    role: userData.role,
    biography: userData.biography || '',
    job: userData.job || '',
    language: userData.language || '',
    location: userData.location || '',
    socials: userData.socials || '',
    createdAt: userData.created_at,
    updatedAt: userData.updated_at || userData.created_at,
  }
}

export function getFileExtension(mimeType: string): string {
  return mimeType.split('/')[1] || 'jpg'
}

export function getBaseName(fileName: string): string {
  const dotIndex = fileName.lastIndexOf('.')
  return dotIndex > 0 ? fileName.substring(0, dotIndex) : fileName
}
