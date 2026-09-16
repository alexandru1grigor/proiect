'use client'

import { SESSION_COOKIE_NAME, VISITOR_COOKIE_NAME } from '@/lib/visitor/cookie'

type Level = 'debug' | 'info' | 'warn' | 'error'

type ClientLogEvent = {
  action: string
  level?: Level
  context?: Record<string, unknown>
}

const ENDPOINT = '/api/logs'
const FLUSH_INTERVAL_MS = 1_000
const MAX_BATCH = 20

let queue: ClientLogEvent[] = []
let flushTimer: ReturnType<typeof setTimeout> | null = null
let listenersAttached = false

const readCookie = (name: string) => {
  if (typeof document === 'undefined') return undefined

  return document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(`${name}=`))
    ?.slice(name.length + 1)
}

/**
 * The server stamps every line with the visitor/session ids it reads from the
 * cookies itself (it cannot trust the body for those). What the browser adds
 * here is the part only the browser knows: where the visitor was, on what kind
 * of screen, over what sort of connection.
 */
const getClientContext = () => {
  if (typeof window === 'undefined') return {}

  const connection = (
    navigator as Navigator & { connection?: { effectiveType?: string; downlink?: number } }
  ).connection

  return {
    path: window.location.pathname + window.location.search,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    connection: connection?.effectiveType,
    // Client clock, so out-of-order or delayed batches can still be sequenced.
    at: new Date().toISOString(),
  }
}

const send = (events: ClientLogEvent[], useBeacon: boolean) => {
  if (events.length === 0) return

  try {
    const payload = JSON.stringify(events)

    // `sendBeacon` survives page unloads (e.g. a navigation right after the
    // action) and doesn't block the main thread; fall back to a best-effort
    // fetch when it's unavailable or refuses the payload.
    if (useBeacon && navigator.sendBeacon?.(ENDPOINT, new Blob([payload], { type: 'application/json' }))) {
      return
    }

    void fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    }).catch(() => {})
  } catch {
    // Logging must never break the app.
  }
}

const flush = (useBeacon = false) => {
  if (flushTimer) {
    clearTimeout(flushTimer)
    flushTimer = null
  }

  const events = queue
  queue = []
  send(events, useBeacon)
}

const attachListeners = () => {
  if (listenersAttached || typeof window === 'undefined') return

  listenersAttached = true
  // `pagehide` fires in cases `beforeunload` misses (bfcache, mobile Safari),
  // and is the last chance to get queued events off the device.
  window.addEventListener('pagehide', () => flush(true))
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush(true)
  })
}

/**
 * Fire-and-forget bridge from browser-side visitor actions to the server's
 * structured log stream (`/api/logs` -> pino -> pod stdout), so "what did a
 * visitor do" is visible in the same place as the engine and request logs
 * instead of being stuck in a devtools console.
 *
 * Events are batched for up to a second: this app has no accounts, so it logs
 * generously (every view, click and outbound link), and one request per event
 * would be its own kind of load. Never throws and never blocks the caller — a
 * lost log line is preferable to a broken interaction.
 */
export const logClientAction = (action: string, context?: Record<string, unknown>, level: Level = 'info') => {
  if (process.env.NODE_ENV === 'development') {
    console[level === 'debug' ? 'log' : level](`[action] ${action}`, context ?? '')
  }

  if (typeof window === 'undefined') return

  attachListeners()

  queue.push({
    action,
    level,
    context: { ...getClientContext(), ...context },
  })

  // Errors are the events most likely to be followed by the page dying, so
  // they skip the batch window.
  if (queue.length >= MAX_BATCH || level === 'error') {
    flush()
    return
  }

  flushTimer ??= setTimeout(() => flush(), FLUSH_INTERVAL_MS)
}

/** The ids the server correlates on, for surfacing in the UI. */
export const getVisitorIds = () => ({
  visitorId: readCookie(VISITOR_COOKIE_NAME),
  sessionId: readCookie(SESSION_COOKIE_NAME),
})

export const flushClientLogs = () => flush(true)
