import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import api from "../../services/api"
import type { Restaurant, Order, User, ApiResponse } from "../../types"

interface AdminStats {
  totalRestaurants: number
  totalOrders: number
  totalUsers: number
  totalRevenue: number
  pendingRestaurants: number
  activeOrders: number
  monthlyRevenue: number
  monthlyOrders: number
}

interface AdminState {
  stats: AdminStats | null
  pendingRestaurants: Restaurant[]
  recentOrders: Order[]
  users: User[]
  isLoading: boolean
  error: string | null
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

const initialState: AdminState = {
  stats: null,
  pendingRestaurants: [],
  recentOrders: [],
  users: [],
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
}

// Async thunks
export const fetchAdminStats = createAsyncThunk("admin/fetchAdminStats", async (_, { rejectWithValue }) => {
  try {
    const response = await api.get<ApiResponse<AdminStats>>("/admin/stats")
    return response.data.data
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || "Failed to fetch admin stats")
  }
})

export const fetchPendingRestaurants = createAsyncThunk(
  "admin/fetchPendingRestaurants",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<ApiResponse<Restaurant[]>>("/admin/restaurants/pending")
      return response.data.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch pending restaurants")
    }
  },
)

export const approveRestaurant = createAsyncThunk(
  "admin/approveRestaurant",
  async (restaurantId: string, { rejectWithValue }) => {
    try {
      const response = await api.put<ApiResponse<Restaurant>>(`/admin/restaurants/${restaurantId}/approve`)
      return response.data.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to approve restaurant")
    }
  },
)

export const rejectRestaurant = createAsyncThunk(
  "admin/rejectRestaurant",
  async ({ restaurantId, reason }: { restaurantId: string; reason: string }, { rejectWithValue }) => {
    try {
      const response = await api.put<ApiResponse<Restaurant>>(`/admin/restaurants/${restaurantId}/reject`, {
        reason,
      })
      return response.data.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to reject restaurant")
    }
  },
)

export const suspendRestaurant = createAsyncThunk(
  "admin/suspendRestaurant",
  async ({ restaurantId, reason }: { restaurantId: string; reason: string }, { rejectWithValue }) => {
    try {
      const response = await api.put<ApiResponse<Restaurant>>(`/admin/restaurants/${restaurantId}/suspend`, {
        reason,
      })
      return response.data.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to suspend restaurant")
    }
  },
)

export const fetchRecentOrders = createAsyncThunk("admin/fetchRecentOrders", async (_, { rejectWithValue }) => {
  try {
    const response = await api.get<ApiResponse<Order[]>>("/admin/orders/recent")
    return response.data.data
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || "Failed to fetch recent orders")
  }
})

export const fetchAllOrders = createAsyncThunk(
  "admin/fetchAllOrders",
  async (
    params: {
      page?: number
      limit?: number
      status?: string
      restaurant?: string
      dateFrom?: string
      dateTo?: string
    } = {},
    { rejectWithValue },
  ) => {
    try {
      const response = await api.get<
        ApiResponse<{
          orders: Order[]
          pagination: { page: number; limit: number; total: number; totalPages: number }
        }>
      >("/admin/orders", { params })
      return response.data.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch orders")
    }
  },
)

export const fetchUsers = createAsyncThunk(
  "admin/fetchUsers",
  async (
    params: {
      page?: number
      limit?: number
      role?: string
      search?: string
    } = {},
    { rejectWithValue },
  ) => {
    try {
      const response = await api.get<
        ApiResponse<{
          users: User[]
          pagination: { page: number; limit: number; total: number; totalPages: number }
        }>
      >("/admin/users", { params })
      return response.data.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch users")
    }
  },
)

export const updateUserStatus = createAsyncThunk(
  "admin/updateUserStatus",
  async ({ userId, status }: { userId: string; status: "active" | "suspended" | "banned" }, { rejectWithValue }) => {
    try {
      const response = await api.put<ApiResponse<User>>(`/admin/users/${userId}/status`, { status })
      return response.data.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to update user status")
    }
  },
)

export const deleteUser = createAsyncThunk("admin/deleteUser", async (userId: string, { rejectWithValue }) => {
  try {
    await api.delete(`/admin/users/${userId}`)
    return userId
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || "Failed to delete user")
  }
})

const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    clearAdminData: (state) => {
      state.stats = null
      state.pendingRestaurants = []
      state.recentOrders = []
      state.users = []
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch admin stats
      .addCase(fetchAdminStats.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchAdminStats.fulfilled, (state, action) => {
        state.isLoading = false
        state.stats = action.payload
        state.error = null
      })
      .addCase(fetchAdminStats.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      // Fetch pending restaurants
      .addCase(fetchPendingRestaurants.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchPendingRestaurants.fulfilled, (state, action) => {
        state.isLoading = false
        state.pendingRestaurants = action.payload
        state.error = null
      })
      .addCase(fetchPendingRestaurants.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      // Approve restaurant
      .addCase(approveRestaurant.fulfilled, (state, action) => {
        state.pendingRestaurants = state.pendingRestaurants.filter((r) => r._id !== action.payload._id)
      })
      // Reject restaurant
      .addCase(rejectRestaurant.fulfilled, (state, action) => {
        state.pendingRestaurants = state.pendingRestaurants.filter((r) => r._id !== action.payload._id)
      })
      // Suspend restaurant
      .addCase(suspendRestaurant.fulfilled, (state, action) => {
        const index = state.pendingRestaurants.findIndex((r) => r._id === action.payload._id)
        if (index !== -1) {
          state.pendingRestaurants[index] = action.payload
        }
      })
      // Fetch recent orders
      .addCase(fetchRecentOrders.fulfilled, (state, action) => {
        state.recentOrders = action.payload
      })
      // Fetch all orders
      .addCase(fetchAllOrders.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchAllOrders.fulfilled, (state, action) => {
        state.isLoading = false
        state.recentOrders = action.payload.orders
        state.pagination = action.payload.pagination
        state.error = null
      })
      .addCase(fetchAllOrders.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      // Fetch users
      .addCase(fetchUsers.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.isLoading = false
        state.users = action.payload.users
        state.pagination = action.payload.pagination
        state.error = null
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      // Update user status
      .addCase(updateUserStatus.fulfilled, (state, action) => {
        const index = state.users.findIndex((u) => u._id === action.payload._id)
        if (index !== -1) {
          state.users[index] = action.payload
        }
      })
      // Delete user
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.users = state.users.filter((u) => u._id !== action.payload)
      })
  },
})

export const { clearError, clearAdminData } = adminSlice.actions
export default adminSlice.reducer
