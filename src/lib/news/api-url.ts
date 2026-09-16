/**
 * The one and only configurable value in this app.
 *
 * It is read from `process.env` **at request time** and never inlined into the
 * browser bundle (no `NEXT_PUBLIC_` prefix, no client import), so a single
 * built Docker image can be pointed at a different engine per environment
 * purely through the Helm `env` values — or with `oc set env` on a running
 * Deployment, without a rebuild.
 */
const DEFAULT_NEWS_API_URL = 'https://hacker-news.firebaseio.com/v0'

export const getNewsApiBaseUrl = () =>
  (process.env.NEWS_API_URL || DEFAULT_NEWS_API_URL).replace(/\/+$/, '')
