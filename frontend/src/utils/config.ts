const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

const MAX_UPLOAD_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export { API_BASE_URL, MAX_UPLOAD_FILE_SIZE };
