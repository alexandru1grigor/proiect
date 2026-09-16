import { api } from '@/store/api/base'
import type { FeedKey } from '@/types/feed'
import type { Paginated, PaginationQuery } from '@/types/pagination'
import type { Story, StoryComment, StoryDetail } from '@/types/story'

const storiesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getFeed: builder.query<Paginated<Story>, { feed: FeedKey } & PaginationQuery>({
      query: ({ feed, ...params }) => ({ url: `/feed/${feed}`, params }),
      providesTags: (result, _error, { feed }) =>
        result
          ? [
              ...result.data.map((story) => ({ type: 'Story' as const, id: story.id })),
              { type: 'Feed' as const, id: feed },
            ]
          : [{ type: 'Feed' as const, id: feed }],
    }),
    getStory: builder.query<StoryDetail, number>({
      query: (id) => `/item/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Story', id }],
    }),
    getStoryComments: builder.query<StoryComment[], number>({
      query: (id) => `/item/${id}/comments`,
      providesTags: (_result, _error, id) => [{ type: 'Comments', id }],
    }),
  }),
  overrideExisting: false,
})

export const { useGetFeedQuery, useGetStoryQuery, useGetStoryCommentsQuery } = storiesApi
