import { z } from "zod";

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const storeFilterSchema = z.object({
  store: z.string().optional(),
});

export const genreFilterSchema = z.object({
  genre: z.string().optional(),
});

export const sortSchema = z.object({
  sort: z.enum(["release_date", "newest"]).optional(),
});

export const commonQuerySchema = paginationSchema
  .merge(storeFilterSchema)
  .merge(genreFilterSchema)
  .merge(sortSchema);

export const dealsQuerySchema = commonQuerySchema.merge(
  z.object({
    min_discount: z.coerce.number().optional(),
    max_price: z.coerce.number().optional(),
    platform: z.string().optional(),
  }),
);

export const searchQuerySchema = paginationSchema.merge(
  z.object({
    q: z.string().min(1),
    store: z.string().optional(),
    genre: z.string().optional(),
    min_discount: z.coerce.number().optional(),
    max_price: z.coerce.number().optional(),
  }),
);

export const autocompleteQuerySchema = z.object({
  q: z.string().min(1),
  limit: z.coerce.number().int().positive().max(10).default(5),
});

export const priceHistoryQuerySchema = z.object({
  store: z.string().optional(),
});

// ─── Auth Schemas ─────────────────────────────────────────────────────────────

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
});
