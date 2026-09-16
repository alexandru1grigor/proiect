'use client'

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

import { getVisitorIds, logClientAction } from '@/lib/client-logger'

export type Visitor = {
  visitorId: string
  sessionId: string
  persisted: boolean
}

type VisitorContextValue = {
  visitor: Visitor | null
  status: 'loading' | 'ready' | 'unavailable'
}

const VisitorContext = createContext<VisitorContextValue | null>(null)

/**
 * There is no sign-in here, so "who" means an anonymous, cookie-scoped visitor
 * id issued by `src/proxy.ts`. Resolving it once at the top of the tree gives
 * the header something to show and confirms to the visitor — rather than
 * hiding it — that their visit is being correlated in the logs.
 */
export function VisitorProvider({ children }: { children: ReactNode }) {
  const [visitor, setVisitor] = useState<Visitor | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'unavailable'>('loading')

  useEffect(() => {
    let cancelled = false

    fetch('/api/visitor')
      .then(async (response) => {
        if (cancelled) return

        if (!response.ok) {
          setStatus('unavailable')
          return
        }

        const next = (await response.json()) as Visitor
        setVisitor(next)
        setStatus('ready')

        // The first event of a session is the one that makes every later event
        // attributable, so it is emitted as soon as the ids are known.
        logClientAction('visitor.identified', {
          persisted: next.persisted,
          cookiesReadable: Boolean(getVisitorIds().visitorId),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          language: navigator.language,
          screen: `${window.screen.width}x${window.screen.height}`,
        })
      })
      .catch(() => {
        if (!cancelled) setStatus('unavailable')
      })

    return () => {
      cancelled = true
    }
  }, [])

  const value = useMemo(() => ({ visitor, status }), [visitor, status])

  return <VisitorContext.Provider value={value}>{children}</VisitorContext.Provider>
}

export function useVisitor() {
  const context = useContext(VisitorContext)

  if (!context) {
    throw new Error('useVisitor must be used within a VisitorProvider')
  }

  return context
}
