import type { IDataset, IImageDoc } from "../../types.js";

import { z } from "zod";

import * as InputSchemas from "../../input-schema.js";
import { RedisWrapperST } from "../../utils/redis.js";
import { getConfig, DATASET_NAMES } from "../../config.js";
// import { getImageEmbeddings } from "./image-embeddings.js";
import { getCelebEmbedding } from "./celeb-embeddings.js";
import {
  convertVectorSetSearchResultsToObjectArr,
  formatImageResults,
} from "../common/index.js";
import { getImageEmbeddings } from "./image-embeddings.js";

const buildQuery = async (
  input: z.infer<typeof InputSchemas.newElementSearchInputSchema>,
  dataset: IDataset,
  datasetName: string
) => {
  const keyPrefix = dataset.VECTOR_SET.KEY;
  const DIM = dataset.VECTOR_SET.DIM;
  let filterQuery = "";
  if (input.filterQuery) {
    filterQuery = `FILTER '${input.filterQuery}'`;
  }
  let imageEmbeddings: number[] = [];

  if (datasetName === DATASET_NAMES.VSET_CELEB) {
    imageEmbeddings = await getCelebEmbedding(input.localImageUrl);
  } else if (datasetName === DATASET_NAMES.VSET_TMDB) {
    imageEmbeddings = await getImageEmbeddings(input.localImageUrl);
  }
  const imageEmbeddingsStr = imageEmbeddings
    .map((val) => val.toString())
    .join(" ");

  const query = `VSIM '${keyPrefix}' VALUES ${DIM} ${imageEmbeddingsStr} WITHSCORES WITHATTRIBS ${filterQuery} COUNT ${input.count}`;

  //--------------------------------
  const imageEmbeddingsSampleStr = imageEmbeddings
    .slice(0, 3)
    .map((val) => val.toString())
    .join(" ");
  const sampleQuery = `VSIM '${keyPrefix}' VALUES ${DIM} ${
    imageEmbeddingsSampleStr + "..."
  } WITHSCORES WITHATTRIBS ${filterQuery} COUNT ${input.count}`;
  //--------------------------------

  return { query, sampleQuery };
};

const newElementSearch = async (
  input: z.infer<typeof InputSchemas.newElementSearchInputSchema>
) => {
  const vInput = InputSchemas.newElementSearchInputSchema.parse(input); // validate input

  const config = getConfig();
  let datasetName = input.datasetName || config.CURRENT_DATASET;
  const dataset = config.DATASETS[datasetName];

  const redisWrapperST = RedisWrapperST.getInstance();
  const { query, sampleQuery } = await buildQuery(vInput, dataset, datasetName);
  const results = (await redisWrapperST.rawCommandExecute(query)) as any[];
  const objectResults = convertVectorSetSearchResultsToObjectArr(results);

  const formattedResults: IImageDoc[] = formatImageResults(
    objectResults,
    dataset.IMAGE_PREFIX
  );

  const returnObj = {
    query: sampleQuery, //query is large so we use sampleQuery to display in UI
    queryResults: formattedResults,
  };

  return returnObj;
};

export { newElementSearch };
