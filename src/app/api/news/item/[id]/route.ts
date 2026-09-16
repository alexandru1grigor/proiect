import { NextResponse, type NextRequest } from 'next/server'

import { NewsEngineError, fetchItem } from '@/lib/news/engine'
import { isVisibleItem, toStoryDetail } from '@/lib/news/normalize'
import { withObservability } from '@/lib/route-handler'

const handler = withObservability<{ params: Promise<{ id: string }> }>(
  '/api/news/item/[id]',
  async (_request: NextRequest, { params }) => {
    const { id } = await params
    const numericId = Number(id)

    if (!Number.isInteger(numericId) || numericId <= 0) {
      throw new NewsEngineError('Invalid story id', 400)
    }

    const item = await fetchItem(numericId)

    if (!isVisibleItem(item)) {
      throw new NewsEngineError('Story not found', 404)
    }

    return NextResponse.json(toStoryDetail(item))
  }
)

export { handler as GET }
