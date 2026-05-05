import type { Dataset, ImageDoc } from '../../types.js';

import { z } from 'zod';

import * as InputSchemas from '../../input-schema.js';
import { RedisWrapperST } from '../../utils/redis.js';
import { getConfig } from '../../config.js';
import { getImageEmbedding } from './gemini-embeddings.js';
import {
  convertVectorSetSearchResultsToObjectArr,
  formatImageResults,
} from '../common/index.js';

async function buildQuery(
  input: z.infer<typeof InputSchemas.newElementSearchInputSchema>,
  dataset: Dataset,
) {
  const keyPrefix = dataset.VECTOR_SET.KEY;
  const DIM = dataset.VECTOR_SET.DIM;
  let filterQuery = '';
  if (input.filterQuery) {
    filterQuery = `FILTER '${input.filterQuery}'`;
  }

  const imageEmbeddings = await getImageEmbedding(input.localImageUrl);
  const imageEmbeddingsStr = imageEmbeddings
    .map((val) => val.toString())
    .join(' ');

  const query = `VSIM '${keyPrefix}' VALUES ${DIM} ${imageEmbeddingsStr} WITHSCORES WITHATTRIBS ${filterQuery} COUNT ${input.count}`;

  //--------------------------------
  const imageEmbeddingsSampleStr = imageEmbeddings
    .slice(0, 3)
    .map((val) => val.toString())
    .join(' ');
  const sampleQuery = `VSIM '${keyPrefix}' VALUES ${DIM} ${
    imageEmbeddingsSampleStr + '...'
  } WITHSCORES WITHATTRIBS ${filterQuery} COUNT ${input.count}`;
  //--------------------------------

  return { query, sampleQuery };
}

async function newElementSearch(
  input: z.infer<typeof InputSchemas.newElementSearchInputSchema>,
) {
  const vInput = InputSchemas.newElementSearchInputSchema.parse(input); // validate input

  const config = getConfig();
  const dataset = config.DATASET;

  const redisWrapperST = RedisWrapperST.getInstance();
  const { query, sampleQuery } = await buildQuery(vInput, dataset);
  const results = (await redisWrapperST.rawCommandExecute(
    query,
  )) as unknown as unknown[];
  const objectResults = convertVectorSetSearchResultsToObjectArr(results);

  const formattedResults: ImageDoc[] = formatImageResults(
    objectResults,
    dataset.IMAGE_PREFIX,
  );

  const returnObj = {
    query: sampleQuery, //query is large so we use sampleQuery to display in UI
    queryResults: formattedResults,
  };

  return returnObj;
}

export { newElementSearch };
