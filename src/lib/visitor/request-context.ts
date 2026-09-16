import type { NextRequest } from 'next/server'

import { SESSION_COOKIE_NAME, VISITOR_COOKIE_NAME } from '@/lib/visitor/cookie'

export type RequestContext = {
  visitorId?: string
  sessionId?: string
  ip?: string
  userAgent?: string
  referer?: string
  language?: string
  country?: string
}

/**
 * The "who" half of every server-side log line. There is no account to attach
 * an action to, so a log entry is only useful if it carries the anonymous
 * visitor/session ids plus the coarse request metadata (origin, client, locale)
 * that makes a report actionable — "which build, which browser, where from".
 */
export const getRequestContext = (request: NextRequest): RequestContext => {
  const forwardedFor = request.headers.get('x-forwarded-for')

  return {
    visitorId: request.cookies.get(VISITOR_COOKIE_NAME)?.value,
    sessionId: request.cookies.get(SESSION_COOKIE_NAME)?.value,
    // Behind an ingress/route the first entry is the real client; fall back to
    // the platform-specific header some proxies send instead.
    ip: forwardedFor?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || undefined,
    userAgent: request.headers.get('user-agent') ?? undefined,
    referer: request.headers.get('referer') ?? undefined,
    language: request.headers.get('accept-language')?.split(',')[0] ?? undefined,
    country: request.headers.get('x-vercel-ip-country') ?? request.headers.get('cf-ipcountry') ?? undefined,
  }
}
