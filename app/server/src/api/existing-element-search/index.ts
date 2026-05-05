import type { Dataset, ImageDoc } from '../../types.js';

import { z } from 'zod';

import * as InputSchemas from '../../input-schema.js';
import { RedisWrapperST } from '../../utils/redis.js';
import { getConfig } from '../../config.js';
import {
  formatImageResults,
  convertVectorSetSearchResultsToObjectArr,
} from '../common/index.js';

function buildQuery(
  input: z.infer<typeof InputSchemas.existingElementSearchInputSchema>,
  dataset: Dataset,
) {
  const keyPrefix = dataset.VECTOR_SET.KEY;
  let filterQuery = '';
  if (input.filterQuery) {
    filterQuery = `FILTER '${input.filterQuery}'`;
  }
  return `VSIM '${keyPrefix}' ELE '${input.id}' WITHSCORES WITHATTRIBS ${filterQuery} COUNT ${input.count}`;
}

async function existingElementSearch(
  input: z.infer<typeof InputSchemas.existingElementSearchInputSchema>,
) {
  const vInput = InputSchemas.existingElementSearchInputSchema.parse(input); // validate input

  const config = getConfig();
  const dataset = config.DATASET;

  const redisWrapperST = RedisWrapperST.getInstance();
  let runQuery = buildQuery(vInput, dataset);
  const results = (await redisWrapperST.rawCommandExecute(
    runQuery,
  )) as unknown as unknown[];
  const objectResults = convertVectorSetSearchResultsToObjectArr(results);

  // Filter out the searched element ID from results
  const filteredResults = objectResults.filter(
    (result) => result.elementId !== input.id,
  );

  const formattedResults: ImageDoc[] = formatImageResults(
    filteredResults,
    dataset.IMAGE_PREFIX,
  );

  const returnObj = {
    query: runQuery,
    queryResults: formattedResults,
  };

  return returnObj;
}

export { existingElementSearch };
