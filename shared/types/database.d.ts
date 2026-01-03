// Database query result types
// These interfaces match the actual column names in the database (snake_case)

export interface DbUser {
  id: number
  name: string
  email: string
  password: string
  role: string
  biography: string | null
  job: string | null
  language: string | null
  location: string | null
  socials: string | null
  created_at: string
  updated_at: string
}

export interface DbImage {
  id: number
  name: string
  description: string | null
  pathname: string
  slug: string
  w: number
  h: number
  x: number
  y: number
  variants: string
  user_id: number
  created_at: string
  updated_at: string
}

export interface DbCollection {
  id: number
  name: string
  slug: string
  description: string | null
  is_public: number
  cover_image_id: number | null
  stats_views: number
  stats_downloads: number
  stats_likes: number
  user_id: number
  created_at: string
  updated_at: string
}

export type DbCollectionRow = Pick<DbCollection, 'id' | 'user_id' | 'name'>

export interface DbCollectionWithExtras extends DbCollection {
  owner_id: number
  owner_name: string
  image_count: number
}

export interface DbImageSimple {
  id: number
  name: string
  pathname: string
  w: number
  h: number
}

export interface DbCountResult {
  total: number
}
