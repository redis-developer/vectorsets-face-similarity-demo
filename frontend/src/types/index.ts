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
  data?: T | null;
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

export interface INewElementSearchInput {
  localImageUrl: string;
  count: number;
  filterQuery: string;
}
