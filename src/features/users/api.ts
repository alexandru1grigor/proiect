import { api } from '@/store/api/base'
import type { NewsUser } from '@/types/story'

const usersApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getAuthor: builder.query<NewsUser, string>({
      query: (id) => `/user/${encodeURIComponent(id)}`,
      providesTags: (_result, _error, id) => [{ type: 'Author', id }],
    }),
  }),
  overrideExisting: false,
})

export const { useGetAuthorQuery } = usersApi
