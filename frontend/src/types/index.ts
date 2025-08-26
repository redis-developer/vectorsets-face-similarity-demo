// API response types
export interface IApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Upload types
export interface IUploadResponse {
  imageId: string;
  imageUrl: string;
}
