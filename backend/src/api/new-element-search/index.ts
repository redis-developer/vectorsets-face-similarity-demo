import type { DatasetNameType } from "../../config.js";
import { z } from "zod";

import * as InputSchemas from "../../input-schema.js";
import { RedisWrapperST } from "../../utils/redis.js";
import { getConfig } from "../../config.js";
// import { getImageEmbeddings } from "./image-embeddings.js";
import { getCelebEmbedding } from "./celeb-embeddings.js";

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
  const imageEmbeddings = await getCelebEmbedding(input.localImageUrl);
  const imageEmbeddingsStr = imageEmbeddings
    .map((val) => val.toString())
    .join(" ");
  return `VSIM '${keyPrefix}' VALUES ${DIM} ${imageEmbeddingsStr} WITHSCORES WITHATTRIBS ${filterQuery} COUNT ${input.count}`;
};

const newElementSearch = async (
  input: z.infer<typeof InputSchemas.newElementSearchInputSchema>
) => {
  const vInput = InputSchemas.newElementSearchInputSchema.parse(input); // validate input

  const redisWrapperST = RedisWrapperST.getInstance();
  let runQuery = await buildQuery(vInput);
  const result = await redisWrapperST.rawCommandExecute(runQuery);
  console.log(result);

  return result;
};

export { newElementSearch };
