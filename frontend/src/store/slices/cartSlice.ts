import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"
import api from "../../services/api"
import type { CartItem, MenuItem, ApiResponse } from "../../types"

interface CartState {
  items: CartItem[]
  totalAmount: number
  totalItems: number
  restaurantId: string | null
  isLoading: boolean
  error: string | null
  deliveryAddress: string
  specialInstructions: string
}

const initialState: CartState = {
  items: JSON.parse(localStorage.getItem("cart") || "[]"),
  totalAmount: 0,
  totalItems: 0,
  restaurantId: null,
  isLoading: false,
  error: null,
  deliveryAddress: "",
  specialInstructions: "",
}

// Calculate totals helper
const calculateTotals = (items: CartItem[]) => {
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalAmount = items.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0)
  return { totalItems, totalAmount }
}

// Async thunks
export const syncCartWithServer = createAsyncThunk(
  "cart/syncCartWithServer",
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { cart: CartState }
      const response = await api.post<ApiResponse<CartItem[]>>("/cart/sync", {
        items: state.cart.items,
      })
      return response.data.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to sync cart")
    }
  },
)

export const fetchCart = createAsyncThunk("cart/fetchCart", async (_, { rejectWithValue }) => {
  try {
    const response = await api.get<ApiResponse<CartItem[]>>("/cart")
    return response.data.data
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || "Failed to fetch cart")
  }
})

export const addToCartServer = createAsyncThunk(
  "cart/addToCartServer",
  async (
    {
      menuItemId,
      quantity,
      specialInstructions,
    }: {
      menuItemId: string
      quantity: number
      specialInstructions?: string
    },
    { rejectWithValue },
  ) => {
    try {
      const response = await api.post<ApiResponse<CartItem>>("/cart/add", {
        menuItemId,
        quantity,
        specialInstructions,
      })
      return response.data.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to add item to cart")
    }
  },
)

export const removeFromCartServer = createAsyncThunk(
  "cart/removeFromCartServer",
  async (menuItemId: string, { rejectWithValue }) => {
    try {
      await api.delete(`/cart/remove/${menuItemId}`)
      return menuItemId
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to remove item from cart")
    }
  },
)

export const clearCartServer = createAsyncThunk("cart/clearCartServer", async (_, { rejectWithValue }) => {
  try {
    await api.delete("/cart/clear")
    return true
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || "Failed to clear cart")
  }
})

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart: (
      state,
      action: PayloadAction<{ menuItem: MenuItem; quantity: number; specialInstructions?: string }>,
    ) => {
      const { menuItem, quantity, specialInstructions } = action.payload

      // Check if adding from different restaurant
      if (state.restaurantId && state.restaurantId !== menuItem.restaurant) {
        state.items = []
        state.restaurantId = menuItem.restaurant
      } else if (!state.restaurantId) {
        state.restaurantId = menuItem.restaurant
      }

      const existingItem = state.items.find((item) => item.menuItem._id === menuItem._id)

      if (existingItem) {
        existingItem.quantity += quantity
        if (specialInstructions) {
          existingItem.specialInstructions = specialInstructions
        }
      } else {
        state.items.push({
          menuItem,
          quantity,
          specialInstructions,
        })
      }

      const totals = calculateTotals(state.items)
      state.totalAmount = totals.totalAmount
      state.totalItems = totals.totalItems

      localStorage.setItem("cart", JSON.stringify(state.items))
    },

    removeFromCart: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.menuItem._id !== action.payload)

      if (state.items.length === 0) {
        state.restaurantId = null
      }

      const totals = calculateTotals(state.items)
      state.totalAmount = totals.totalAmount
      state.totalItems = totals.totalItems

      localStorage.setItem("cart", JSON.stringify(state.items))
    },

    updateQuantity: (state, action: PayloadAction<{ menuItemId: string; quantity: number }>) => {
      const { menuItemId, quantity } = action.payload
      const item = state.items.find((item) => item.menuItem._id === menuItemId)

      if (item) {
        if (quantity <= 0) {
          state.items = state.items.filter((item) => item.menuItem._id !== menuItemId)
        } else {
          item.quantity = quantity
        }
      }

      if (state.items.length === 0) {
        state.restaurantId = null
      }

      const totals = calculateTotals(state.items)
      state.totalAmount = totals.totalAmount
      state.totalItems = totals.totalItems

      localStorage.setItem("cart", JSON.stringify(state.items))
    },

    clearCart: (state) => {
      state.items = []
      state.totalAmount = 0
      state.totalItems = 0
      state.restaurantId = null
      localStorage.removeItem("cart")
    },

    setDeliveryAddress: (state, action: PayloadAction<string>) => {
      state.deliveryAddress = action.payload
    },

    setSpecialInstructions: (state, action: PayloadAction<string>) => {
      state.specialInstructions = action.payload
    },

    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Sync cart with server
      .addCase(syncCartWithServer.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(syncCartWithServer.fulfilled, (state, action) => {
        state.isLoading = false
        state.items = action.payload
        const totals = calculateTotals(state.items)
        state.totalAmount = totals.totalAmount
        state.totalItems = totals.totalItems
        localStorage.setItem("cart", JSON.stringify(state.items))
      })
      .addCase(syncCartWithServer.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      // Fetch cart
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.items = action.payload
        const totals = calculateTotals(state.items)
        state.totalAmount = totals.totalAmount
        state.totalItems = totals.totalItems
        if (state.items.length > 0) {
          state.restaurantId = state.items[0].menuItem.restaurant
        }
        localStorage.setItem("cart", JSON.stringify(state.items))
      })
      // Clear cart server
      .addCase(clearCartServer.fulfilled, (state) => {
        state.items = []
        state.totalAmount = 0
        state.totalItems = 0
        state.restaurantId = null
        localStorage.removeItem("cart")
      })
  },
})

export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  setDeliveryAddress,
  setSpecialInstructions,
  clearError,
} = cartSlice.actions

export default cartSlice.reducer
