import { NextResponse, type NextRequest } from 'next/server'

import {
  SESSION_COOKIE_NAME,
  VISITOR_COOKIE_NAME,
  createId,
  sessionCookieOptions,
  visitorCookieOptions,
} from '@/lib/visitor/cookie'

/**
 * There is nothing to authenticate here — this runs on every request purely to
 * make sure an anonymous visitor id and session id exist *before* any page or
 * route handler logs anything, so the very first action of a first-time
 * visitor is already correlated instead of arriving with empty ids.
 *
 * The session cookie is re-set on every request, which makes it a sliding
 * 30-minute window: a visitor who comes back an hour later starts a new
 * session while keeping the same visitor id.
 */
export default function proxy(request: NextRequest) {
  const response = NextResponse.next()

  const visitorId = request.cookies.get(VISITOR_COOKIE_NAME)?.value ?? createId()
  const sessionId = request.cookies.get(SESSION_COOKIE_NAME)?.value ?? createId()

  response.cookies.set(VISITOR_COOKIE_NAME, visitorId, visitorCookieOptions)
  response.cookies.set(SESSION_COOKIE_NAME, sessionId, sessionCookieOptions)

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - /api/metrics, /api/health (scrapes and probes — not visits, and they
     *   must stay cheap)
     * - _next/static, _next/image (Next.js internals)
     * - favicon.ico and other static assets
     */
    '/((?!api/metrics|api/health|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
