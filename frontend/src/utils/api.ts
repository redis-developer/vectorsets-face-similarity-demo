import {
  IApiResponse,
  IUploadResponse,
  IImageDoc,
  IExistingElementSearchInput,
} from "@/types";

import { API_BASE_URL } from "./config";

const ENDPOINTS = {
  IMAGE_UPLOAD: "/imageUpload",
  GET_SAMPLE_IMAGES: "/getSampleImages",
  EXISTING_ELEMENT_SEARCH: "/existingElementSearch",
};

const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<IApiResponse<T>> => {
  try {
    if (!options.headers) {
      options.headers = {
        "Content-Type": "application/json",
      };
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
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
};

const apiPost = async <T>(
  endpoint: string,
  body: any
): Promise<IApiResponse<T>> => {
  if (body) {
    body = JSON.stringify(body);
  }
  const options: RequestInit = {
    method: "POST",
    body,
  };
  return apiRequest<T>(endpoint, options);
};

const apiImageUpload = async (
  file: File
): Promise<IApiResponse<IUploadResponse>> => {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please select an image file.");
  }

  const formData = new FormData();
  formData.append("file", file);

  const options: RequestInit = {
    method: "POST",
    body: formData,
    headers: {}, // Let browser set Content-Type for FormData
  };

  const response = await apiRequest<IUploadResponse>(
    ENDPOINTS.IMAGE_UPLOAD,
    options
  );

  if (response?.data?.url) {
    response.data.url = `${API_BASE_URL}${response.data.url}`;
  }

  return response;
};

const fixImageURLs = (images: IImageDoc[]) => {
  // Prefix image sources with API base URL

  return images.map((image) => ({
    ...image,
    src: image.src.startsWith("http")
      ? image.src
      : `${API_BASE_URL}${image.src}`,
  }));
};

export async function existingElementSearch(
  input: IExistingElementSearchInput
): Promise<IApiResponse<IImageDoc[]>> {
  const response = await apiPost<IImageDoc[]>(
    ENDPOINTS.EXISTING_ELEMENT_SEARCH,
    input
  );
  if (response?.data) {
    response.data = fixImageURLs(response.data);
  }
  return response;
}

// Get available images for search filter
export async function getSampleImages(): Promise<IApiResponse<IImageDoc[]>> {
  const response = await apiPost<IImageDoc[]>(ENDPOINTS.GET_SAMPLE_IMAGES, {});

  if (response?.data) {
    response.data = fixImageURLs(response.data);
  }

  return response;
}

export { apiPost, apiImageUpload };
