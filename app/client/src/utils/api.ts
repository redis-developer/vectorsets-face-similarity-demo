import type {
  ApiResponse,
  UploadResponse,
  ImageDoc,
  ExistingElementSearchInput,
  NewElementSearchInput,
  VectorSetSearchResponse,
} from '../types';
import type { ServerConfig } from './constants';

import { API_BASE_URL, IMAGE_BASE_URL } from './config';
import { META_DISPLAY_FIELDS } from './constants';
import { showErrorToast } from './toast';

const ENDPOINTS = {
  IMAGE_UPLOAD: '/imageUpload',
  GET_SAMPLE_IMAGES: '/getSampleImages',
  EXISTING_ELEMENT_SEARCH: '/existingElementSearch',
  NEW_ELEMENT_SEARCH: '/newElementSearch',
  GET_SERVER_CONFIG: '/getServerConfig',
};

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  try {
    if (!options.headers) {
      options.headers = {
        'Content-Type': 'application/json',
      };
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
    });

    const result = await response.json();

    if (!response.ok || result.error) {
      const errorMessage = 'API request failed. Check console for details.';
      showErrorToast(errorMessage, { result });
      return {
        data: null,
        error: errorMessage,
      };
    }

    return result;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    showErrorToast(errorMessage, error);
    return {
      data: null,
      error: errorMessage,
    };
  }
}

async function apiPost<T>(
  endpoint: string,
  body: unknown,
): Promise<ApiResponse<T>> {
  const serialized = body ? JSON.stringify(body) : undefined;
  const options: RequestInit = {
    method: 'POST',
    body: serialized,
  };
  return apiRequest<T>(endpoint, options);
}

//--------------------------------

function fixImageURLs(images: ImageDoc[]) {
  // Prefix image sources with API base URL

  return images.map((image) => ({
    ...image,
    src: image.src.startsWith('http')
      ? image.src
      : `${IMAGE_BASE_URL}${image.src}`,
  }));
}

function fixImageMeta(images: ImageDoc[]) {
  const retImages = images.map((image) => {
    let filteredMeta: Record<string, unknown> = {};

    if (image.meta) {
      for (const [key, value] of Object.entries(image.meta)) {
        if (key in META_DISPLAY_FIELDS) {
          const displayKey = META_DISPLAY_FIELDS[key];
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
}

//--------------------------------

async function apiImageUpload(
  file: File,
): Promise<ApiResponse<UploadResponse>> {
  if (!file.type.startsWith('image/')) {
    const errorMessage = 'Please select an image file.';
    showErrorToast(errorMessage);
    return {
      data: null,
      error: errorMessage,
    };
  }

  const formData = new FormData();
  formData.append('file', file);

  const options: RequestInit = {
    method: 'POST',
    body: formData,
    headers: {}, // Let browser set Content-Type for FormData
  };

  const response = await apiRequest<UploadResponse>(
    ENDPOINTS.IMAGE_UPLOAD,
    options,
  );

  return response;
}

async function getSampleImages() {
  const response = await apiPost<ImageDoc[]>(ENDPOINTS.GET_SAMPLE_IMAGES, {});

  if (response?.data) {
    const fixedImages = fixImageURLs(response.data);
    response.data = fixImageMeta(fixedImages);
  }

  return response;
}

async function existingElementSearch(input: ExistingElementSearchInput) {
  const response = await apiPost<VectorSetSearchResponse>(
    ENDPOINTS.EXISTING_ELEMENT_SEARCH,
    input,
  );
  if (response?.data) {
    const fixedImages = fixImageURLs(response.data.queryResults);
    response.data.queryResults = fixImageMeta(fixedImages);
  }
  return response;
}

async function newElementSearch(input: NewElementSearchInput) {
  const response = await apiPost<VectorSetSearchResponse>(
    ENDPOINTS.NEW_ELEMENT_SEARCH,
    input,
  );
  if (response?.data) {
    const fixedImages = fixImageURLs(response.data.queryResults);
    response.data.queryResults = fixImageMeta(fixedImages);
  }
  return response;
}

// Reserved for future use — fetch runtime config (e.g. basePath, feature flags)
async function getServerConfig() {
  const response = await apiPost<ServerConfig>(ENDPOINTS.GET_SERVER_CONFIG, {});
  return response;
}

export {
  apiPost,
  apiImageUpload,
  existingElementSearch,
  getSampleImages,
  newElementSearch,
  getServerConfig,
};
