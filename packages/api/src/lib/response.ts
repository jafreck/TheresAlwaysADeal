export interface EnvelopeMeta {
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
}

export interface EnvelopeResponse<T> {
  data: T[];
  meta: EnvelopeMeta;
}

export function buildEnvelopeResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): EnvelopeResponse<T> {
  return {
    data,
    meta: {
      total,
      page,
      limit,
      hasNext: page * limit < total,
    },
  };
}
