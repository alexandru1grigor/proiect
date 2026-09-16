import { NextResponse, type NextRequest } from 'next/server'

import { logger } from '@/lib/logger'
import { recordHttpRequest } from '@/lib/metrics'
import { NewsEngineError } from '@/lib/news/engine'
import { getRequestContext } from '@/lib/visitor/request-context'

/**
 * Wraps a route handler so that every request through it is timed, counted in
 * Prometheus, and logged with the anonymous visitor/session context — without
 * each handler repeating the same six lines (and eventually disagreeing about
 * what they emit).
 *
 * `route` is passed explicitly and must stay static (`/api/news/item/[id]`,
 * not the resolved path): it becomes a metric label, and interpolating ids
 * would give Prometheus one series per story ever viewed.
 */
export const withObservability =
  <Ctx>(route: string, handler: (request: NextRequest, context: Ctx) => Promise<Response>) =>
  async (request: NextRequest, context: Ctx): Promise<Response> => {
    const start = performance.now()
    const requestContext = getRequestContext(request)
    const finish = (status: number) =>
      recordHttpRequest({
        method: request.method,
        route,
        status,
        durationSeconds: (performance.now() - start) / 1000,
      })

    try {
      const response = await handler(request, context)

      logger.info(
        {
          route,
          method: request.method,
          status: response.status,
          query: Object.fromEntries(request.nextUrl.searchParams),
          durationMs: Math.round(performance.now() - start),
          ...requestContext,
        },
        'handled request'
      )
      finish(response.status)

      return response
    } catch (error) {
      const status = error instanceof NewsEngineError ? error.status : 500
      const message = error instanceof Error ? error.message : 'Unexpected error'

      logger.error(
        { route, method: request.method, status, err: { message }, ...requestContext },
        'request failed'
      )
      finish(status)

      return NextResponse.json({ message }, { status })
    }
  }
