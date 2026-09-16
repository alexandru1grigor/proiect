'use client'

import { useEffect, useState } from 'react'

/**
 * Milliseconds since `startedAt`, ticking while `active` and frozen at
 * `finishedAt` once it isn't. Reading the clock during render would make the
 * component impure (and the value would only update when something else
 * happened to re-render it), so the tick is an effect.
 */
export const useElapsed = ({
  startedAt,
  finishedAt,
  active,
  intervalMs = 250,
}: {
  startedAt: number | null
  finishedAt: number | null
  active: boolean
  intervalMs?: number
}) => {
  const [now, setNow] = useState<number | null>(null)

  useEffect(() => {
    if (!active) return

    const timer = setInterval(() => setNow(Date.now()), intervalMs)

    return () => clearInterval(timer)
  }, [active, intervalMs])

  if (startedAt === null) return 0

  const end = active ? (now ?? startedAt) : (finishedAt ?? now ?? startedAt)

  return Math.max(end - startedAt, 0)
}
