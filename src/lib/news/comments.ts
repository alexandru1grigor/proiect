import { fetchItems } from '@/lib/news/engine'
import type { EngineItem, StoryComment } from '@/types/story'

/**
 * A popular story's comment tree can run to thousands of nodes, and the engine
 * only serves one node per request — so it is walked breadth-first under a hard
 * budget rather than fetched whole. Whatever is cut off is reported per node as
 * `hiddenReplies` so the UI can say so honestly instead of silently truncating.
 */
const MAX_DEPTH = 4
const MAX_NODES = 120
const MAX_REPLIES_PER_NODE = 8

type PendingNode = {
  comment: StoryComment
  kids: number[]
}

const toComment = (item: EngineItem, depth: number): StoryComment => ({
  id: item.id,
  by: item.by ?? 'unknown',
  time: item.time ?? 0,
  text: item.text ?? '',
  depth,
  replies: [],
  deleted: item.deleted,
  dead: item.dead,
  hiddenReplies: 0,
})

export const fetchCommentTree = async (rootKids: number[]): Promise<StoryComment[]> => {
  const roots: StoryComment[] = []
  let budget = MAX_NODES

  const takeIds = (ids: number[]) => {
    const allowed = ids.slice(0, Math.min(MAX_REPLIES_PER_NODE, Math.max(budget, 0)))
    budget -= allowed.length
    return { allowed, hidden: ids.length - allowed.length }
  }

  const { allowed: firstIds, hidden: hiddenRoots } = takeIds(rootKids)
  let level = firstIds.map((id) => ({ id, parent: null as StoryComment | null }))
  let depth = 0

  while (level.length > 0 && depth < MAX_DEPTH) {
    const items = await fetchItems(level.map((entry) => entry.id))
    const pending: PendingNode[] = []

    items.forEach((item, index) => {
      if (!item) return

      const comment = toComment(item, depth)
      const parent = level[index].parent

      if (parent) {
        parent.replies.push(comment)
      } else {
        roots.push(comment)
      }

      if (item.kids?.length) {
        pending.push({ comment, kids: item.kids })
      }
    })

    if (depth + 1 >= MAX_DEPTH) {
      pending.forEach((node) => {
        node.comment.hiddenReplies = node.kids.length
      })
      break
    }

    const next: { id: number; parent: StoryComment | null }[] = []

    for (const node of pending) {
      const { allowed, hidden } = takeIds(node.kids)
      node.comment.hiddenReplies = hidden
      allowed.forEach((id) => next.push({ id, parent: node.comment }))
    }

    level = next
    depth += 1
  }

  if (hiddenRoots > 0 && roots.length > 0) {
    // Surfaced on the last root so the detail page can render a single
    // "N more top-level comments on Hacker News" line.
    roots[roots.length - 1].hiddenReplies += hiddenRoots
  }

  return roots
}
