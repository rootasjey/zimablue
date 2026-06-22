function pick(obj: any, fields: string[]): any {
  if (Array.isArray(obj)) return obj.map(item => pick(item, fields))
  if (!obj || typeof obj !== 'object') return obj

  const result: any = {}
  for (const field of fields) {
    const dot = field.indexOf('.')
    if (dot === -1) {
      if (field in obj) result[field] = obj[field]
    } else {
      const key = field.slice(0, dot)
      const sub = field.slice(dot + 1)
      if (key in obj && obj[key] != null) {
        if (!(key in result)) result[key] = Array.isArray(obj[key]) ? [] : {}
        const picked = pick(obj[key], [sub])
        if (Array.isArray(result[key])) {
          result[key] = picked
        } else {
          result[key] = { ...result[key], ...picked }
        }
      }
    }
  }
  return result
}

export function pickFields(data: any, fieldsParam: string | undefined): any {
  if (!fieldsParam) return data
  const fields = fieldsParam.split(',').map(f => f.trim()).filter(Boolean)
  if (fields.length === 0) return data
  return pick(data, fields)
}
