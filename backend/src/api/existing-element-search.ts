import { z } from "zod";

import * as InputSchemas from "../input-schema.js";
import { RedisWrapperST } from "../utils/redis.js";
import { getConfig } from "../config.js";

const buildQuery = (
  input: z.infer<typeof InputSchemas.existingElementSearchInputSchema>
) => {
  const config = getConfig();
  const keyPrefix = config.REDIS_KEYS.VSET_CELEB.NAME;
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

  const redisWrapperST = RedisWrapperST.getInstance();
  let runQuery = buildQuery(vInput);
  const result = await redisWrapperST.rawCommandExecute(runQuery);

  return result;
};

export { existingElementSearch };
