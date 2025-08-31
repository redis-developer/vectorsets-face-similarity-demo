import type { IDataset } from "./types.js";
import "dotenv/config";

const DATASET_NAMES = {
  VSET_CELEB: "VSET_CELEB",
  TMDB: "TMDB",
} as const;

type DatasetNameType = (typeof DATASET_NAMES)[keyof typeof DATASET_NAMES];

const DATASETS: Record<DatasetNameType, IDataset> = {
  VSET_CELEB: {
    IMAGE_PREFIX: "/static/celebs/",
    VECTOR_SET: {
      KEY: "vset:celeb",
      DIM: 768,
    },
  },
  TMDB: {
    IMAGE_PREFIX: "/static/tmdb/",
    VECTOR_SET: {
      KEY: "vset:tmdb",
      DIM: 768,
    },
  },
} as const;

const getConfig = () => {
  return {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_MODEL_NAME: process.env.OPENAI_MODEL_NAME || "gpt-4o", //"gpt-4o-mini"
    REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",

    // process.env.PORT can be dynamic vendor port
    PORT: process.env.PORT || "3001",
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS, //comma separated list of allowed origins
    EMBED_PYTHON_URL:
      process.env.EMBED_PYTHON_URL || "http://localhost:8009/embed",
    UPLOAD_DIR: process.env.UPLOAD_DIR || "uploads",
    UPLOAD_MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB

    CURRENT_DATASET: DATASET_NAMES.TMDB as DatasetNameType,
    DATASETS: DATASETS,
  };
};

export { getConfig };

export type { DatasetNameType };
