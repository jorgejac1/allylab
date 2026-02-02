/**
 * Pagination Utilities
 *
 * Provides standardized pagination for list endpoints.
 */

export interface PaginationParams {
  limit?: number;
  offset?: number;
  page?: number;  // Alternative to offset (1-indexed)
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    page: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface PaginationOptions {
  defaultLimit?: number;
  maxLimit?: number;
}

const DEFAULT_OPTIONS: Required<PaginationOptions> = {
  defaultLimit: 20,
  maxLimit: 100,
};

/**
 * Parse and normalize pagination parameters from query string
 */
export function parsePaginationParams(
  query: Record<string, unknown> | null | undefined,
  options: PaginationOptions = {}
): { limit: number; offset: number } {
  const { defaultLimit, maxLimit } = { ...DEFAULT_OPTIONS, ...options };

  // Handle null/undefined query
  if (!query) {
    return { limit: defaultLimit, offset: 0 };
  }

  // Parse limit
  let limit = defaultLimit;
  if (query.limit !== undefined) {
    const parsedLimit = parseInt(String(query.limit), 10);
    if (!isNaN(parsedLimit) && parsedLimit > 0) {
      limit = Math.min(parsedLimit, maxLimit);
    }
  }

  // Parse offset - support both 'offset' and 'page' (1-indexed)
  let offset = 0;
  if (query.offset !== undefined) {
    const parsedOffset = parseInt(String(query.offset), 10);
    if (!isNaN(parsedOffset) && parsedOffset >= 0) {
      offset = parsedOffset;
    }
  } else if (query.page !== undefined) {
    const parsedPage = parseInt(String(query.page), 10);
    if (!isNaN(parsedPage) && parsedPage > 0) {
      offset = (parsedPage - 1) * limit;
    }
  }

  return { limit, offset };
}

/**
 * Apply pagination to an array and return paginated result
 */
export function paginate<T>(
  items: T[],
  params: { limit: number; offset: number }
): PaginatedResult<T> {
  const { limit, offset } = params;
  const total = items.length;
  const totalPages = Math.ceil(total / limit);
  const page = Math.floor(offset / limit) + 1;

  const paginatedItems = items.slice(offset, offset + limit);

  return {
    items: paginatedItems,
    pagination: {
      total,
      limit,
      offset,
      page,
      totalPages,
      hasMore: offset + paginatedItems.length < total,
    },
  };
}

/**
 * Helper to extract pagination query from Fastify request
 */
export function getPaginationFromQuery(
  querystring: Record<string, unknown> | null | undefined,
  options?: PaginationOptions
): { limit: number; offset: number } {
  return parsePaginationParams(querystring ?? {}, options);
}
