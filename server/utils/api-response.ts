export interface ApiPagination {
  total: number
  limit: number
  offset: number
  hasMore: boolean
}

export interface ApiSuccessResponse<T = unknown> {
  success: true
  data: T
  message?: string
  pagination?: ApiPagination
}

export interface ApiErrorResponse {
  success: false
  error: {
    message: string
    status: number
    code?: string
  }
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse

export function apiSuccess<T>(data: T, pagination?: ApiPagination, message?: string): ApiSuccessResponse<T> {
  const res: ApiSuccessResponse<T> = { success: true, data }
  if (pagination) res.pagination = pagination
  if (message) res.message = message
  return res
}

export function apiError(message: string, status: number = 400, code?: string): ApiErrorResponse {
  return {
    success: false,
    error: { message, status, code }
  }
}

export function sendApiError(event: any, message: string, status: number = 400, code?: string): never {
  throw createError({
    statusCode: status,
    statusMessage: message,
    data: { success: false, error: { message, status, code } }
  })
}

export function computePagination(total: number, limit: number, offset: number): ApiPagination {
  return {
    total,
    limit,
    offset,
    hasMore: limit > 0 && offset + limit < total
  }
}
