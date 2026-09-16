'use client'

import { Alert, Card, Empty, Pagination, Skeleton, Typography } from 'antd'

import { StoryRow } from '@/components/story-list/StoryRow'
import { getApiErrorMessage } from '@/lib/api-error'
import type { PaginationMeta } from '@/types/pagination'
import type { Story } from '@/types/story'

type StoryListProps = {
  stories: Story[] | undefined
  meta: PaginationMeta | undefined
  feed: string
  isLoading?: boolean
  isFetching?: boolean
  error?: unknown
  page: number
  limit: number
  onPageChange: (page: number, limit: number) => void
}

/**
 * Generic feed renderer bound to a paginated result from `/api/news/feed/*`.
 * Pagination is server-side and controlled by the caller (mirrored in the URL
 * search params) so a page of the feed can be linked to and shared.
 */
export function StoryList({
  stories,
  meta,
  feed,
  isLoading,
  isFetching,
  error,
  page,
  limit,
  onPageChange,
}: StoryListProps) {
  if (error) {
    return (
      <Alert
        type="error"
        showIcon
        message="Could not load this feed"
        description={getApiErrorMessage(error, 'The news engine did not respond.')}
      />
    )
  }

  return (
    <Card className="story-card" loading={isLoading}>
      {!isLoading && (stories?.length ?? 0) === 0 ? (
        <div style={{ padding: 40 }}>
          <Empty description="No stories in this feed right now" />
        </div>
      ) : (
        <>
          {isFetching && !isLoading ? (
            <div style={{ padding: 26 }}>
              <Skeleton active paragraph={{ rows: 6 }} />
            </div>
          ) : (
            stories?.map((story) => <StoryRow key={story.id} story={story} feed={feed} />)
          )}
          <div className="story-list-footer">
            <Typography.Text>
              {meta ? `${meta.total.toLocaleString()} stories in this feed` : ' '}
            </Typography.Text>
            <Pagination
              current={page}
              pageSize={limit}
              total={meta?.total ?? 0}
              showSizeChanger
              pageSizeOptions={[10, 20, 30, 50]}
              showQuickJumper
              onChange={onPageChange}
            />
          </div>
        </>
      )}
    </Card>
  )
}
