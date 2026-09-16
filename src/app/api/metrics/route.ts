import { metricsRegistry } from '@/lib/metrics'

// prom-client needs the Node.js runtime (not Edge), and this must never be
// statically cached — every scrape has to return fresh values.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const body = await metricsRegistry.metrics()

  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': metricsRegistry.contentType },
  })
}
