import { z } from "zod";

export const dealSchema = z.object({
  title: z.string().min(1),
  url: z.string().url(),
  imageUrl: z.string().url().optional(),
  originalPrice: z.number().positive().optional(),
  salePrice: z.number().positive().optional(),
  discountPercent: z.number().min(0).max(100).optional(),
  retailerDomain: z.string(),
  categoryName: z.string().optional(),
  expiresAt: z.date().optional(),
});
