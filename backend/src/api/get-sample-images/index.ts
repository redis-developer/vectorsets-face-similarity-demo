import type { IDataset, IImageDoc } from "../../types.js";

import { z } from "zod";

import * as InputSchemas from "../../input-schema.js";
import { RedisWrapperST } from "../../utils/redis.js";
import { getConfig } from "../../config.js";
import { formatImageResults } from "../common/index.js";

const getSampleImages = async (
  input: z.infer<typeof InputSchemas.getSampleImagesInputSchema>
) => {
  const config = getConfig();
  let datasetName = input.datasetName || config.CURRENT_DATASET;
  const dataset = config.DATASETS[datasetName];

  const keyPrefix = dataset.VECTOR_SET.KEY;
  const redisWrapperST = RedisWrapperST.getInstance();
  const MAX_ELEMENTS = 100;

  const results = await redisWrapperST.vsGetRandomElements(
    keyPrefix,
    MAX_ELEMENTS
  );

  const formattedResults: IImageDoc[] = formatImageResults(
    results,
    dataset.IMAGE_PREFIX
  );

  return formattedResults;
};

export { getSampleImages };
