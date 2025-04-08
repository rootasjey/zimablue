export interface Collection {
  id: number;
  name: string;
  description: string;
  items: Image[];
  cover_image_id: number;
  slug: string;
  is_public: number;
  created_at: string;
  updated_at: string;
}