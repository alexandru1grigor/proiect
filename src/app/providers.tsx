'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { Provider as ReduxProvider } from 'react-redux'
import { App as AntApp, ConfigProvider, theme as antdTheme } from 'antd'
import { AntdRegistry } from '@ant-design/nextjs-registry'

import { logClientAction } from '@/lib/client-logger'
import { VisitorProvider } from '@/lib/visitor/visitor-context'
import { makeStore } from '@/store'

const THEME = {
  algorithm: antdTheme.defaultAlgorithm,
  token: {
    colorPrimary: '#5d87ff',
    colorInfo: '#539bff',
    colorSuccess: '#13deb9',
    colorWarning: '#ffae1f',
    colorError: '#fa896b',
    colorText: '#2a3547',
    colorTextSecondary: '#5a6a85',
    colorBorder: '#e5eaef',
    colorBgLayout: '#ffffff',
    borderRadius: 8,
    borderRadiusLG: 12,
    fontFamily: "'Plus Jakarta Sans', 'Segoe UI', Helvetica, Arial, sans-serif",
    fontSize: 14,
    controlHeight: 40,
    boxShadowSecondary: '0 12px 24px -4px rgba(145, 158, 171, 0.12)',
  },
  components: {
    Button: { fontWeight: 600, primaryShadow: 'none' },
    Card: { headerFontSize: 16, headerFontSizeSM: 15 },
    Menu: {
      itemBorderRadius: 8,
      itemColor: '#2a3547',
      itemHoverBg: '#f6f9fc',
      itemHoverColor: '#5d87ff',
      itemSelectedBg: '#5d87ff',
      itemSelectedColor: '#ffffff',
      horizontalItemSelectedColor: '#5d87ff',
    },
    Table: { headerBg: '#f6f9fc', headerColor: '#2a3547', rowHoverBg: '#f6f9fc' },
  },
}

export function Providers({ children }: { children: ReactNode }) {
  // Lazy-initialized once per mount via useState's initializer (not a ref
  // read during render) so every browser tab gets its own store instance.
  const [store] = useState(() => makeStore())

  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      logClientAction('client.uncaught-error', { message: event.message, filename: event.filename }, 'error')
    }

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason instanceof Error ? event.reason.message : String(event.reason)
      logClientAction('client.unhandled-rejection', { reason }, 'error')
    }

    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onUnhandledRejection)

    return () => {
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onUnhandledRejection)
    }
  }, [])

  return (
    <VisitorProvider>
      <ReduxProvider store={store}>
        <AntdRegistry>
          <ConfigProvider theme={THEME}>
            <AntApp>{children}</AntApp>
          </ConfigProvider>
        </AntdRegistry>
      </ReduxProvider>
    </VisitorProvider>
  )
}
