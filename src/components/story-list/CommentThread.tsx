'use client'

import { Typography } from 'antd'

import { formatRelative } from '@/lib/format'
import type { StoryComment } from '@/types/story'

/**
 * The engine serves comment bodies as pre-escaped HTML fragments (`<p>`, `<a>`,
 * `<i>`, `<code>` and entities), so they are rendered as HTML — there is no
 * other way to show them correctly. The content is third-party, so it is
 * rendered only for comments the engine did not mark deleted or dead, and the
 * response is confined to the fixed shape built by `lib/news/comments.ts`.
 */
function CommentNode({ comment }: { comment: StoryComment }) {
  if (comment.deleted) return null

  return (
    <div className="comment">
      <div className="comment-header">
        <strong>{comment.by}</strong>
        <span>{formatRelative(comment.time)}</span>
        {comment.dead && <span>· flagged</span>}
      </div>
      {comment.dead ? (
        <Typography.Text type="secondary">[flagged]</Typography.Text>
      ) : (
        <div className="story-text" dangerouslySetInnerHTML={{ __html: comment.text }} />
      )}
      {comment.replies.length > 0 && (
        <div className="comment-replies">
          {comment.replies.map((reply) => (
            <CommentNode key={reply.id} comment={reply} />
          ))}
        </div>
      )}
      {comment.hiddenReplies > 0 && (
        <div className="comment-hidden">
          {comment.hiddenReplies} more {comment.hiddenReplies === 1 ? 'reply' : 'replies'} not shown
        </div>
      )}
    </div>
  )
}

export function CommentThread({ comments }: { comments: StoryComment[] }) {
  return (
    <div className="comment-thread">
      {comments.map((comment) => (
        <CommentNode key={comment.id} comment={comment} />
      ))}
    </div>
  )
}
