import { IApiResponse, IUploadResponse } from "@/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

// Generic API request function
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<IApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "API request failed");
    }

    return data;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Upload image
// export async function uploadImage(
//   file: File
// ): Promise<IApiResponse<IUploadResponse>> {
//   const formData = new FormData();
//   formData.append("image", file);

//   return apiRequest<IUploadResponse>("/upload", {
//     method: "POST",
//     body: formData,
//     headers: {}, // Let browser set Content-Type for FormData
//   });
// }

// Search for similar faces
// export async function searchSimilarFaces(
//   request: SearchRequest
// ): Promise<ApiResponse<SearchResult[]>> {
//   return apiRequest<SearchResult[]>("/search", {
//     method: "POST",
//     body: JSON.stringify(request),
//   });
// }
