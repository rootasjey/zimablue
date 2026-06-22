export interface ApiToken {
  id: number
  user_id: number
  name: string
  last_used_at: string | null
  expires_at: string | null
  revoked: boolean
  created_at: string
  updated_at: string
}

export interface ApiTokenWithRaw extends ApiToken {
  token: string
}
