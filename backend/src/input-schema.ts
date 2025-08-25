import { z } from "zod";

export const existingElementSearchInputSchema = z.object({
  id: z.string(),
  count: z.number().min(1).max(50).optional().default(10),
  filterQuery: z.string().optional(),
});
