import { NextResponse, type NextRequest } from 'next/server'

import { withObservability } from '@/lib/route-handler'
import { SESSION_COOKIE_NAME, VISITOR_COOKIE_NAME, createId } from '@/lib/visitor/cookie'

/**
 * Tells the browser which anonymous visitor/session it belongs to, so the UI
 * can show it (the header "you" chip) and the client logger can stamp the same
 * correlation ids the server uses onto its own events.
 *
 * The cookies themselves are issued by `src/proxy.ts` before this ever runs;
 * the fallback ids here only matter if a client blocks cookies entirely.
 */
const handler = withObservability<unknown>('/api/visitor', async (request: NextRequest) => {
  const visitorId = request.cookies.get(VISITOR_COOKIE_NAME)?.value
  const sessionId = request.cookies.get(SESSION_COOKIE_NAME)?.value

  return NextResponse.json({
    visitorId: visitorId ?? createId(),
    sessionId: sessionId ?? createId(),
    persisted: Boolean(visitorId && sessionId),
  })
})

export { handler as GET }
