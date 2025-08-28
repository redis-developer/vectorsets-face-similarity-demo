export type Gender = "female" | "male" | "other" | "unknown";

export interface ImageDoc {
  id: string; // unique id for the image
  src: string; // URL or object URL
  //thumb?: string; // optional small preview URL
  filename?: string;
  label?: string; // label to show under the card
  fromUpload?: boolean;
  meta?: {
    tags?: string[];
    [key: string]: any;
  };
}

export interface IApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface IUploadResponse {
  id: string;
  url: string;
  filename: string;
}
