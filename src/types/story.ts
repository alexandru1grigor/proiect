/** Raw item shape returned by the engine (`/item/{id}.json`). */
export type EngineItem = {
  id: number
  type?: 'story' | 'comment' | 'job' | 'poll' | 'pollopt'
  by?: string
  time?: number
  title?: string
  url?: string
  text?: string
  score?: number
  descendants?: number
  kids?: number[]
  parent?: number
  deleted?: boolean
  dead?: boolean
}

/** Normalized story, as served to the browser by this app's own routes. */
export type Story = {
  id: number
  title: string
  url?: string
  domain?: string
  by: string
  time: number
  score: number
  commentCount: number
  type: string
  text?: string
  dead?: boolean
  rank?: number
}

export type StoryDetail = Story & {
  kids: number[]
}

export type StoryComment = {
  id: number
  by: string
  time: number
  text: string
  depth: number
  replies: StoryComment[]
  deleted?: boolean
  dead?: boolean
  /** Replies that exist upstream but were not fetched (depth/size budget). */
  hiddenReplies: number
}

export type EngineUser = {
  id: string
  created: number
  karma: number
  about?: string
  submitted?: number[]
}

export type NewsUser = {
  id: string
  created: number
  karma: number
  about?: string
  submittedCount: number
}
