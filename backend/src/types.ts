export interface IImageDoc {
  id: string;
  src: string;
  //thumb?: string;  // optional small preview URL
  filename?: string;
  label?: string; // label to show under the card
  meta?: {
    [key: string]: any;
  };
  score?: number;
}

export interface IDataset {
  IMAGE_PREFIX: string;
  VECTOR_SET: {
    KEY: string;
    DIM: number;
  };
}
