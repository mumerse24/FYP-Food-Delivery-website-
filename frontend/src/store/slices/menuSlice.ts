// store/slices/menuSlice.ts - SIMPLIFIED VERSION:

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import api from "../../services/api"

interface MenuState {
  items: any[]
  isLoading: boolean
  error: string | null
}

const initialState: MenuState = {
  items: [],
  isLoading: false,
  error: null,
}

// Simple fetch function
export const fetchMenuItems = createAsyncThunk(
  "menu/fetchMenuItems",
  async (restaurantId: string) => {
    const response = await api.get(`/menu/restaurant/${restaurantId}`)
    return response.data.data // Direct array
  }
)

const menuSlice = createSlice({
  name: "menu",
  initialState,
  reducers: {
    clearMenu: (state) => {
      state.items = []
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMenuItems.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchMenuItems.fulfilled, (state, action) => {
        state.isLoading = false
        state.items = action.payload
        state.error = null
      })
      .addCase(fetchMenuItems.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || "Failed to load menu"
      })
  }
})

export const { clearMenu } = menuSlice.actions
export default menuSlice.reducer