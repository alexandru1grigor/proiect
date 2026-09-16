import { redirect } from 'next/navigation'

import { DEFAULT_FEED } from '@/types/feed'

export default function RootPage() {
  redirect(`/stories/${DEFAULT_FEED}`)
}
