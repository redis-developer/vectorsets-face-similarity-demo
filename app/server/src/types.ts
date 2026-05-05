export interface ImageDoc {
  id: string;
  src: string;
  //thumb?: string;  // optional small preview URL
  filename?: string;
  label?: string; // label to show under the card
  meta?: Record<string, unknown>;
  score?: number;
}

export interface Dataset {
  IMAGE_PREFIX: string;
  VECTOR_SET: {
    KEY: string;
    DIM: number;
  };
}
