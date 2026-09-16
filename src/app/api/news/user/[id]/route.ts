import { NextResponse, type NextRequest } from 'next/server'

import { NewsEngineError, fetchUser } from '@/lib/news/engine'
import { toNewsUser } from '@/lib/news/normalize'
import { withObservability } from '@/lib/route-handler'

const handler = withObservability<{ params: Promise<{ id: string }> }>(
  '/api/news/user/[id]',
  async (_request: NextRequest, { params }) => {
    const { id } = await params
    const user = await fetchUser(id)

    if (!user) {
      throw new NewsEngineError('Author not found', 404)
    }

    return NextResponse.json(toNewsUser(user))
  }
)

export { handler as GET }
