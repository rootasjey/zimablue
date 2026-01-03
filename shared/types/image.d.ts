export interface Image {
  created_at: string;
  description: string;
  h: number;
  id: number;
  i: number;
  name: string;
  pathname: string;
  slug: string;
  stats_downloads: number;
  stats_likes: number;
  stats_views: number;
  sum: number;
  sum_abs: number;
  updated_at: string;
  // `variants` may be a JSON string when read directly from the DB, or
  // an already-parsed VariantType[] when returned from some API endpoints.
  variants: string | VariantType[];
  w: number;
  x: number;
  y: number;
  user_id: number;
  tags?: Tag[];
  tag_ids?: number[];
  tag_names?: string[];
}

// Legacy Image interface for backward compatibility during migration
export interface LegacyImage extends Omit<Image, 'tags' | 'tag_ids' | 'tag_names'> {
  tags: string; // JSON string format
}

export type VariantType = {
  size: string
  width: number
  height: number
  pathname: string
}

// API response types
export interface ImageWithTags extends Image {
  tags: Tag[];
}

export interface ImageSearchParams {
  query?: string;
  tags?: string[] | number[];
  limit?: number;
  offset?: number;
  user_id?: number;
}
