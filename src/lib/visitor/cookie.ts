/**
 * Anonymous visitor identity.
 *
 * This app has no authentication — nobody signs in, and nothing here is a
 * trust boundary. These two opaque ids exist purely so the log stream can
 * answer "which browser did this, and which visit was it part of" instead of
 * showing a flat pile of unattributable actions:
 *
 * - `visitorId` — long-lived (1 year), stable per browser.
 * - `sessionId` — 30-minute sliding window, so a visit can be reconstructed.
 *
 * They are random opaque values with no personal data in them and, because
 * they grant no access, they are deliberately unsigned — which is what keeps
 * this app down to its single `NEWS_API_URL` env var (no cookie secret).
 */
export const VISITOR_COOKIE_NAME = 'news_vid'
export const SESSION_COOKIE_NAME = 'news_sid'

export const VISITOR_MAX_AGE_SECONDS = 60 * 60 * 24 * 365 // 1 year
export const SESSION_MAX_AGE_SECONDS = 60 * 30 // 30 minutes, refreshed on every request

export type VisitorIdentity = {
  visitorId: string
  sessionId: string
}

export const createId = () => crypto.randomUUID()

/**
 * `httpOnly` is off on purpose: these ids are not credentials, and the
 * browser-side logger reads them so client events carry the same correlation
 * ids as the server-side ones.
 */
const baseCookieOptions = {
  httpOnly: false,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
}

export const visitorCookieOptions = { ...baseCookieOptions, maxAge: VISITOR_MAX_AGE_SECONDS }
export const sessionCookieOptions = { ...baseCookieOptions, maxAge: SESSION_MAX_AGE_SECONDS }
