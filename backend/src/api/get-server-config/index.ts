import { getConfig, DATASET_NAMES } from "../../config.js";

const getServerConfig = async () => {
  const config = getConfig();
  return {
    currentDataset: config.CURRENT_DATASET,
    datasets: [
      {
        label: "Celebrity 1000",
        value: DATASET_NAMES.VSET_CELEB,
      },
      {
        label: "TMDB 10k",
        value: DATASET_NAMES.VSET_TMDB,
      },
    ],
  };
};

export { getServerConfig };
