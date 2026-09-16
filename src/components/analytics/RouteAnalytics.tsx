'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { useReportWebVitals } from 'next/web-vitals'

import { logClientAction } from '@/lib/client-logger'

/**
 * Page-level telemetry for an app with no accounts: every view and every Core
 * Web Vital is reported to the server log stream, stamped with the anonymous
 * visitor/session ids the server adds. Without this, the only visible traffic
 * would be data fetches — which misses cached navigations entirely.
 */
export function RouteAnalytics() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const previousPath = useRef<string | null>(null)
  const enteredAt = useRef<number>(0)

  useReportWebVitals((metric) => {
    logClientAction('client.web-vital', {
      name: metric.name,
      value: Math.round(metric.value * 100) / 100,
      rating: metric.rating,
      navigationType: metric.navigationType,
    })
  })

  useEffect(() => {
    const query = searchParams.toString()
    const path = query ? `${pathname}?${query}` : pathname

    const now = Date.now()

    logClientAction('page.view', {
      from: previousPath.current,
      // How long the previous page held attention — the cheapest engagement
      // signal available without any client-side analytics product.
      previousDurationMs: previousPath.current ? now - enteredAt.current : undefined,
    })

    previousPath.current = path
    enteredAt.current = now
  }, [pathname, searchParams])

  return null
}
