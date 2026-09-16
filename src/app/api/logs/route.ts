import { NextResponse, type NextRequest } from 'next/server'

import { logger } from '@/lib/logger'
import { recordClientAction } from '@/lib/metrics'
import { getRequestContext } from '@/lib/visitor/request-context'

const LEVELS = ['debug', 'info', 'warn', 'error'] as const
type Level = (typeof LEVELS)[number]

const isLevel = (value: unknown): value is Level => LEVELS.includes(value as Level)

type ClientLogEvent = {
  action: string
  level?: Level
  context?: Record<string, unknown>
}

const isClientLogEvent = (value: unknown): value is ClientLogEvent =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as ClientLogEvent).action === 'string' &&
  (value as ClientLogEvent).action.length > 0

/** A page unload can flush a batch of queued events, so accept an array too. */
const MAX_EVENTS_PER_REQUEST = 50

/**
 * Bridges browser-side actions into the same structured, server-side log
 * stream (stdout on the pod) used for everything else, so "what did a visitor
 * click" and "what did the news engine do" show up in one place for
 * monitoring/log platforms instead of being stuck in devtools consoles.
 *
 * Nobody signs in here, so each line is stamped with the anonymous
 * visitor/session ids plus request metadata (`getRequestContext`) — read
 * server-side from the cookies and headers rather than trusted from the body,
 * so a client cannot claim to be someone else's session.
 */
export async function POST(request: NextRequest) {
  const body: unknown = await request.json().catch(() => null)
  const events = (Array.isArray(body) ? body : [body]).slice(0, MAX_EVENTS_PER_REQUEST)
  const requestContext = getRequestContext(request)
  let accepted = 0

  for (const event of events) {
    if (!isClientLogEvent(event)) continue

    const level = isLevel(event.level) ? event.level : 'info'

    logger[level](
      {
        source: 'browser',
        action: event.action,
        context: event.context,
        ...requestContext,
      },
      `[client] ${event.action}`
    )
    recordClientAction({ action: event.action, level })
    accepted += 1
  }

  return NextResponse.json({ accepted })
}
