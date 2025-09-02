import {
  IApiResponse,
  IUploadResponse,
  IImageDoc,
  IExistingElementSearchInput,
  INewElementSearchInput,
  IVectorSetSearchResponse,
} from "@/types";

import { API_BASE_URL, CURRENT_DATASET } from "./config";
import { DATASETS_FILTERS } from "./constants";
import { showErrorToast } from "./toast";

const ENDPOINTS = {
  IMAGE_UPLOAD: "/imageUpload",
  GET_SAMPLE_IMAGES: "/getSampleImages",
  EXISTING_ELEMENT_SEARCH: "/existingElementSearch",
  NEW_ELEMENT_SEARCH: "/newElementSearch",
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

    const result = await response.json();

    if (!response.ok || result.error) {
      const errorMessage = "API request failed, Check console for details!";
      showErrorToast(errorMessage, { result });
      return {
        data: null,
        error: errorMessage,
      };
    }

    return result;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    showErrorToast(errorMessage, error);
    return {
      data: null,
      error: errorMessage,
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

//--------------------------------

const fixImageURLs = (images: IImageDoc[]) => {
  // Prefix image sources with API base URL

  return images.map((image) => ({
    ...image,
    src: image.src.startsWith("http")
      ? image.src
      : `${API_BASE_URL}${image.src}`,
  }));
};

const fixImageMeta = (images: IImageDoc[]) => {
  const datasetFilters = DATASETS_FILTERS[CURRENT_DATASET];
  const metaDisplayFields = datasetFilters?.metaDisplayFields || {};

  const retImages = images.map((image) => {
    let filteredMeta: Record<string, any> = {};

    if (image.meta) {
      for (const [key, value] of Object.entries(image.meta)) {
        if (key in metaDisplayFields) {
          const displayKey = metaDisplayFields[key];
          filteredMeta[displayKey] = value;
        }
      }
    }

    return {
      ...image,
      meta: filteredMeta,
    };
  });
  return retImages;
};

//--------------------------------

const apiImageUpload = async (
  file: File
): Promise<IApiResponse<IUploadResponse>> => {
  if (!file.type.startsWith("image/")) {
    const errorMessage = "Please select an image file.";
    showErrorToast(errorMessage);
    return {
      data: null,
      error: errorMessage,
    };
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

const getSampleImages = async () => {
  const response = await apiPost<IImageDoc[]>(ENDPOINTS.GET_SAMPLE_IMAGES, {});

  if (response?.data) {
    const fixedImages = fixImageURLs(response.data);
    response.data = fixImageMeta(fixedImages);
  }

  return response;
};

const existingElementSearch = async (input: IExistingElementSearchInput) => {
  const response = await apiPost<IVectorSetSearchResponse>(
    ENDPOINTS.EXISTING_ELEMENT_SEARCH,
    input
  );
  if (response?.data) {
    const fixedImages = fixImageURLs(response.data.queryResults);
    response.data.queryResults = fixImageMeta(fixedImages);
  }
  return response;
};

const newElementSearch = async (input: INewElementSearchInput) => {
  const response = await apiPost<IVectorSetSearchResponse>(
    ENDPOINTS.NEW_ELEMENT_SEARCH,
    input
  );
  if (response?.data) {
    const fixedImages = fixImageURLs(response.data.queryResults);
    response.data.queryResults = fixImageMeta(fixedImages);
  }
  return response;
};

export {
  apiPost,
  apiImageUpload,
  existingElementSearch,
  getSampleImages,
  newElementSearch,
};
