import type { Metadata } from 'next'
import type { ReactNode } from 'react'

import { Providers } from '@/app/providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'News',
  description: 'News — the Hacker News front pages, with a list and story details',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
