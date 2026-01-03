interface ImageUploadResult {
  success: true; 
  ok: boolean; 
  meta: { [x: string]: never; }; 
  results: SerializeObject<Record<string, unknown>>[];
}