export const PAGINATION_DEFAULTS = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  MAX_EXPORT: 5000,
  MAX_GDPR_BATCH: 50,
} as const;

export const MAX_GDPR_BATCH = PAGINATION_DEFAULTS.MAX_GDPR_BATCH;

function parsePositiveInt(value: string | null, fallback: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function parsePagination(searchParams: URLSearchParams): {
  page: number;
  limit: number;
  skip: number;
  take: number;
} {
  const page = Math.max(
    1,
    parsePositiveInt(searchParams.get("page"), PAGINATION_DEFAULTS.DEFAULT_PAGE)
  );
  const rawLimit = parsePositiveInt(
    searchParams.get("limit"),
    PAGINATION_DEFAULTS.DEFAULT_LIMIT
  );
  const limit = Math.min(
    Math.max(1, rawLimit),
    PAGINATION_DEFAULTS.MAX_LIMIT
  );

  return {
    page,
    limit,
    skip: (page - 1) * limit,
    take: limit,
  };
}

export function buildMeta(total: number, page: number, limit: number) {
  return {
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
    has_next: page * limit < total,
    has_prev: page > 1,
  };
}
