import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

import type { LoadIntensity } from '@/lib/simulate-load/presets'

export type LoadStatus = 'idle' | 'running' | 'done' | 'aborted'

export type LoadState = {
  status: LoadStatus
  runId: string | null
  intensity: LoadIntensity | null
  startedAt: number | null
  finishedAt: number | null
  requestsTotal: number
  requestsCompleted: number
  requestsFailed: number
  serverMsTotal: number
  /** Synthetic rows currently mounted — the DOM half of the simulated load. */
  domRows: number
  /** Worst frame gap observed while the simulation ran, i.e. how janky it got. */
  longestFrameMs: number
}

const initialState: LoadState = {
  status: 'idle',
  runId: null,
  intensity: null,
  startedAt: null,
  finishedAt: null,
  requestsTotal: 0,
  requestsCompleted: 0,
  requestsFailed: 0,
  serverMsTotal: 0,
  domRows: 0,
  longestFrameMs: 0,
}

/**
 * Live state of a "Simulate load" run. It lives in the store rather than in the
 * button because two separate parts of the shell read it: the header button
 * (progress + abort) and the overlay that mounts the synthetic DOM rows.
 */
const loadSlice = createSlice({
  name: 'load',
  initialState,
  reducers: {
    simulationStarted(
      state,
      action: PayloadAction<{ runId: string; intensity: LoadIntensity; requestsTotal: number; domRows: number }>
    ) {
      state.status = 'running'
      state.runId = action.payload.runId
      state.intensity = action.payload.intensity
      state.requestsTotal = action.payload.requestsTotal
      state.domRows = action.payload.domRows
      state.startedAt = Date.now()
      state.finishedAt = null
      state.requestsCompleted = 0
      state.requestsFailed = 0
      state.serverMsTotal = 0
      state.longestFrameMs = 0
    },
    burstCompleted(state, action: PayloadAction<{ serverMs: number }>) {
      state.requestsCompleted += 1
      state.serverMsTotal += action.payload.serverMs
    },
    burstFailed(state) {
      state.requestsFailed += 1
    },
    frameObserved(state, action: PayloadAction<number>) {
      state.longestFrameMs = Math.max(state.longestFrameMs, action.payload)
    },
    simulationFinished(state, action: PayloadAction<{ aborted: boolean }>) {
      state.status = action.payload.aborted ? 'aborted' : 'done'
      state.finishedAt = Date.now()
      state.domRows = 0
    },
    simulationCleared() {
      return initialState
    },
  },
})

export const {
  simulationStarted,
  burstCompleted,
  burstFailed,
  frameObserved,
  simulationFinished,
  simulationCleared,
} = loadSlice.actions

export default loadSlice.reducer
