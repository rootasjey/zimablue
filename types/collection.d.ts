export interface Collection {
  cover_image_id: number;
  created_at: string;
  description: string;
  id: number;
  is_public: number;
  items: Image[];
  name: string;
  slug: string;
  stats_downloads: number;
  stats_likes: number;
  stats_views: number;
  updated_at: string;
}