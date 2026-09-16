import { NextResponse } from 'next/server'

import { getNewsApiBaseUrl } from '@/lib/news/api-url'

// Probed by Kubernetes on a tight interval, so it must never be cached and
// must never touch the news engine — this answers "is this pod alive", not
// "is the engine healthy". A failing engine should show up as errors and
// metrics, not as a restart loop.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'news',
    // The app's only knob, echoed back so a misconfigured pod can be spotted
    // without shelling into it.
    newsApiUrl: getNewsApiBaseUrl(),
    uptimeSeconds: Math.round(process.uptime()),
  })
}
