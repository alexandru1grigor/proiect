'use client'

import Link from 'next/link'
import { Tag, Typography } from 'antd'
import { CommentOutlined, ClockCircleOutlined, UserOutlined } from '@ant-design/icons'

import { logClientAction } from '@/lib/client-logger'
import { formatCount, formatRelative } from '@/lib/format'
import type { Story } from '@/types/story'

type StoryRowProps = {
  story: Story
  feed: string
}

/**
 * One story in a feed. Both links are logged separately on purpose: opening the
 * discussion and leaving for the source article are different intents, and the
 * ratio between them is the most interesting thing this app can measure.
 */
export function StoryRow({ story, feed }: StoryRowProps) {
  return (
    <article className="story-row">
      <div className="story-rank">{story.rank ?? '—'}</div>
      <div className="story-score">
        <strong>{formatCount(story.score)}</strong>
        <span>points</span>
      </div>
      <div className="story-body">
        <div className="story-title">
          <Link
            href={`/story/${story.id}`}
            onClick={() => logClientAction('story.opened', { storyId: story.id, feed, rank: story.rank })}
          >
            {story.title}
          </Link>
          {story.url && (
            <span className="story-domain">
              (
              <a
                href={story.url}
                target="_blank"
                rel="noreferrer"
                onClick={() =>
                  logClientAction('story.source-opened', {
                    storyId: story.id,
                    feed,
                    domain: story.domain,
                  })
                }
              >
                {story.domain}
              </a>
              )
            </span>
          )}
          {story.type === 'job' && <Tag color="gold">Job</Tag>}
          {story.dead && <Tag color="red">Flagged</Tag>}
        </div>
        <div className="story-meta">
          <span>
            <UserOutlined />
            {story.by}
          </span>
          <span>
            <ClockCircleOutlined />
            {formatRelative(story.time)}
          </span>
          <span>
            <CommentOutlined />
            <Typography.Text type="secondary">{formatCount(story.commentCount)} comments</Typography.Text>
          </span>
        </div>
      </div>
    </article>
  )
}
