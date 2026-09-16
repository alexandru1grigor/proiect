/**
 * Shared load profiles for the header's "Simulate load" button.
 *
 * Imported by both the browser and the route handler so the two halves of a
 * simulation cannot drift apart — but the server still clamps whatever it is
 * handed (see `/api/simulate-load`), because these numbers reach it as a
 * request body and nothing stops someone from posting their own.
 */
export const LOAD_PROFILES = {
  light: {
    label: 'Light',
    description: '24 requests · ~0.5s of client work',
    requests: 24,
    concurrency: 6,
    serverWorkMs: 25,
    clientBurnMs: 500,
    domRows: 400,
  },
  moderate: {
    label: 'Moderate',
    description: '96 requests · ~1.5s of client work',
    requests: 96,
    concurrency: 12,
    serverWorkMs: 40,
    clientBurnMs: 1500,
    domRows: 1500,
  },
  heavy: {
    label: 'Heavy',
    description: '320 requests · ~3s of client work',
    requests: 320,
    concurrency: 24,
    serverWorkMs: 60,
    clientBurnMs: 3000,
    domRows: 4000,
  },
  // At this volume the queue is the load: the app's server is single-threaded,
  // so 1024 requests already back up behind each other. Per-request work is
  // dialled back from `heavy` accordingly — otherwise a run takes minutes
  // rather than making a point.
  'super-heavy': {
    label: 'Super Heavy',
    description: '1024 requests · ~3s of client work',
    requests: 1024,
    concurrency: 32,
    serverWorkMs: 30,
    clientBurnMs: 3000,
    domRows: 8000,
  },
} as const

export type LoadIntensity = keyof typeof LOAD_PROFILES

export const DEFAULT_INTENSITY: LoadIntensity = 'moderate'

export const isLoadIntensity = (value: unknown): value is LoadIntensity =>
  typeof value === 'string' && value in LOAD_PROFILES

/** Hard ceiling for a single synthetic request, whatever the caller asks for. */
export const MAX_SERVER_WORK_MS = 250
