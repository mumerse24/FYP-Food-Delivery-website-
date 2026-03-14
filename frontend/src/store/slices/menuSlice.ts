// store/slices/menuSlice.ts
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

// Fetch all menu items — calls GET /api/menu (no restaurantId required)
export const fetchAllMenuItems = createAsyncThunk(
  "menu/fetchAllMenuItems",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/menu")
      return response.data.data // array of menu items
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to load menu")
    }
  }
)

// Fetch menu items for a specific restaurant — calls GET /api/menu/restaurant/:restaurantId
export const fetchMenuItems = createAsyncThunk(
  "menu/fetchMenuItems",
  async (restaurantId: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/menu/restaurant/${restaurantId}`)
      return response.data.data // array of menu items
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to load menu")
    }
  }
)

export const deleteMenuItem = createAsyncThunk(
  "menu/deleteMenuItem",
  async (itemId: string, { rejectWithValue }) => {
    try {
      await api.delete(`/menu/${itemId}`)
      return itemId
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to delete item")
    }
  }
)

const menuSlice = createSlice({
  name: "menu",
  initialState,
  reducers: {
    clearMenu: (state) => {
      state.items = []
    },
    // Real-time update reducers
    addMenuItem: (state, action) => {
      // Prevent duplicates if it somehow exists
      const exists = state.items.some(item => item._id === action.payload._id)
      if (!exists) {
        state.items.push(action.payload)
      }
    },
    updateMenuItem: (state, action) => {
      const index = state.items.findIndex(item => item._id === action.payload._id)
      if (index !== -1) {
        state.items[index] = action.payload
      }
    },
    removeMenuItem: (state, action) => {
      state.items = state.items.filter(item => item._id !== action.payload)
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchAllMenuItems
      .addCase(fetchAllMenuItems.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchAllMenuItems.fulfilled, (state, action) => {
        state.isLoading = false
        state.items = action.payload
        state.error = null
      })
      .addCase(fetchAllMenuItems.rejected, (state, action) => {
        state.isLoading = false
        state.error = (action.payload as string) || "Failed to load menu"
      })
      // fetchMenuItems (restaurant-specific)
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
        state.error = (action.payload as string) || "Failed to load menu"
      })
      // deleteMenuItem
      .addCase(deleteMenuItem.fulfilled, (state, action) => {
        state.items = state.items.filter(
          (item) => item._id !== action.payload && item.id !== action.payload
        )
      })
  },
})

export const { clearMenu, addMenuItem, updateMenuItem, removeMenuItem } = menuSlice.actions
export default menuSlice.reducer