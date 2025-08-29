import type { IImageDoc } from "../../types.js";

import { z } from "zod";

import * as InputSchemas from "../../input-schema.js";
import { RedisWrapperST } from "../../utils/redis.js";
import { getConfig } from "../../config.js";
import {
  formatImageResults,
  convertVectorSetSearchResultsToObjectArr,
} from "../common/index.js";

const buildQuery = (
  input: z.infer<typeof InputSchemas.existingElementSearchInputSchema>
) => {
  const config = getConfig();
  const dataset = config.DATASETS[config.CURRENT_DATASET];

  const keyPrefix = dataset.VECTOR_SET.KEY;
  let filterQuery = "";
  if (input.filterQuery) {
    filterQuery = `FILTER '${input.filterQuery}'`;
  }
  return `VSIM '${keyPrefix}' ELE '${input.id}' WITHSCORES WITHATTRIBS ${filterQuery} COUNT ${input.count}`;
};

const existingElementSearch = async (
  input: z.infer<typeof InputSchemas.existingElementSearchInputSchema>
) => {
  const vInput = InputSchemas.existingElementSearchInputSchema.parse(input); // validate input

  const config = getConfig();
  const dataset = config.DATASETS[config.CURRENT_DATASET];

  const redisWrapperST = RedisWrapperST.getInstance();
  let runQuery = buildQuery(vInput);
  const results = (await redisWrapperST.rawCommandExecute(runQuery)) as any[];
  const objectResults = convertVectorSetSearchResultsToObjectArr(results);

  // Filter out the searched element ID from results
  const filteredResults = objectResults.filter(
    (result) => result.elementId !== input.id
  );

  const formattedResults: IImageDoc[] = formatImageResults(
    filteredResults,
    dataset.IMAGE_PREFIX
  );

  return formattedResults;
};

export { existingElementSearch };
