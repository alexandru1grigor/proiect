import { Counter, Gauge, Histogram, Registry, collectDefaultMetrics } from 'prom-client'

/**
 * Process-wide Prometheus registry, exposed at `/api/metrics` for scraping.
 * Kept on `globalThis` so Next.js's dev-mode module reloading (and any
 * multi-instance module resolution during a single request) doesn't create
 * a second registry and start throwing "metric already registered" errors.
 */
const REGISTRY_KEY = Symbol.for('news.metrics-registry')

type MetricsBundle = {
  registry: Registry
  httpRequestsTotal: Counter<'method' | 'route' | 'status'>
  httpRequestDurationSeconds: Histogram<'method' | 'route' | 'status'>
  clientActionsTotal: Counter<'action' | 'level'>
  upstreamRequestsTotal: Counter<'resource' | 'status'>
  upstreamRequestDurationSeconds: Histogram<'resource' | 'status'>
  simulatedLoadRunsTotal: Counter<'intensity'>
  simulatedLoadBurstsTotal: Counter<'intensity'>
  simulatedLoadActive: Gauge<string>
}

const globalWithMetrics = globalThis as typeof globalThis & { [REGISTRY_KEY]?: MetricsBundle }

const createMetricsBundle = (): MetricsBundle => {
  const registry = new Registry()
  collectDefaultMetrics({ register: registry, prefix: 'news_' })

  const httpRequestsTotal = new Counter({
    name: 'news_http_requests_total',
    help: 'Total number of HTTP requests handled by this app (route handlers, not static assets)',
    labelNames: ['method', 'route', 'status'],
    registers: [registry],
  })

  const httpRequestDurationSeconds = new Histogram({
    name: 'news_http_request_duration_seconds',
    help: 'Duration of HTTP requests handled by this app, in seconds',
    labelNames: ['method', 'route', 'status'],
    buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
    registers: [registry],
  })

  const clientActionsTotal = new Counter({
    name: 'news_client_actions_total',
    help: 'Total number of user actions reported by the browser via /api/logs',
    labelNames: ['action', 'level'],
    registers: [registry],
  })

  const upstreamRequestsTotal = new Counter({
    name: 'news_upstream_requests_total',
    help: 'Total number of requests this app made to the news engine (NEWS_API_URL)',
    labelNames: ['resource', 'status'],
    registers: [registry],
  })

  const upstreamRequestDurationSeconds = new Histogram({
    name: 'news_upstream_request_duration_seconds',
    help: 'Duration of requests to the news engine, in seconds',
    labelNames: ['resource', 'status'],
    buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10],
    registers: [registry],
  })

  const simulatedLoadRunsTotal = new Counter({
    name: 'news_simulated_load_runs_total',
    help: 'Number of load simulations started from the "Simulate load" button',
    labelNames: ['intensity'],
    registers: [registry],
  })

  const simulatedLoadBurstsTotal = new Counter({
    name: 'news_simulated_load_bursts_total',
    help: 'Number of individual synthetic-work requests served for a load simulation',
    labelNames: ['intensity'],
    registers: [registry],
  })

  const simulatedLoadActive = new Gauge({
    name: 'news_simulated_load_active',
    help: 'Synthetic-work requests currently in flight on this pod',
    registers: [registry],
  })

  return {
    registry,
    httpRequestsTotal,
    httpRequestDurationSeconds,
    clientActionsTotal,
    upstreamRequestsTotal,
    upstreamRequestDurationSeconds,
    simulatedLoadRunsTotal,
    simulatedLoadBurstsTotal,
    simulatedLoadActive,
  }
}

const metrics = globalWithMetrics[REGISTRY_KEY] ?? createMetricsBundle()
globalWithMetrics[REGISTRY_KEY] = metrics

export const metricsRegistry = metrics.registry

export const recordHttpRequest = ({
  method,
  route,
  status,
  durationSeconds,
}: {
  method: string
  route: string
  status: number | string
  durationSeconds: number
}) => {
  const labels = { method, route, status: String(status) }
  metrics.httpRequestsTotal.inc(labels)
  metrics.httpRequestDurationSeconds.observe(labels, durationSeconds)
}

export const recordClientAction = ({ action, level }: { action: string; level: string }) => {
  metrics.clientActionsTotal.inc({ action, level })
}

export const recordUpstreamRequest = ({
  resource,
  status,
  durationSeconds,
}: {
  resource: string
  status: number | string
  durationSeconds: number
}) => {
  const labels = { resource, status: String(status) }
  metrics.upstreamRequestsTotal.inc(labels)
  metrics.upstreamRequestDurationSeconds.observe(labels, durationSeconds)
}

export const recordSimulatedLoadRun = (intensity: string) => {
  metrics.simulatedLoadRunsTotal.inc({ intensity })
}

export const recordSimulatedLoadBurst = (intensity: string) => {
  metrics.simulatedLoadBurstsTotal.inc({ intensity })
}

export const trackSimulatedLoadInFlight = <T>(run: () => Promise<T>): Promise<T> => {
  metrics.simulatedLoadActive.inc()
  return run().finally(() => metrics.simulatedLoadActive.dec())
}
