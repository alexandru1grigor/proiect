'use client'

import { Suspense, useMemo, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Avatar, Button, Drawer, Grid, Layout, Menu, Progress, Tooltip, Typography } from 'antd'
import type { MenuProps } from 'antd'
import { CloseOutlined, MenuOutlined, UserOutlined } from '@ant-design/icons'

import { RouteAnalytics } from '@/components/analytics/RouteAnalytics'
import { NAV_ITEMS } from '@/components/app-shell/nav-config'
import { LoadBallast } from '@/components/simulate-load/LoadBallast'
import { SimulateLoadButton } from '@/components/simulate-load/SimulateLoadButton'
import { logClientAction } from '@/lib/client-logger'
import { useVisitor } from '@/lib/visitor/visitor-context'
import { useAppSelector } from '@/store/hooks'

const { Header, Content } = Layout
const { useBreakpoint } = Grid

const menuItems: MenuProps['items'] = NAV_ITEMS.map((item) => ({
  key: item.key,
  icon: item.icon,
  label: item.label,
}))

const hrefByKey = Object.fromEntries(NAV_ITEMS.map((item) => [item.key, item.href]))

const findSelectedKeys = (pathname: string): string[] => {
  const match = NAV_ITEMS.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
  return match ? [match.key] : []
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? ''
  const router = useRouter()
  const screens = useBreakpoint()
  const { visitor } = useVisitor()
  const load = useAppSelector((state) => state.load)
  const [mobileOpen, setMobileOpen] = useState(false)

  const selectedKeys = useMemo(() => findSelectedKeys(pathname), [pathname])

  const loadPercent =
    load.requestsTotal > 0
      ? Math.round(((load.requestsCompleted + load.requestsFailed) / load.requestsTotal) * 100)
      : 0

  const navigate: MenuProps['onClick'] = ({ key }) => {
    const href = hrefByKey[key]
    if (!href) return

    logClientAction('nav.feed-selected', { feed: key, from: pathname })
    router.push(href)
    setMobileOpen(false)
  }

  return (
    <Layout className="app-shell">
      <Layout className="app-main">
        <Header className="app-header">
          {!screens.lg && (
            <Button
              type="text"
              className="header-icon-button"
              icon={<MenuOutlined />}
              aria-label="Open navigation"
              onClick={() => setMobileOpen(true)}
            />
          )}
          <Link className="brand" href="/" onClick={() => logClientAction('nav.brand-clicked')}>
            <span className="brand-mark">
              <span />
            </span>
            <span>News</span>
          </Link>
          <Menu
            className="header-nav"
            mode="horizontal"
            selectedKeys={selectedKeys}
            items={menuItems}
            onClick={navigate}
          />
          <div className="header-actions">
            <SimulateLoadButton />
            <span className="header-divider" />
            <Tooltip
              title={
                visitor
                  ? `Anonymous visitor — every action is logged against this id. Session ${visitor.sessionId.slice(0, 8)}.`
                  : 'Identifying this visit…'
              }
            >
              <div className="visitor-chip">
                <Avatar size={32} icon={<UserOutlined />} />
                <span className="visitor-copy">
                  <Typography.Text strong>Anonymous visitor</Typography.Text>
                  <Typography.Text type="secondary">
                    {visitor ? visitor.visitorId.slice(0, 8) : '…'}
                  </Typography.Text>
                </span>
              </div>
            </Tooltip>
          </div>
        </Header>

        {/* A run is deliberately impossible to miss: the page it is loading
            shows how far along it is, right under the bar that started it. */}
        {load.status === 'running' && (
          <div className="load-progress">
            <Progress percent={loadPercent} showInfo={false} size="small" status="active" />
          </div>
        )}

        <Drawer
          className="mobile-nav-drawer"
          placement="left"
          open={!screens.lg && mobileOpen}
          onClose={() => setMobileOpen(false)}
          closeIcon={<CloseOutlined />}
          title="News"
          styles={{ body: { padding: 12 } }}
        >
          <Menu mode="inline" selectedKeys={selectedKeys} items={menuItems} onClick={navigate} />
        </Drawer>

        <Content className="app-content">
          <div className="content-container">{children}</div>
        </Content>
      </Layout>

      <LoadBallast />
      {/* `useSearchParams` suspends, and it must not take the whole shell with it. */}
      <Suspense fallback={null}>
        <RouteAnalytics />
      </Suspense>
    </Layout>
  )
}
