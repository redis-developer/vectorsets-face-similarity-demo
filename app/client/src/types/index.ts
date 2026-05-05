export type Gender = 'female' | 'male' | 'other' | 'unknown';

export interface ImageDoc {
  id: string;
  src: string;
  filename?: string;
  label?: string;
  fromUpload?: boolean;
  meta?: Record<string, unknown>;
  score?: number;
}

export interface ApiResponse<T> {
  data?: T | null;
  error?: string;
}

export interface UploadResponse {
  id: string;
  url: string;
  filename: string;
}

export interface ExistingElementSearchInput {
  id: string;
  count: number;
  filterQuery: string;
}

export interface NewElementSearchInput {
  localImageUrl: string;
  count: number;
  filterQuery: string;
}

export interface SearchFormData {
  [key: string]: string | number;
}

export interface VectorSetSearchResponse {
  query: string;
  queryResults: ImageDoc[];
}
