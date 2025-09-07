import { getConfig } from "../../config.js";

const getServerConfig = async () => {
  const config = getConfig();
  return {
    currentDataset: config.CURRENT_DATASET,
  };
};

export { getServerConfig };
