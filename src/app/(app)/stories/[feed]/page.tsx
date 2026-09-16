'use client'

import { use, useEffect } from 'react'
import { notFound } from 'next/navigation'
import { Tag, Typography } from 'antd'

import { StoryList } from '@/components/story-list/StoryList'
import { useGetFeedQuery } from '@/features/stories/api'
import { logClientAction } from '@/lib/client-logger'
import { useQueryParams } from '@/lib/use-query-params'
import { getFeed, isFeedKey, type FeedKey } from '@/types/feed'

export default function FeedPage({ params }: { params: Promise<{ feed: string }> }) {
  const { feed } = use(params)

  if (!isFeedKey(feed)) {
    notFound()
  }

  return <FeedView feed={feed} />
}

function FeedView({ feed }: { feed: FeedKey }) {
  const { setParams, page, limit } = useQueryParams()
  const { data, isLoading, isFetching, error } = useGetFeedQuery({ feed, page, limit })
  const config = getFeed(feed)

  useEffect(() => {
    logClientAction('feed.viewed', { feed, page, limit })
  }, [feed, page, limit])

  return (
    <div>
      <div className="page-heading">
        <div>
          <Typography.Title level={3}>{config.label}</Typography.Title>
          <Typography.Paragraph>{config.description}</Typography.Paragraph>
        </div>
        <Tag color="blue">Live from the engine</Tag>
      </div>

      <StoryList
        stories={data?.data}
        meta={data?.meta}
        feed={feed}
        isLoading={isLoading}
        isFetching={isFetching}
        error={error}
        page={page}
        limit={limit}
        onPageChange={(nextPage, nextLimit) => {
          logClientAction('feed.paged', { feed, from: page, to: nextPage, limit: nextLimit })
          setParams({ page: nextPage, limit: nextLimit })
        }}
      />
    </div>
  )
}
