export interface Collection {
  owner: any;
  cover_image_id: number;
  created_at: string;
  description: string;
  id: number;
  images: Image[];
  image_count: number;
  is_public: boolean;
  items: Image[];
  name: string;
  slug: string;
  stats_downloads: number;
  stats_likes: number;
  stats_views: number;
  updated_at: string;
}

export interface CollectionFormData {
  name: string
  description: string
  isPublic: boolean
}
