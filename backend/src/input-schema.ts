import { z } from "zod";
import { DATASET_NAMES } from "./config.js";

const zDatasetName = z.enum([
  DATASET_NAMES.VSET_CELEB,
  DATASET_NAMES.VSET_TMDB,
]);

export const existingElementSearchInputSchema = z.object({
  id: z.string(),
  count: z.number().min(1).max(50).optional().default(10),
  filterQuery: z.string().optional(),
  datasetName: zDatasetName.optional(),
});

export const newElementSearchInputSchema = z.object({
  localImageUrl: z.string(),
  count: z.number().min(1).max(50).optional().default(10),
  filterQuery: z.string().optional(),
  datasetName: zDatasetName.optional(),
});

export const getSampleImagesInputSchema = z.object({
  datasetName: zDatasetName.optional(),
});
