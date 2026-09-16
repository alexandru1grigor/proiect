import { hostname } from 'node:os'

import pino from 'pino'

/**
 * Structured, server-side logger. Writes newline-delimited JSON to stdout so
 * it's picked up as-is by container log drivers and any log-aggregation
 * platform (Loki, ELK, Datadog, CloudWatch, ...) without extra parsing rules.
 * In development, logs are pretty-printed instead for readability.
 *
 * The level is derived from `NODE_ENV` rather than its own env var: this app
 * deliberately exposes exactly one configurable variable (`NEWS_API_URL`).
 */
export const logger = pino({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  base: {
    service: 'news',
    pod: hostname(),
    env: process.env.NODE_ENV,
  },
  transport:
    process.env.NODE_ENV === 'development'
      ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard' } }
      : undefined,
})

export type Logger = typeof logger
