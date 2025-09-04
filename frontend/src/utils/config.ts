import type { DatasetNameType, IClientConfig } from "./constants";
import { DATASET_NAMES } from "./constants";
import { getServerConfig } from "./api";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

const IMAGE_BASE_URL = API_BASE_URL;
const MAX_UPLOAD_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Default configuration
const defaultConfig: IClientConfig = {
  currentDataset: DATASET_NAMES.VSET_TMDB as DatasetNameType,
};

let clientConfig: IClientConfig = { ...defaultConfig };

const setClientConfig = async (): Promise<void> => {
  try {
    const response = await getServerConfig();
    if (response.data) {
      clientConfig.currentDataset = response.data.currentDataset;
    }
  } catch (error) {
    console.error("Failed to fetch server config, using default:", error);
  }
};

const getClientConfig = () => {
  return clientConfig;
};

export {
  API_BASE_URL,
  IMAGE_BASE_URL,
  MAX_UPLOAD_FILE_SIZE,
  setClientConfig,
  getClientConfig,
};
