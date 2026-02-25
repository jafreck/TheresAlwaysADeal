import { z } from "zod";

export const gameSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  storeUrl: z.string().url(),
  price: z.number().nonnegative(),
  originalPrice: z.number().nonnegative().optional(),
  discountPercent: z.number().min(0).max(100).optional(),
  currency: z.string().default("USD"),
  storeSlug: z.string().min(1),
  storeGameId: z.string().optional(),
  choiceIncluded: z.boolean().optional(),
});
