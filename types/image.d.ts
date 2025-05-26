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
  tags: string;
  updated_at: string;
  variants: string;
  w: number;
  x: number;
  y: number;
}

export type VariantType = {
  size: string
  width: number
  height: number
  pathname: string
}