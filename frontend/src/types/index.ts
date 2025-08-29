export type Gender = "female" | "male" | "other" | "unknown";

export interface IImageDoc {
  id: string;
  src: string;
  //thumb?: string; // optional small preview URL
  filename?: string;
  label?: string; // label to show under the card
  fromUpload?: boolean;
  meta?: {
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

export interface IExistingElementSearchInput {
  id: string;
  count: number;
  filterQuery: string;
}
