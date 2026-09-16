'use client'

import { useEffect, useRef, useState } from 'react'
import { App, Button, Dropdown, Popover, Progress, Space, Typography } from 'antd'
import type { MenuProps } from 'antd'
import { DownOutlined, StopOutlined, ThunderboltOutlined } from '@ant-design/icons'

import { runLoadSimulation } from '@/features/simulate-load/run-simulation'
import { logClientAction } from '@/lib/client-logger'
import { useElapsed } from '@/lib/use-elapsed'
import { DEFAULT_INTENSITY, LOAD_PROFILES, type LoadIntensity } from '@/lib/simulate-load/presets'
import { simulationCleared } from '@/store/load-slice'
import { useAppDispatch, useAppSelector } from '@/store/hooks'

const INTENSITY_KEYS = Object.keys(LOAD_PROFILES) as LoadIntensity[]

/**
 * The header's "Simulate load" control: one click starts a run at the selected
 * intensity, the dropdown picks that intensity, and a second click stops it.
 * While a run is active the button becomes its own progress readout, since it
 * is the thing the visitor is already looking at.
 */
export function SimulateLoadButton() {
  const { message } = App.useApp()
  const dispatch = useAppDispatch()
  const load = useAppSelector((state) => state.load)
  const [intensity, setIntensity] = useState<LoadIntensity>(DEFAULT_INTENSITY)
  const abortRef = useRef<AbortController | null>(null)
  const isRunning = load.status === 'running'

  // A run outlives a route change, so it has to be stopped if the button
  // itself goes away — otherwise the bursts keep firing with nothing driving
  // or reporting them.
  useEffect(() => () => abortRef.current?.abort(), [])

  const start = async () => {
    if (isRunning) {
      abortRef.current?.abort()
      return
    }

    const controller = new AbortController()
    abortRef.current = controller

    const { aborted } = await runLoadSimulation({ intensity, dispatch, signal: controller.signal })

    if (!aborted) {
      message.success(`${LOAD_PROFILES[intensity].label} load simulation finished`)
    }
  }

  const intensityItems: MenuProps['items'] = INTENSITY_KEYS.map((key) => ({
    key,
    label: `${LOAD_PROFILES[key].label} — ${LOAD_PROFILES[key].description}`,
  }))

  const completed = load.requestsCompleted + load.requestsFailed
  const percent = load.requestsTotal > 0 ? Math.round((completed / load.requestsTotal) * 100) : 0
  const elapsedMs = useElapsed({
    startedAt: load.startedAt,
    finishedAt: load.finishedAt,
    active: isRunning,
  })

  const panel = (
    <div className="load-panel">
      <div className="load-panel-header">
        {isRunning ? 'Simulating load' : 'Last simulation'} · {LOAD_PROFILES[load.intensity ?? intensity].label}
      </div>
      <Progress percent={percent} size="small" status={isRunning ? 'active' : 'normal'} />
      <div className="load-panel-stats">
        <div className="load-panel-stat">
          <span>Requests</span>
          <strong>
            {completed} / {load.requestsTotal}
          </strong>
        </div>
        <div className="load-panel-stat">
          <span>Failed</span>
          <strong>{load.requestsFailed}</strong>
        </div>
        <div className="load-panel-stat">
          <span>Server CPU</span>
          <strong>{(load.serverMsTotal / 1000).toFixed(1)}s</strong>
        </div>
        <div className="load-panel-stat">
          <span>Worst frame</span>
          <strong>{load.longestFrameMs}ms</strong>
        </div>
        <div className="load-panel-stat">
          <span>DOM rows</span>
          <strong>{load.domRows.toLocaleString()}</strong>
        </div>
        <div className="load-panel-stat">
          <span>Elapsed</span>
          <strong>{(elapsedMs / 1000).toFixed(1)}s</strong>
        </div>
      </div>
      <Typography.Text className="load-panel-note">
        Every run is logged and counted — watch it on <code>/api/metrics</code> or in the pod logs.
      </Typography.Text>
    </div>
  )

  return (
    <Popover content={panel} placement="bottomRight" trigger={isRunning ? [] : ['hover']} open={isRunning || undefined}>
      <Space.Compact>
        <Button
          className="simulate-button"
          type={isRunning ? 'default' : 'primary'}
          danger={isRunning}
          icon={isRunning ? <StopOutlined /> : <ThunderboltOutlined />}
          onClick={() => void start()}
        >
          {isRunning ? `Stop · ${percent}%` : 'Simulate load'}
        </Button>
        <Dropdown
          trigger={['click']}
          placement="bottomRight"
          menu={{
            items: intensityItems,
            selectable: true,
            selectedKeys: [intensity],
            onClick: ({ key }) => {
              const next = key as LoadIntensity
              setIntensity(next)
              dispatch(simulationCleared())
              logClientAction('load.intensity-changed', { intensity: next })
            },
          }}
        >
          <Button
            className="simulate-button"
            type={isRunning ? 'default' : 'primary'}
            danger={isRunning}
            disabled={isRunning}
            icon={<DownOutlined />}
            aria-label="Choose load intensity"
          />
        </Dropdown>
      </Space.Compact>
    </Popover>
  )
}
