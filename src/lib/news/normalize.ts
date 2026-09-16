import type { EngineItem, EngineUser, NewsUser, Story, StoryDetail } from '@/types/story'

const getDomain = (url?: string) => {
  if (!url) return undefined

  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return undefined
  }
}

/**
 * The engine leaves nearly every field optional (and returns `null` for
 * deleted items), so normalizing once here keeps every component downstream
 * free of `?? 0` / `?? 'unknown'` noise.
 */
export const toStory = (item: EngineItem, rank?: number): Story => ({
  id: item.id,
  title: item.title ?? '(untitled)',
  url: item.url,
  domain: getDomain(item.url),
  by: item.by ?? 'unknown',
  time: item.time ?? 0,
  score: item.score ?? 0,
  commentCount: item.descendants ?? 0,
  type: item.type ?? 'story',
  text: item.text,
  dead: item.dead,
  rank,
})

export const toStoryDetail = (item: EngineItem): StoryDetail => ({
  ...toStory(item),
  kids: item.kids ?? [],
})

export const toNewsUser = (user: EngineUser): NewsUser => ({
  id: user.id,
  created: user.created,
  karma: user.karma,
  about: user.about,
  submittedCount: user.submitted?.length ?? 0,
})

export const isVisibleItem = (item: EngineItem | null): item is EngineItem =>
  Boolean(item && !item.deleted)
