import type { IImageDoc } from "../../types.js";
import { RedisWrapperST } from "../../utils/redis.js";
import { getConfig } from "../../config.js";

const getSampleImages = async () => {
  const config = getConfig();
  const dataset = config.DATASETS[config.CURRENT_DATASET];

  const keyPrefix = dataset.VECTOR_SET.KEY;
  const redisWrapperST = RedisWrapperST.getInstance();
  const MAX_ELEMENTS = 100;

  const results = await redisWrapperST.vsGetRandomElements(
    keyPrefix,
    MAX_ELEMENTS
  );

  const formattedResults: IImageDoc[] = [];
  for (let res of results) {
    formattedResults.push({
      id: res.elementId,
      src: `${dataset.IMAGE_PREFIX}${res.imagePath}`,
      label: res.label,
    });
  }

  return formattedResults;
};

export { getSampleImages };
