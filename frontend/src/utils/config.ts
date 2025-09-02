import { DATASET_NAMES } from "./constants";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_IMAGE_BASE_URL || "http://backend:3001/api";

const MAX_UPLOAD_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const CURRENT_DATASET = DATASET_NAMES.VSET_TMDB;

export { API_BASE_URL, IMAGE_BASE_URL, MAX_UPLOAD_FILE_SIZE, CURRENT_DATASET };
