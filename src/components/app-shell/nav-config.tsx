import type { ReactNode } from 'react'
import {
  BulbOutlined,
  ClockCircleOutlined,
  ExperimentOutlined,
  FireOutlined,
  IdcardOutlined,
  TrophyOutlined,
} from '@ant-design/icons'

import { FEEDS, type FeedKey } from '@/types/feed'

export type NavItem = {
  key: string
  label: string
  href: string
  icon: ReactNode
}

const FEED_ICONS: Record<FeedKey, ReactNode> = {
  top: <FireOutlined />,
  new: <ClockCircleOutlined />,
  best: <TrophyOutlined />,
  ask: <BulbOutlined />,
  show: <ExperimentOutlined />,
  job: <IdcardOutlined />,
}

/** Navigation is exactly the set of feeds the engine publishes — see `types/feed.ts`. */
export const NAV_ITEMS: NavItem[] = FEEDS.map((feed) => ({
  key: feed.key,
  label: feed.label,
  href: `/stories/${feed.key}`,
  icon: FEED_ICONS[feed.key],
}))
