import { NextResponse, type NextRequest } from 'next/server'

import { logger } from '@/lib/logger'
import { recordSimulatedLoadRun } from '@/lib/metrics'
import { withObservability } from '@/lib/route-handler'
import { DEFAULT_INTENSITY, isLoadIntensity } from '@/lib/simulate-load/presets'
import { getRequestContext } from '@/lib/visitor/request-context'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Marks the start of a load simulation, so a dashboard can tell "one visitor
 * ran a heavy simulation" apart from "320 synthetic requests arrived" without
 * having to infer runs from burst counts. Logged at `warn` on purpose: a
 * deliberate load spike is something an on-call reader should see.
 */
const handler = withObservability<unknown>('/api/simulate-load/start', async (request: NextRequest) => {
  const body: unknown = await request.json().catch(() => null)
  const payload = (body ?? {}) as { intensity?: unknown; runId?: unknown }
  const intensity = isLoadIntensity(payload.intensity) ? payload.intensity : DEFAULT_INTENSITY
  const runId = typeof payload.runId === 'string' ? payload.runId.slice(0, 64) : 'unknown'

  recordSimulatedLoadRun(intensity)
  logger.warn(
    { route: '/api/simulate-load/start', runId, intensity, ...getRequestContext(request) },
    'load simulation started'
  )

  return NextResponse.json({ runId, intensity, startedAt: new Date().toISOString() })
})

export { handler as POST }
