import { logger } from '@/lib/logger'
import { recordUpstreamRequest } from '@/lib/metrics'
import { getNewsApiBaseUrl } from '@/lib/news/api-url'
import type { EngineItem, EngineUser } from '@/types/story'

/**
 * Server-side client for the news engine (Hacker News API).
 *
 * The browser never talks to the engine directly — it calls this app's own
 * same-origin routes under `/api/news/*`, which call this module. That keeps
 * the engine URL server-side (see `api-url.ts`), gives every upstream call
 * uniform logging and Prometheus metrics, and lets the routes fold the
 * engine's very chatty shape (one request per item) into a single response.
 */

/** Feed and item endpoints are cheap but volatile; items barely change once posted. */
const FEED_REVALIDATE_SECONDS = 60
const ITEM_REVALIDATE_SECONDS = 300
const USER_REVALIDATE_SECONDS = 600

const UPSTREAM_TIMEOUT_MS = 8_000

export class NewsEngineError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message)
    this.name = 'NewsEngineError'
  }
}

const fetchJson = async <T>(path: string, resource: string, revalidate: number): Promise<T> => {
  const start = performance.now()
  const url = `${getNewsApiBaseUrl()}/${path}`

  let response: Response

  try {
    response = await fetch(url, {
      next: { revalidate },
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    })
  } catch (error) {
    const durationSeconds = (performance.now() - start) / 1000
    recordUpstreamRequest({ resource, status: 'error', durationSeconds })
    logger.error({ resource, path, err: error }, 'news engine request failed')
    throw new NewsEngineError('The news engine is unreachable', 502)
  }

  const durationSeconds = (performance.now() - start) / 1000
  recordUpstreamRequest({ resource, status: response.status, durationSeconds })

  if (!response.ok) {
    logger.warn({ resource, path, status: response.status }, 'news engine returned an error')
    throw new NewsEngineError('The news engine returned an error', response.status === 404 ? 404 : 502)
  }

  logger.debug({ resource, path, durationMs: Math.round(durationSeconds * 1000) }, 'news engine request')

  return (await response.json()) as T
}

/** Ids for a feed, in engine-supplied rank order (up to 500 of them). */
export const fetchFeedIds = (endpoint: string) =>
  fetchJson<number[] | null>(`${endpoint}.json`, 'feed', FEED_REVALIDATE_SECONDS).then((ids) => ids ?? [])

export const fetchItem = (id: number) =>
  fetchJson<EngineItem | null>(`item/${id}.json`, 'item', ITEM_REVALIDATE_SECONDS)

export const fetchUser = (id: string) =>
  fetchJson<EngineUser | null>(`user/${encodeURIComponent(id)}.json`, 'user', USER_REVALIDATE_SECONDS)

/**
 * The engine has no batch endpoint, so a page of stories is N item requests.
 * They run concurrently but capped — an uncapped `Promise.all` over a page of
 * ids (or a comment tree) is exactly the kind of fan-out that gets an app
 * rate-limited, and it only gets worse under the load simulator.
 */
export const fetchItems = async (ids: number[], concurrency = 8): Promise<(EngineItem | null)[]> => {
  const results = new Array<EngineItem | null>(ids.length)
  let cursor = 0

  const worker = async () => {
    while (cursor < ids.length) {
      const index = cursor++
      try {
        results[index] = await fetchItem(ids[index])
      } catch {
        // One missing item must not sink the whole page; it is dropped by the
        // caller's filter and the failure is already logged/counted above.
        results[index] = null
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, ids.length) }, worker))

  return results
}
