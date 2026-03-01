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

const getSanitizedInitialItems = (): CartItem[] => {
  try {
    const stored = localStorage.getItem("cart")
    if (!stored) return []
    const parsed = JSON.parse(stored)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(item => item && item.menuItem)
  } catch (e) {
    return []
  }
}

const initialState: CartState = {
  items: getSanitizedInitialItems(),
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
  const validItems = items.filter(item => item && item.menuItem)
  const totalItems = validItems.reduce((sum, item) => sum + item.quantity, 0)
  const totalAmount = validItems.reduce((sum, item) => sum + (item.menuItem?.price || 0) * item.quantity, 0)
  return { totalItems, totalAmount }
}

// ✅ EXISTING THUNKS (tumhara code)
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
    const response = await api.get<ApiResponse<any>>("/cart")
    return response.data.data
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || "Failed to fetch cart")
  }
})

// ✅ FIXED: addToCartServer with restaurantId
export const addToCartServer = createAsyncThunk(
  "cart/addToCartServer",
  async (
    {
      menuItemId,
      quantity,
      restaurantId,
      specialInstructions,
    }: {
      menuItemId: string
      quantity: number
      restaurantId: string
      specialInstructions?: string
    },
    { rejectWithValue },
  ) => {
    try {
      const response = await api.post<ApiResponse<any>>("/cart/add", {
        menuItemId,
        quantity,
        restaurantId,  // ✅ AB BHEJ RAHE HAIN
        specialInstructions,
      })
      return response.data.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to add item to cart")
    }
  },
)

// ✅ NEW: Server-side quantity update thunk (plus/minus ke liye)
export const updateCartItemServer = createAsyncThunk(
  "cart/updateCartItemServer",
  async (
    {
      itemId,
      quantity,
    }: {
      itemId: string
      quantity: number
    },
    { rejectWithValue },
  ) => {
    try {
      const response = await api.put<ApiResponse<any>>(`/cart/update/${itemId}`, {
        quantity,
      })
      return response.data.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to update cart item")
    }
  },
)

// ✅ EXISTING: removeFromCartServer
export const removeFromCartServer = createAsyncThunk(
  "cart/removeFromCartServer",
  async (itemId: string, { rejectWithValue }) => {
    try {
      await api.delete(`/cart/remove/${itemId}`)
      return itemId
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to remove item from cart")
    }
  },
)

// ✅ EXISTING: clearCartServer
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
    // ✅ Local reducers (existing)
    addToCart: (
      state,
      action: PayloadAction<{ menuItem: MenuItem; quantity: number; specialInstructions?: string }>,
    ) => {
      const { menuItem, quantity, specialInstructions } = action.payload

      const restaurantId = typeof menuItem.restaurant === 'object' ? menuItem.restaurant._id : menuItem.restaurant

      if (state.restaurantId && state.restaurantId !== restaurantId) {
        state.items = []
        state.restaurantId = restaurantId
      } else if (!state.restaurantId) {
        state.restaurantId = restaurantId
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
        // ✅ Sanitize server response
        state.items = (action.payload || []).filter((item: any) => item && item.menuItem)
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
        const payload = action.payload as any;
        if (payload && payload.items) {
          state.items = (payload.items || []).filter((item: any) => item && item.menuItem);
          state.restaurantId = typeof payload.restaurant === 'object' ? payload.restaurant._id : payload.restaurant;
        } else if (Array.isArray(payload)) {
          state.items = payload.filter((item: any) => item && item.menuItem);
          if (state.items.length > 0) {
            const firstItemRestaurant = state.items[0].menuItem.restaurant
            state.restaurantId = typeof firstItemRestaurant === 'object' ? firstItemRestaurant._id : firstItemRestaurant
          }
        }

        const totals = calculateTotals(state.items)
        state.totalAmount = totals.totalAmount
        state.totalItems = totals.totalItems
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

      // Add to cart server
      .addCase(addToCartServer.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(addToCartServer.fulfilled, (state, action) => {
        state.isLoading = false
        const updatedCart = action.payload as any;

        if (updatedCart && updatedCart.items) {
          state.items = (updatedCart.items || []).filter((item: any) => item && item.menuItem);
        }

        if (updatedCart.restaurant) {
          state.restaurantId = typeof updatedCart.restaurant === 'object'
            ? updatedCart.restaurant._id
            : updatedCart.restaurant;
        }

        const totals = calculateTotals(state.items);
        state.totalItems = totals.totalItems;
        state.totalAmount = totals.totalAmount;
        localStorage.setItem("cart", JSON.stringify(state.items));
      })
      .addCase(addToCartServer.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })

      // Update cart item server (NEW)
      .addCase(updateCartItemServer.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(updateCartItemServer.fulfilled, (state, action) => {
        state.isLoading = false
        const updatedCart = action.payload as any;

        if (updatedCart && updatedCart.items) {
          state.items = (updatedCart.items || []).filter((item: any) => item && item.menuItem);
        }

        const totals = calculateTotals(state.items);
        state.totalItems = totals.totalItems;
        state.totalAmount = totals.totalAmount;
        localStorage.setItem("cart", JSON.stringify(state.items));
      })
      .addCase(updateCartItemServer.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })

      // Remove from cart server
      .addCase(removeFromCartServer.fulfilled, (state, action) => {
        state.items = state.items.filter((item) => item.menuItem._id !== action.payload)

        if (state.items.length === 0) {
          state.restaurantId = null
        }

        const totals = calculateTotals(state.items)
        state.totalAmount = totals.totalAmount
        state.totalItems = totals.totalItems

        localStorage.setItem("cart", JSON.stringify(state.items))
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