'use client'

import { logClientAction } from '@/lib/client-logger'
import { LOAD_PROFILES, type LoadIntensity } from '@/lib/simulate-load/presets'
import {
  burstCompleted,
  burstFailed,
  frameObserved,
  simulationFinished,
  simulationStarted,
} from '@/store/load-slice'
import type { AppDispatch } from '@/store'

/**
 * Client half of the "Simulate load" button.
 *
 * A convincing simulation has to hit all three things that actually make a page
 * slow, so this runs them together:
 *
 *  1. **Network/server** — a burst of concurrent POSTs to `/api/simulate-load`,
 *     each of which burns CPU on the pod (see that route).
 *  2. **Main thread** — CPU burned in the browser in short slices, which is what
 *     makes the UI visibly janky rather than merely busy.
 *  3. **DOM** — thousands of extra rows mounted by `LoadBallast` (via the store).
 *
 * The main-thread burn is sliced and yielded between slices on purpose: one long
 * blocking loop would freeze React entirely, so the progress the button is
 * reporting would never paint.
 */
const BURN_SLICE_MS = 40

const wait = () => new Promise<void>((resolve) => setTimeout(resolve, 0))

const burnSlice = (budgetMs: number) => {
  const deadline = performance.now() + budgetMs
  let checksum = 0

  while (performance.now() < deadline) {
    for (let i = 0; i < 10_000; i += 1) {
      checksum = (checksum + Math.sqrt(i + checksum)) % 999_983
    }
  }

  return checksum
}

const burnMainThread = async (totalMs: number, signal: AbortSignal, onFrame: (gapMs: number) => void) => {
  const deadline = performance.now() + totalMs
  let previous = performance.now()

  while (performance.now() < deadline && !signal.aborted) {
    burnSlice(BURN_SLICE_MS)

    const now = performance.now()
    onFrame(now - previous)
    previous = now

    // Hand the main thread back so React can paint the progress that this very
    // loop is generating.
    await wait()
  }
}

const runBursts = async (
  intensity: LoadIntensity,
  runId: string,
  signal: AbortSignal,
  dispatch: AppDispatch
) => {
  const profile = LOAD_PROFILES[intensity]
  let dispatched = 0

  const worker = async () => {
    while (dispatched < profile.requests && !signal.aborted) {
      dispatched += 1

      try {
        const response = await fetch('/api/simulate-load', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ intensity, runId, workMs: profile.serverWorkMs }),
          signal,
        })

        if (!response.ok) throw new Error(`HTTP ${response.status}`)

        const result = (await response.json()) as { durationMs?: number }
        dispatch(burstCompleted({ serverMs: result.durationMs ?? 0 }))
      } catch {
        // An aborted run is not a failure — the visitor asked it to stop.
        if (!signal.aborted) dispatch(burstFailed())
      }
    }
  }

  await Promise.all(Array.from({ length: profile.concurrency }, worker))
}

export const runLoadSimulation = async ({
  intensity,
  dispatch,
  signal,
}: {
  intensity: LoadIntensity
  dispatch: AppDispatch
  signal: AbortSignal
}) => {
  const profile = LOAD_PROFILES[intensity]
  const runId = crypto.randomUUID()
  const startedAt = performance.now()

  dispatch(
    simulationStarted({
      runId,
      intensity,
      requestsTotal: profile.requests,
      domRows: profile.domRows,
    })
  )

  logClientAction(
    'load.simulation-started',
    { runId, intensity, requests: profile.requests, clientBurnMs: profile.clientBurnMs },
    'warn'
  )

  // Announced separately from the bursts so a dashboard can count runs, not
  // just the requests they generate.
  void fetch('/api/simulate-load/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ intensity, runId }),
  }).catch(() => {})

  await Promise.all([
    runBursts(intensity, runId, signal, dispatch),
    burnMainThread(profile.clientBurnMs, signal, (gapMs) => dispatch(frameObserved(Math.round(gapMs)))),
  ])

  const aborted = signal.aborted
  dispatch(simulationFinished({ aborted }))

  logClientAction(
    aborted ? 'load.simulation-aborted' : 'load.simulation-finished',
    { runId, intensity, durationMs: Math.round(performance.now() - startedAt) },
    'warn'
  )

  return { runId, aborted }
}
