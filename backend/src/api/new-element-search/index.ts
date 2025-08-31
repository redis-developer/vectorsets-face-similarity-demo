import type { IImageDoc } from "../../types.js";

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
  input: z.infer<typeof InputSchemas.newElementSearchInputSchema>
) => {
  const config = getConfig();
  const dataset = config.DATASETS[config.CURRENT_DATASET];

  const keyPrefix = dataset.VECTOR_SET.KEY;
  const DIM = dataset.VECTOR_SET.DIM;
  let filterQuery = "";
  if (input.filterQuery) {
    filterQuery = `FILTER '${input.filterQuery}'`;
  }
  let imageEmbeddings: number[] = [];

  if (config.CURRENT_DATASET === DATASET_NAMES.VSET_CELEB) {
    imageEmbeddings = await getCelebEmbedding(input.localImageUrl);
  } else if (config.CURRENT_DATASET === DATASET_NAMES.VSET_TMDB) {
    imageEmbeddings = await getImageEmbeddings(input.localImageUrl);
  }
  const imageEmbeddingsStr = imageEmbeddings
    .map((val) => val.toString())
    .join(" ");
  return `VSIM '${keyPrefix}' VALUES ${DIM} ${imageEmbeddingsStr} WITHSCORES WITHATTRIBS ${filterQuery} COUNT ${input.count}`;
};

const newElementSearch = async (
  input: z.infer<typeof InputSchemas.newElementSearchInputSchema>
) => {
  const vInput = InputSchemas.newElementSearchInputSchema.parse(input); // validate input

  const config = getConfig();
  const dataset = config.DATASETS[config.CURRENT_DATASET];

  const redisWrapperST = RedisWrapperST.getInstance();
  let runQuery = await buildQuery(vInput);
  const results = (await redisWrapperST.rawCommandExecute(runQuery)) as any[];
  const objectResults = convertVectorSetSearchResultsToObjectArr(results);

  const formattedResults: IImageDoc[] = formatImageResults(
    objectResults,
    dataset.IMAGE_PREFIX
  );

  return formattedResults;
};

export { newElementSearch };
