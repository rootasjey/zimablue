/**
 * Converts various date formats to an ISO 8601 string.
 * Handles: null/undefined, ISO strings, timestamps (ms/s), Date objects.
 * Falls back to current time for invalid inputs.
 */
export function toISOString(date: unknown): string {
  try {
    if (!date) return new Date().toISOString()

    if (typeof date === 'string') {
      const parsed = new Date(date)
      return isNaN(parsed.getTime()) ? date : parsed.toISOString()
    }

    if (typeof date === 'number') {
      // Try as milliseconds first (JS standard), then seconds (Unix)
      const ms = date > 9999999999 ? date : date * 1000
      const parsed = new Date(ms)
      return isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString()
    }

    if (date instanceof Date && !isNaN(date.getTime())) {
      return date.toISOString()
    }
  } catch {
    // Fall through to default
  }

  return new Date().toISOString()
}
