import type { Instrumentation } from 'next'

import { logger } from '@/lib/logger'
import { getNewsApiBaseUrl } from '@/lib/news/api-url'

export const registerNode = () => {
  // The engine URL is logged at startup because it is the app's only knob:
  // when a pod is serving the wrong data, this line is the first thing worth
  // reading.
  logger.info(
    { nodeVersion: process.version, newsApiUrl: getNewsApiBaseUrl() },
    'news server starting'
  )
}

export const onRequestErrorNode: Instrumentation.onRequestError = async (error, request, context) => {
  const message = error instanceof Error ? error.message : String(error)
  const digest =
    typeof error === 'object' && error !== null && 'digest' in error ? String(error.digest) : undefined

  logger.error(
    { err: { message, digest }, path: request.path, method: request.method, routeType: context.routeType },
    'unhandled request error'
  )
}
