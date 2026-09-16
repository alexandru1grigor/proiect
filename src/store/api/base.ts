import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react'

import { logClientAction } from '@/lib/client-logger'

const rawBaseQuery = fetchBaseQuery({
  // Same-origin routes under `app/api/news/*`, which call the news engine
  // using the URL from the server's runtime env. A relative URL here keeps the
  // engine address out of the client bundle so one build works across every
  // environment (see `lib/news/api-url.ts` for why that matters).
  baseUrl: '/api/news',
})

const baseQueryWithLogging: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions
) => {
  const start = performance.now()
  const method = (typeof args === 'string' ? 'GET' : args.method) ?? 'GET'
  const url = typeof args === 'string' ? args : args.url

  const result = await rawBaseQuery(args, api, extraOptions)

  // Every piece of data the visitor pulls (every RTK Query query) funnels
  // through here, so this is the single choke point to report "what did the
  // visitor just load" back to the server's structured log stream.
  logClientAction(
    `api.${method.toLowerCase()}`,
    {
      endpoint: api.endpoint,
      url,
      status: result.error?.status ?? 200,
      durationMs: Math.round(performance.now() - start),
    },
    result.error ? 'warn' : 'info'
  )

  return result
}

export const TAG_TYPES = ['Story', 'Feed', 'Comments', 'Author'] as const

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithLogging,
  tagTypes: TAG_TYPES,
  // The feeds move on their own; a visitor coming back to a tab should not be
  // looking at an hour-old front page.
  refetchOnFocus: true,
  refetchOnReconnect: true,
  keepUnusedDataFor: 120,
  endpoints: () => ({}),
})
