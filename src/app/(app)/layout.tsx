import type { ReactNode } from 'react'

import { AppShell } from '@/components/app-shell/AppShell'

// Every route in this segment reads live feed data and per-visit state (the
// anonymous visitor cookie, list paging from the URL search params), so there
// is no useful static shell to prerender.
export const dynamic = 'force-dynamic'

export default function AppLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>
}
