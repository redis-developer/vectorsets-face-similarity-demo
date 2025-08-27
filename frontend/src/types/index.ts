export type Gender = "female" | "male" | "other" | "unknown";

export interface ImageDoc {
  id: string; // unique id for the image
  src: string; // URL or object URL
  thumb?: string; // optional small preview URL
  name?: string; // label to show under the card
  fromUpload?: boolean;
  meta?: {
    age?: number | [number, number];
    gender?: Gender;
    tags?: string[];
  };
}

export interface IApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface IUploadResponse {
  imageId: string;
  imageUrl: string;
}
