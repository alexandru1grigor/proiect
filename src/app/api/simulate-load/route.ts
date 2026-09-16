import { NextResponse, type NextRequest } from 'next/server'

import { logger } from '@/lib/logger'
import { recordSimulatedLoadBurst, trackSimulatedLoadInFlight } from '@/lib/metrics'
import { withObservability } from '@/lib/route-handler'
import { DEFAULT_INTENSITY, MAX_SERVER_WORK_MS, isLoadIntensity } from '@/lib/simulate-load/presets'
import { getRequestContext } from '@/lib/visitor/request-context'

// Synthetic work is deliberately CPU-bound in this process — it is pointless
// if Next serves it from a cache or an edge runtime.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Backend half of the "Simulate load" button.
 *
 * Each call burns CPU in this process for a bounded slice of time and churns a
 * little memory, so the load shows up where it is supposed to: pod CPU,
 * `news_http_request_duration_seconds`, the event-loop lag in the default
 * Node.js metrics, and the log stream. The point is to have something real to
 * look at on a dashboard, so the work is genuine rather than a `sleep`.
 */
const burnCpu = (budgetMs: number) => {
  const deadline = performance.now() + budgetMs
  let iterations = 0
  let checksum = 0

  while (performance.now() < deadline) {
    // A cheap non-trivial computation the JIT cannot fold away.
    for (let i = 0; i < 20_000; i += 1) {
      checksum = (checksum + Math.sqrt(i * (iterations + 1))) % 1_000_003
    }
    iterations += 1
  }

  return { iterations, checksum }
}

const handler = withObservability<unknown>('/api/simulate-load', async (request: NextRequest) => {
  const body: unknown = await request.json().catch(() => null)
  const payload = (body ?? {}) as { intensity?: unknown; runId?: unknown; workMs?: unknown }

  const intensity = isLoadIntensity(payload.intensity) ? payload.intensity : DEFAULT_INTENSITY
  const runId = typeof payload.runId === 'string' ? payload.runId.slice(0, 64) : 'unknown'
  const requestedWorkMs = Number(payload.workMs)
  const workMs = Math.min(
    Number.isFinite(requestedWorkMs) && requestedWorkMs > 0 ? requestedWorkMs : 25,
    MAX_SERVER_WORK_MS
  )

  const result = await trackSimulatedLoadInFlight(async () => {
    const start = performance.now()
    const { iterations, checksum } = burnCpu(workMs)

    // Allocate and drop a chunk of short-lived memory so the simulation also
    // shows up as GC pressure, not only as CPU time.
    const ballast = new Array(20_000).fill(0).map((_, index) => ({ index, checksum }))

    return {
      iterations,
      checksum,
      ballast: ballast.length,
      durationMs: Math.round(performance.now() - start),
    }
  })

  recordSimulatedLoadBurst(intensity)

  logger.debug(
    { route: '/api/simulate-load', runId, intensity, ...result, ...getRequestContext(request) },
    'served synthetic load request'
  )

  return NextResponse.json({ runId, intensity, ...result })
})

export { handler as POST }
