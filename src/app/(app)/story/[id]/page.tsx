'use client'

import { use, useEffect } from 'react'
import Link from 'next/link'
import { Alert, Button, Card, Col, Descriptions, Empty, Row, Skeleton, Statistic, Tag, Typography } from 'antd'
import { ArrowLeftOutlined, ExportOutlined } from '@ant-design/icons'

import { CommentThread } from '@/components/story-list/CommentThread'
import { useGetStoryCommentsQuery, useGetStoryQuery } from '@/features/stories/api'
import { useGetAuthorQuery } from '@/features/users/api'
import { getApiErrorMessage } from '@/lib/api-error'
import { logClientAction } from '@/lib/client-logger'
import { formatAbsolute, formatCount, formatRelative } from '@/lib/format'

export default function StoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const storyId = Number(id)

  const { data: story, isLoading, error } = useGetStoryQuery(storyId)
  const { data: comments, isLoading: isLoadingComments } = useGetStoryCommentsQuery(storyId, {
    // The story itself is the point; its comment tree is dozens of upstream
    // requests, so it waits until there is a story to hang them off.
    skip: !story,
  })
  const { data: author } = useGetAuthorQuery(story?.by ?? '', { skip: !story?.by })

  useEffect(() => {
    if (story) {
      logClientAction('story.viewed', {
        storyId: story.id,
        score: story.score,
        commentCount: story.commentCount,
        domain: story.domain,
        author: story.by,
      })
    }
  }, [story])

  if (error) {
    return (
      <Alert
        type="error"
        showIcon
        message="Could not load this story"
        description={getApiErrorMessage(error, 'The news engine did not respond.')}
        action={
          <Link href="/">
            <Button size="small">Back to the feed</Button>
          </Link>
        }
      />
    )
  }

  if (isLoading || !story) {
    return <Skeleton active paragraph={{ rows: 8 }} />
  }

  return (
    <div>
      <div className="page-heading">
        <div>
          <Link href="/" onClick={() => logClientAction('story.back-to-feed', { storyId: story.id })}>
            <Button type="text" size="small" icon={<ArrowLeftOutlined />}>
              Back to the feed
            </Button>
          </Link>
          <Typography.Title level={3} style={{ marginTop: 8 }}>
            {story.title}
          </Typography.Title>
          <div className="story-detail-meta">
            <span>
              by <strong>{story.by}</strong>
              {author ? ` · ${formatCount(author.karma)} karma` : ''}
            </span>
            <span>{formatAbsolute(story.time)}</span>
            <span>{formatRelative(story.time)}</span>
            {story.type === 'job' && <Tag color="gold">Job</Tag>}
          </div>
        </div>
        {story.url && (
          <Button
            type="primary"
            icon={<ExportOutlined />}
            href={story.url}
            target="_blank"
            rel="noreferrer"
            onClick={() =>
              logClientAction('story.source-opened', {
                storyId: story.id,
                domain: story.domain,
                from: 'detail',
              })
            }
          >
            Read on {story.domain}
          </Button>
        )}
      </div>

      <Row gutter={[20, 20]} style={{ marginBottom: 28 }}>
        <Col xs={12} md={6}>
          <Card size="small" className="metric-card">
            <Statistic title="Points" value={story.score} />
            <div className="metric-meta">
              <span>Community score</span>
            </div>
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small" className="metric-card">
            <Statistic title="Comments" value={story.commentCount} />
            <div className="metric-meta">
              <span>{story.kids.length} top-level</span>
            </div>
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small" className="metric-card">
            <Statistic title="Author karma" value={author?.karma ?? 0} />
            <div className="metric-meta">
              <span>{author ? `${formatCount(author.submittedCount)} submissions` : 'Loading…'}</span>
            </div>
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small" className="metric-card">
            <Statistic title="Source" value={story.domain ?? 'self post'} />
            <div className="metric-meta">
              <span>Item #{story.id}</span>
            </div>
          </Card>
        </Col>
      </Row>

      {story.text && (
        <Card style={{ marginBottom: 28 }}>
          <div className="story-text" dangerouslySetInnerHTML={{ __html: story.text }} />
        </Card>
      )}

      {author?.about && (
        <Card title={`About ${story.by}`} style={{ marginBottom: 28 }}>
          <Descriptions column={1} size="small">
            <Descriptions.Item label="Joined">{formatAbsolute(author.created)}</Descriptions.Item>
          </Descriptions>
          <div className="story-text" dangerouslySetInnerHTML={{ __html: author.about }} />
        </Card>
      )}

      <Card title={`Discussion (${formatCount(story.commentCount)})`}>
        {isLoadingComments ? (
          <Skeleton active paragraph={{ rows: 6 }} />
        ) : (comments?.length ?? 0) === 0 ? (
          <Empty description="No comments yet" />
        ) : (
          <CommentThread comments={comments ?? []} />
        )}
      </Card>
    </div>
  )
}
