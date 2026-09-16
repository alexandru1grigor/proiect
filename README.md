# News `news`

A reader for [Hacker News](https://github.com/HackerNews/API): the six front-page feeds as a
browsable list, and a detail page per story with its metadata, text and comment thread.

> **This is a workshop starting point.** The application is complete and runs as-is, but there is
> deliberately **no `chart/` directory**: packaging this app for OpenShift is the exercise. You will
> create your own copy of this repository, write the Helm chart yourself, ship it through CI, tag a
> release, and deploy it with Argo CD. The CI/CD workflows in `.github/` already expect a chart at
> `chart/values-dev.yaml`, so they will start working the moment you add one.

Built with Next.js (App Router) + TypeScript, Ant Design, and Redux Toolkit (RTK Query owns all
server state). There is **no authentication** — nobody signs in, and nothing is gated. Visitors are
identified only by an anonymous cookie id, which exists so the log stream can attribute actions to a
visit (see [Observability](#observability)).

The browser never talks to Hacker News directly. It calls this app's own same-origin routes under
`/api/news/*`, which read the engine URL from the server's runtime environment, fetch from it, and
fold its very chatty shape (one HTTP request per item) into a single paginated response.

## Prerequisites

- Node.js 20+ and npm.
- Outbound network access to the news engine. Nothing else — there is no backend to run, no database
  and no secrets.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Optionally, copy the example env file:

   ```bash
   cp .env.example .env.local
   ```

   | Variable | Description |
   | --- | --- |
   | `NEWS_API_URL` | Base URL of the news engine. Defaults to `https://hacker-news.firebaseio.com/v0`, so local development works with no env file at all. |

   This is the **only** variable the app reads. There is deliberately nothing else to configure: no
   log level, no cookie secret, no API keys.

3. Run the dev server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) — it redirects to `/stories/top`.

## Scripts

- `npm run dev` — start the Next.js dev server.
- `npm run build` — production build (also runs the TypeScript type-check).
- `npm run start` — run the production build.
- `npm run lint` — ESLint.

## Routes

| Route | What it is |
| --- | --- |
| `/stories/[feed]` | A feed: `top`, `new`, `best`, `ask`, `show` or `job`. Paginated through the URL (`?page=2&limit=20`), so any page is linkable. |
| `/story/[id]` | A story: score, author karma, source, its own text, and the comment thread. |
| `/api/news/feed/[feed]` | A page of a feed as `{ data, meta }`. |
| `/api/news/item/[id]`, `/api/news/item/[id]/comments` | A story and its comment tree. |
| `/api/news/user/[id]` | An author's public profile. |
| `/api/logs` | Browser-side actions, re-emitted into the server log stream. |
| `/api/metrics` | Prometheus metrics. |
| `/api/health` | Liveness/readiness probe. Never touches the engine. |
| `/api/simulate-load`, `/api/simulate-load/start` | Backend of the "Simulate load" button. |

## The single env var

`NEWS_API_URL` has no `NEXT_PUBLIC_` prefix and is never imported from client code. It is read
server-side, at request time, in `src/lib/news/api-url.ts`. That matters in two ways:

- The engine address is never inlined into the browser bundle, so **one built image works in every
  environment** — including being re-pointed on a running Deployment (`oc set env deployment/news
  NEWS_API_URL=...`) without a rebuild.
- The engine can be swapped for a mirror, a cache, or a stub during an incident, without shipping code.

## Observability

There is no account to attribute anything to, so this app logs deliberately generously.

- **Logs**: server-side logging goes through `src/lib/logger.ts` (pino), writing structured JSON to
  stdout — the format container log drivers and log-aggregation platforms (Loki, ELK, Datadog,
  CloudWatch, ...) expect. In development it's pretty-printed instead. Every route handler is wrapped
  by `withObservability` (`src/lib/route-handler.ts`), so each request is logged with its status,
  duration, query and visitor context, and each call to the engine is logged and timed.
- **Who**: `src/proxy.ts` issues two opaque cookies on the first request — a 1-year `visitorId` and a
  30-minute sliding `sessionId`. They carry no personal data and grant no access (which is why they
  need no signing secret); they exist so a log line can say *which visit* did something. The server
  reads them from the cookies itself and never trusts a client-supplied id.
- **What**: `src/lib/client-logger.ts` batches browser-side actions to `POST /api/logs`, which
  re-emits them through the same server logger, stamped with the visitor context and the request's
  IP, user agent, referer and language. Page views and Core Web Vitals
  (`src/components/analytics/RouteAnalytics.tsx`), every data fetch (`src/store/api/base.ts`), feed
  switches, pagination, story opens, outbound clicks to the source article, uncaught errors and
  unhandled rejections all land in the same stream.
- **Metrics**: `GET /api/metrics` exposes Prometheus-format metrics (`src/lib/metrics.ts`, via
  `prom-client`) — default Node.js process metrics plus `news_http_requests_total`,
  `news_http_request_duration_seconds`, `news_client_actions_total`, `news_upstream_requests_total`,
  `news_upstream_request_duration_seconds` and the `news_simulated_load_*` family. Route labels are
  the static route patterns (`/api/news/item/[id]`), never resolved ids, to keep cardinality bounded.
  Point a Prometheus scrape config (or a `ServiceMonitor`, on OpenShift) at this route.

## Simulate load

The right-hand side of the sticky header has a **Simulate load** button (the caret picks light,
moderate, heavy or super heavy — 24 to 1024 requests). One click puts the page under deliberate,
self-inflicted load on all three axes at once, so there is something real to look at on a dashboard:

1. a burst of concurrent requests to `/api/simulate-load`, each burning CPU **on the pod**;
2. CPU burned **on the main thread**, in sliced-and-yielded chunks so the UI gets visibly janky
   without freezing React entirely;
3. thousands of extra **DOM rows** mounted for the duration of the run.

While it runs, the button becomes a progress readout with a live panel (requests, failures, server
CPU consumed, worst frame time, DOM rows, elapsed) and a second click stops it. Every run is logged
at `warn` and counted in `news_simulated_load_runs_total` / `news_simulated_load_bursts_total`.

Intensities live in `src/lib/simulate-load/presets.ts` and are shared by both halves — but the server
clamps whatever it is sent (250ms of CPU per request, maximum), because those numbers arrive in a
request body.

## Notes

- The engine has no batch endpoint and no pagination: a feed is a bare array of up to 500 ids. This
  app paginates it, and fetches only the current page's items — concurrently, but capped, because an
  uncapped fan-out is what gets a client rate-limited.
- Comment threads are fetched breadth-first under a hard budget (120 nodes, 4 levels deep). Whatever
  is cut off is reported per node as `hiddenReplies`, so the UI says so instead of silently
  truncating.
- Comment and story bodies arrive as pre-escaped HTML fragments from the engine and are rendered as
  HTML — there is no other way to display them correctly. Items the engine marks deleted or dead are
  not rendered.
- Responses from the engine are cached by Next's data cache (60s for feeds, 5min for items, 10min for
  users), which is what keeps the load simulator from turning into a Hacker News stress test.
