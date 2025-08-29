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

export async function existingElementSearch(
  input: IExistingElementSearchInput
): Promise<IApiResponse<IImageDoc[]>> {
  return apiPost<IImageDoc[]>(ENDPOINTS.EXISTING_ELEMENT_SEARCH, input);
}

// Get available images for search filter
export async function getSampleImages(): Promise<IApiResponse<IImageDoc[]>> {
  const response = await apiPost<IImageDoc[]>(ENDPOINTS.GET_SAMPLE_IMAGES, {});

  // Prefix image sources with API base URL
  if (response?.data) {
    response.data = response.data.map((image) => ({
      ...image,
      //label: "",
      src: image.src.startsWith("http")
        ? image.src
        : `${API_BASE_URL}${image.src}`,
    }));
  }

  return response;
}

export { apiPost, apiImageUpload };
