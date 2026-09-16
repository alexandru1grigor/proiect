/**
 * The Hacker News engine exposes each feed as its own endpoint returning a
 * plain array of item ids (`/topstories.json`, `/newstories.json`, ...). These
 * keys are what appear in the URL (`/stories/top`), so they are part of the
 * app's public surface — the upstream file name stays an implementation detail.
 */
export const FEEDS = [
  { key: 'top', label: 'Top', endpoint: 'topstories', description: 'The current Hacker News front page.' },
  { key: 'new', label: 'Newest', endpoint: 'newstories', description: 'Everything as it is submitted.' },
  { key: 'best', label: 'Best', endpoint: 'beststories', description: 'Highest rated stories right now.' },
  { key: 'ask', label: 'Ask HN', endpoint: 'askstories', description: 'Questions put to the community.' },
  { key: 'show', label: 'Show HN', endpoint: 'showstories', description: 'Things people have built.' },
  { key: 'job', label: 'Jobs', endpoint: 'jobstories', description: 'Who is hiring, straight from the source.' },
] as const

export type FeedKey = (typeof FEEDS)[number]['key']

export const DEFAULT_FEED: FeedKey = 'top'

export const isFeedKey = (value: string): value is FeedKey => FEEDS.some((feed) => feed.key === value)

export const getFeed = (key: FeedKey) => FEEDS.find((feed) => feed.key === key)!
