import { NextResponse, type NextRequest } from 'next/server'

import { NewsEngineError, fetchFeedIds, fetchItems } from '@/lib/news/engine'
import { isVisibleItem, toStory } from '@/lib/news/normalize'
import { withObservability } from '@/lib/route-handler'
import { getFeed, isFeedKey } from '@/types/feed'
import { buildPaginationMeta, normalizePaginationQuery } from '@/types/pagination'
import type { Paginated } from '@/types/pagination'
import type { Story } from '@/types/story'

/**
 * A page of a feed, assembled server-side.
 *
 * The engine returns a feed as a bare array of up to 500 ids and nothing else,
 * so pagination is this app's job: slice the ids, fetch only that slice's
 * items, and hand back the same `{ data, meta }` envelope every list screen in
 * the app consumes. Doing it here turns ~20 browser round trips per page into
 * one, and keeps the engine's shape from leaking into the UI.
 */
const handler = withObservability<{ params: Promise<{ feed: string }> }>(
  '/api/news/feed/[feed]',
  async (request: NextRequest, { params }) => {
    const { feed } = await params

    if (!isFeedKey(feed)) {
      throw new NewsEngineError(`Unknown feed "${feed}"`, 404)
    }

    const { page, limit } = normalizePaginationQuery({
      page: Number(request.nextUrl.searchParams.get('page')),
      limit: Number(request.nextUrl.searchParams.get('limit')),
    })

    const ids = await fetchFeedIds(getFeed(feed).endpoint)
    const offset = (page - 1) * limit
    const items = await fetchItems(ids.slice(offset, offset + limit))

    const data: Story[] = items
      .map((item, index) => (isVisibleItem(item) ? toStory(item, offset + index + 1) : null))
      .filter((story): story is Story => story !== null)

    const body: Paginated<Story> = {
      data,
      meta: buildPaginationMeta({ total: ids.length, page, limit }),
    }

    return NextResponse.json(body)
  }
)

export { handler as GET }
