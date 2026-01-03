// Comprehensive tag-related types for the normalized tag system

export interface Tag {
  id: number;
  name: string;
  slug: string;
  description: string;
  color: string;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface ImageTag {
  image_id: number;
  tag_id: number;
  created_at: string;
}

// API request/response types
export interface TagCreateRequest {
  name: string;
  description?: string;
  color?: string;
}

export interface TagUpdateRequest extends Partial<TagCreateRequest> {
  id: number;
}

export interface TagSearchParams {
  query?: string;
  limit?: number;
  offset?: number;
  sort_by?: 'name' | 'usage_count' | 'created_at';
  sort_order?: 'asc' | 'desc';
}

export interface TagSearchResponse {
  tags: Tag[];
  total: number;
  pagination: {
    page: number;
    limit: number;
    total_pages: number;
  };
}

// Updated TagMap for UI components
export type TagMap = {
  label: string
  value: string
  id?: number
}

export interface TagSearchResult {
  tags: Tag[];
  total: number;
}

// Tag management types
export interface TagMergeRequest {
  source_tag_ids: number[];
  target_tag_id: number;
}

export interface TagBulkDeleteRequest {
  tag_ids: number[];
  force?: boolean; // Delete even if tags are in use
}

export interface TagUsageStats {
  tag: Tag;
  image_count: number;
  recent_usage: string; // ISO date string
}

// UI component types
export interface TagOption {
  label: string;
  value: number | string;
  color?: string;
  usage_count?: number;
}

export interface TagFilterState {
  selected_tags: number[];
  excluded_tags: number[];
  mode: 'any' | 'all'; // Match any tag or all tags
}

// Validation types
export interface TagValidationError {
  field: string;
  message: string;
}

export interface TagValidationResult {
  valid: boolean;
  errors: TagValidationError[];
}

// Form types for tag management
export interface TagFormData {
  name: string;
  description?: string;
  color?: string;
}

export interface TagUpdateData extends Partial<TagFormData> {
  id: number;
}
