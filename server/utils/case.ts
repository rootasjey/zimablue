export function camelToSnake(str: string): string {
  return str.replace(/([A-Z])/g, '_$1').toLowerCase()
}

export function keysToSnake<T = any>(obj: T): any {
  if (Array.isArray(obj)) {
    return obj.map((v) => keysToSnake(v))
  }

  if (obj && typeof obj === 'object') {
    const res: Record<string, any> = {}
    for (const [k, v] of Object.entries(obj as any)) {
      const newKey = camelToSnake(k)
      res[newKey] = keysToSnake(v)
    }
    return res
  }

  return obj
}
