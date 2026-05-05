import type { ImageDoc } from '../../types.js';

import { RedisWrapperST } from '../../utils/redis.js';
import { getConfig } from '../../config.js';
import { formatImageResults } from '../common/index.js';

async function getSampleImages() {
  const config = getConfig();
  const dataset = config.DATASET;

  const keyPrefix = dataset.VECTOR_SET.KEY;
  const redisWrapperST = RedisWrapperST.getInstance();
  const MAX_ELEMENTS = 100;

  const results = await redisWrapperST.vsGetRandomElements(
    keyPrefix,
    MAX_ELEMENTS,
  );

  const formattedResults: ImageDoc[] = formatImageResults(
    results as Record<string, unknown>[],
    dataset.IMAGE_PREFIX,
  );

  return formattedResults;
}

export { getSampleImages };
