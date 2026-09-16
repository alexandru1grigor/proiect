export type PaginationMeta = {
  total: number
  page: number
  limit: number
  totalPages: number
}

export type Paginated<T> = {
  data: T[]
  meta: PaginationMeta
}

export type PaginationQuery = {
  page?: number
  limit?: number
}

export const DEFAULT_PAGE_SIZE = 20

/** Clamps caller-supplied paging to sane bounds before it reaches the engine. */
export const normalizePaginationQuery = ({ page, limit }: PaginationQuery, maxLimit = 50) => ({
  page: Number.isFinite(page) && Number(page) > 0 ? Math.floor(Number(page)) : 1,
  limit:
    Number.isFinite(limit) && Number(limit) > 0
      ? Math.min(Math.floor(Number(limit)), maxLimit)
      : DEFAULT_PAGE_SIZE,
})

export const buildPaginationMeta = ({
  total,
  page,
  limit,
}: {
  total: number
  page: number
  limit: number
}): PaginationMeta => ({
  total,
  page,
  limit,
  totalPages: limit > 0 ? Math.ceil(total / limit) : 0,
})
