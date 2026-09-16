import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

type UiState = {
  mobileNavOpen: boolean
}

const initialState: UiState = {
  mobileNavOpen: false,
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setMobileNavOpen(state, action: PayloadAction<boolean>) {
      state.mobileNavOpen = action.payload
    },
  },
})

export const { setMobileNavOpen } = uiSlice.actions
export default uiSlice.reducer
