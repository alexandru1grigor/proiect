import { configureStore } from '@reduxjs/toolkit'

import { api } from '@/store/api/base'
import loadReducer from '@/store/load-slice'
import uiReducer from '@/store/ui-slice'

export const makeStore = () =>
  configureStore({
    reducer: {
      ui: uiReducer,
      load: loadReducer,
      [api.reducerPath]: api.reducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(api.middleware),
  })

export type AppStore = ReturnType<typeof makeStore>
export type RootState = ReturnType<AppStore['getState']>
export type AppDispatch = AppStore['dispatch']
