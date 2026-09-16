'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useMemo } from 'react'

import { DEFAULT_PAGE_SIZE } from '@/types/pagination'

/**
 * Reads/writes list-page state (pagination) to the URL search params, so a
 * list view is shareable and bookmarkable and RTK Query stays the only source
 * of server state.
 */
export function useQueryParams() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const params = useMemo(() => Object.fromEntries(searchParams.entries()), [searchParams])

  const setParams = useCallback(
    (next: Record<string, string | number | undefined>) => {
      const merged = new URLSearchParams(searchParams.toString())

      Object.entries(next).forEach(([key, value]) => {
        if (value === undefined || value === '') {
          merged.delete(key)
        } else {
          merged.set(key, String(value))
        }
      })

      router.push(`${pathname}?${merged.toString()}`)
    },
    [pathname, router, searchParams]
  )

  const page = Number(params.page ?? 1) || 1
  const limit = Number(params.limit ?? DEFAULT_PAGE_SIZE) || DEFAULT_PAGE_SIZE

  return { params, setParams, page, limit }
}
