import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { adminService } from "../../services/adminService"
import type { Restaurant, Order, User, MenuItem } from "../../types"

// ==============================
// 1. Define Strict Response Types
// ==============================

// Matches: res.json({ success: true, data: users, pagination: {...} })
interface UsersResponse {
  success: boolean
  data: User[]
  pagination?: {
    current: number
    pages: number
    total: number
    limit: number
  }
}

// Matches: res.json({ success: true, data: orders, pagination: {...} })
interface OrdersResponse {
  success: boolean
  data: Order[]
  pagination?: {
    current: number
    pages: number
    total: number
    limit: number
  }
}

// Matches: res.json({ success: true, data: restaurants })
interface PendingRestaurantsResponse {
  success: boolean
  data: Restaurant[]
  pagination?: any
}

// Matches: res.json({ success: true, data: { stats: ..., recentFeedback: ... } })
interface FeedbackResponse {
  success: boolean
  data: {
    stats: {
      avgFoodRating: number
      avgDeliveryRating: number
      avgOverallRating: number
      totalRatings: number
      ratingDistribution: number[]
    }
    recentFeedback: any[]
  }
}

// Matches: res.json({ success: true, data: { overview: ... } })
interface AdminStatsResponse {
  success: boolean
  data: {
    overview: {
      totalUsers: number
      totalRestaurants: number
      totalOrders: number
      totalRevenue: number
      pendingRestaurants: number
      activeOrders: number
    }
    recentActivity: {
      users: User[]
      orders: Order[]
    }
    analytics: {
      ordersByStatus: { _id: string; count: number }[]
      revenueByPeriod: { _id: string; revenue: number; orders: number }[]
    }
  }
}

// ✅ NEW: Menu Response Types
interface MenuItemsResponse {
  success: boolean
  data: MenuItem[]
  total?: number
}

interface MenuItemResponse {
  success: boolean
  data: MenuItem
}

// ==============================
// 2. Slice State Interface
// ==============================

interface AdminState {
  stats: AdminStatsResponse['data'] | null
  pendingRestaurants: Restaurant[]
  orders: Order[]
  users: User[]
  riders: User[] // ✅ NEW: All riders
  availableRiders: User[] // ✅ NEW: Available riders for assignment
  restaurants: Restaurant[] // ✅ NEW: All restaurants
  selectedRestaurantId: string | null // ✅ NEW: Currently selected restaurant
  menuItems: MenuItem[] // ✅ NEW: Menu items array
  currentMenuItem: MenuItem | null // ✅ NEW: Single menu item
  isLoading: boolean
  error: string | null
  pagination: {
    current: number
    pages: number
    total: number
    limit: number
  }
  menuPagination: { // ✅ NEW: Menu pagination
    current: number
    total: number
    limit: number
  }
  feedback: FeedbackResponse['data'] | null // ✅ NEW: Feedback stats
}

const initialState: AdminState = {
  stats: null,
  pendingRestaurants: [],
  orders: [],
  users: [],
  riders: [], // ✅ NEW
  availableRiders: [], // ✅ NEW
  restaurants: [], // ✅ NEW
  selectedRestaurantId: null, // ✅ NEW
  menuItems: [], // ✅ NEW
  currentMenuItem: null, // ✅ NEW
  isLoading: false,
  error: null,
  pagination: {
    current: 1,
    pages: 0,
    total: 0,
    limit: 10,
  },
  menuPagination: { // ✅ NEW
    current: 1,
    total: 0,
    limit: 20,
  },
  feedback: null, // ✅ NEW
}

// ==============================
// 3. Async Thunks (Typed)
// ==============================

export const fetchAdminStats = createAsyncThunk<AdminStatsResponse, void>(
  "admin/fetchAdminStats",
  async (_, { rejectWithValue }) => {
    try {
      const response = await adminService.getStats()
      return response as unknown as AdminStatsResponse
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch admin stats")
    }
  }
)



export const fetchFeedbackStats = createAsyncThunk<FeedbackResponse, void>(
  "admin/fetchFeedbackStats",
  async (_, { rejectWithValue }) => {
    try {
      const response = await adminService.getFeedbackStats()
      return response as unknown as FeedbackResponse
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch feedback stats")
    }
  }
)

export const fetchPendingRestaurants = createAsyncThunk<PendingRestaurantsResponse, { page?: number; limit?: number } | undefined>(
  "admin/fetchPendingRestaurants",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await adminService.getPendingRestaurants(params.page, params.limit)
      return response as unknown as PendingRestaurantsResponse
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch pending restaurants")
    }
  }
)

export const fetchAllRestaurants = createAsyncThunk<PendingRestaurantsResponse, { page?: number; limit?: number } | undefined>(
  "admin/fetchAllRestaurants",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await adminService.getAllRestaurants(params)
      return response as unknown as PendingRestaurantsResponse
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch restaurants")
    }
  }
)

export const fetchAllOrders = createAsyncThunk<OrdersResponse, { page?: number; limit?: number } | undefined>(
  "admin/fetchAllOrders",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await adminService.getAllOrders(params)
      return response as unknown as OrdersResponse
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch orders")
    }
  }
)

export const fetchUsers = createAsyncThunk<UsersResponse, { page?: number; limit?: number; role?: string; search?: string; isActive?: boolean } | undefined>(
  "admin/fetchUsers",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await adminService.getUsers(params)
      return response as unknown as UsersResponse
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch users")
    }
  }
)

export const approveRestaurant = createAsyncThunk(
  "admin/approveRestaurant",
  async (payload: { restaurantId: string; message?: string }, { rejectWithValue }) => {
    try {
      const response = await adminService.approveRestaurant(payload.restaurantId, payload.message)
      return response
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to approve restaurant")
    }
  }
)

export const rejectRestaurant = createAsyncThunk(
  "admin/rejectRestaurant",
  async (payload: { restaurantId: string; reason: string }, { rejectWithValue }) => {
    try {
      const response = await adminService.rejectRestaurant(payload.restaurantId, payload.reason)
      return response
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to reject restaurant")
    }
  }
)

export const updateUserStatus = createAsyncThunk(
  "admin/updateUserStatus",
  async (payload: { userId: string; isActive: boolean }, { rejectWithValue }) => {
    try {
      const response = await adminService.updateUserStatus(payload.userId, payload.isActive)
      return response
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to update status")
    }
  }
)

export const updateOrderStatus = createAsyncThunk(
  "admin/updateOrderStatus",
  async (payload: { orderId: string; status: string }, { rejectWithValue }) => {
    try {
      const response = await adminService.updateOrderStatus(payload.orderId, payload.status)
      return response
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to update order status")
    }
  }
)

// ==============================
// 🛵 Rider Thunks
// ==============================

export const fetchRiders = createAsyncThunk<UsersResponse, { page?: number; limit?: number; search?: string } | undefined>(
  "admin/fetchRiders",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await adminService.getRiders(params)
      return response as unknown as UsersResponse
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch riders")
    }
  }
)

export const fetchAvailableRiders = createAsyncThunk<{ success: boolean; data: User[] }, void>(
  "admin/fetchAvailableRiders",
  async (_, { rejectWithValue }) => {
    try {
      const response = await adminService.getAvailableRiders()
      return response as unknown as { success: boolean; data: User[] }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch available riders")
    }
  }
)

export const assignRiderToOrder = createAsyncThunk<Order, { orderId: string; riderId: string }>(
  "admin/assignRiderToOrder",
  async ({ orderId, riderId }, { rejectWithValue, dispatch }) => {
    try {
      const response = await adminService.assignRiderToOrder(orderId, riderId)
      dispatch(fetchAvailableRiders())
      dispatch(fetchAllOrders({ limit: 20, page: 1 }))
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to assign rider")
    }
  }
)

// ==============================
// ✅ 4. NEW: MENU CRUD THUNKS
// ==============================

// ✅ Get all menu items for a restaurant
export const fetchMenuItems = createAsyncThunk<MenuItemsResponse, { restaurantId: string; filters?: any }>(
  "admin/fetchMenuItems",
  async ({ restaurantId, filters }, { rejectWithValue }) => {
    try {
      const response = await adminService.getMenuItems(restaurantId, filters)
      return response as MenuItemsResponse
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch menu items")
    }
  }
)

// ✅ Get single menu item by ID
export const fetchMenuItemById = createAsyncThunk<MenuItemResponse, string>(
  "admin/fetchMenuItemById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await adminService.getMenuItemById(id)
      return response as MenuItemResponse
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch menu item")
    }
  }
)

// ✅ Add new menu item
export const addMenuItem = createAsyncThunk<MenuItemResponse, Partial<MenuItem>>(
  "admin/addMenuItem",
  async (data, { rejectWithValue }) => {
    try {
      const response = await adminService.addMenuItem(data)
      return response as MenuItemResponse
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to add menu item")
    }
  }
)

// ✅ Upload menu item image
export const uploadMenuItemImage = createAsyncThunk<{ success: boolean; imageUrl: string }, File>(
  "admin/uploadMenuItemImage",
  async (file, { rejectWithValue }) => {
    try {
      const response = await adminService.uploadImage(file)
      return response as unknown as { success: boolean; imageUrl: string }
    } catch (error: any) {
      console.error("Upload error full details:", error)
      const errorMsg = error.data?.message || error.response?.data?.message || error.message || "Failed to upload image"
      return rejectWithValue(errorMsg)
    }
  }
)

// ✅ Update menu item
export const updateMenuItem = createAsyncThunk<MenuItemResponse, { id: string; data: Partial<MenuItem> }>(
  "admin/updateMenuItem",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await adminService.updateMenuItem(id, data)
      return response as MenuItemResponse
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to update menu item")
    }
  }
)

// ✅ Delete menu item
export const deleteMenuItem = createAsyncThunk<{ success: boolean; id: string }, string>(
  "admin/deleteMenuItem",
  async (id, { rejectWithValue }) => {
    try {
      await adminService.deleteMenuItem(id)
      return { success: true, id }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to delete menu item")
    }
  }
)

// ✅ Toggle availability
export const toggleMenuItemAvailability = createAsyncThunk<MenuItemResponse, { id: string; isAvailable: boolean }>(
  "admin/toggleMenuItemAvailability",
  async ({ id, isAvailable }, { rejectWithValue }) => {
    try {
      const response = await adminService.toggleAvailability(id, isAvailable)
      return response as MenuItemResponse
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to toggle availability")
    }
  }
)

// ✅ Toggle popular status
export const toggleMenuItemPopular = createAsyncThunk<MenuItemResponse, { id: string; isPopular: boolean }>(
  "admin/toggleMenuItemPopular",
  async ({ id, isPopular }, { rejectWithValue }) => {
    try {
      const response = await adminService.togglePopular(id, isPopular)
      return response as MenuItemResponse
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to toggle popular status")
    }
  }
)

// ✅ Toggle featured status
export const toggleMenuItemFeatured = createAsyncThunk<MenuItemResponse, { id: string; isFeatured: boolean }>(
  "admin/toggleMenuItemFeatured",
  async ({ id, isFeatured }, { rejectWithValue }) => {
    try {
      const response = await adminService.toggleFeatured(id, isFeatured)
      return response as MenuItemResponse
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to toggle featured status")
    }
  }
)

// ✅ Bulk add menu items
export const bulkAddMenuItems = createAsyncThunk<{ success: boolean; data: MenuItem[] }, Partial<MenuItem>[]>(
  "admin/bulkAddMenuItems",
  async (items, { rejectWithValue }) => {
    try {
      const response = await adminService.bulkAddMenuItems(items)
      return response as any
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to bulk add items")
    }
  }
)

// ✅ Get categories
export const fetchCategories = createAsyncThunk<string[]>(
  "admin/fetchCategories",
  async (_, { rejectWithValue }) => {
    try {
      const response = await adminService.getCategories()
      return response.data || []
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch categories")
    }
  }
)

// Analytics thunks
export const getRevenueAnalytics = createAsyncThunk(
  "admin/getRevenueAnalytics",
  async (params: any, { rejectWithValue }) => {
    try { return (await adminService.getRevenueAnalytics(params)).data }
    catch (e: any) { return rejectWithValue(e.message) }
  }
)

export const getOrderAnalytics = createAsyncThunk(
  "admin/getOrderAnalytics",
  async (params: any, { rejectWithValue }) => {
    try { return (await adminService.getOrderAnalytics(params)).data }
    catch (e: any) { return rejectWithValue(e.message) }
  }
)

export const getSystemHealth = createAsyncThunk(
  "admin/getSystemHealth",
  async (_, { rejectWithValue }) => {
    try {
      const response = await adminService.getSystemHealth()
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch system health")
    }
  }
)

// ==============================
// 5. Slice Logic
// ==============================

const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    clearError: (state) => { state.error = null },
    clearAdminData: (state) => {
      state.stats = null
      state.pendingRestaurants = []
      state.orders = []
      state.users = []
      state.menuItems = [] // ✅ Clear menu items too
      state.currentMenuItem = null
    },
    clearCurrentMenuItem: (state) => {
      state.currentMenuItem = null
    },
    setSelectedRestaurantId: (state, action) => {
      state.selectedRestaurantId = action.payload
    },
    setOrderStatus: (state, action) => {
      const updatedOrder = action.payload
      const index = state.orders.findIndex(o => o._id === updatedOrder._id)
      if (index !== -1) {
        state.orders[index] = updatedOrder
      }
    },
    setRiderStatus: (state, action) => {
      const { riderId, status } = action.payload
      const index = state.riders.findIndex(r => r._id === riderId)
      if (index !== -1) {
        state.riders[index].riderStatus = status
      }
      // Also update availableRiders list
      const availIndex = state.availableRiders.findIndex(r => r._id === riderId)
      if (status === "available" && availIndex === -1) {
        const rider = state.riders.find(r => r._id === riderId)
        if (rider) state.availableRiders.push(rider)
      } else if (status !== "available" && availIndex !== -1) {
        state.availableRiders.splice(availIndex, 1)
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // 🟢 Admin Stats
      .addCase(fetchAdminStats.fulfilled, (state, action) => {
        state.isLoading = false
        const payload = action.payload as any
        state.stats = payload.data || payload
      })

      // 🟢 Pending Restaurants
      .addCase(fetchPendingRestaurants.fulfilled, (state, action) => {
        state.isLoading = false
        const payload = action.payload as any
        const list = Array.isArray(payload) ? payload : (Array.isArray(payload.data) ? payload.data : [])
        state.pendingRestaurants = list
      })
      // 🟢 All Restaurants
      .addCase(fetchAllRestaurants.fulfilled, (state, action) => {
        state.isLoading = false
        const payload = action.payload as any
        const list = Array.isArray(payload) ? payload : (Array.isArray(payload.data) ? payload.data : [])
        state.restaurants = list
        if (!state.selectedRestaurantId && list.length > 0) {
          state.selectedRestaurantId = list[0]._id
        }
      })

      // 🟢 All Orders
      .addCase(fetchAllOrders.fulfilled, (state, action) => {
        state.isLoading = false
        const payload = action.payload as any
        const list = Array.isArray(payload) ? payload : (Array.isArray(payload.data) ? payload.data : [])
        state.orders = list

        if (payload.pagination) state.pagination = payload.pagination
      })

      // 🟢 Users
      .addCase(fetchUsers.pending, () => {
        // Optional debugging console log 
        // console.log("fetching users");
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.isLoading = false
        const payload = action.payload as any
        const list = Array.isArray(payload) ? payload : (Array.isArray(payload.data) ? payload.data : [])
        state.users = list

        if (payload.pagination) state.pagination = payload.pagination
      })

      // 🟢 Approve Restaurant
      .addCase(approveRestaurant.fulfilled, (state, action) => {
        const payload = action.payload as any
        const id = payload.data?._id || payload._id
        state.pendingRestaurants = state.pendingRestaurants.filter(r => r._id !== id)
      })

      // 🟢 Reject Restaurant
      .addCase(rejectRestaurant.fulfilled, (state, action) => {
        const payload = action.payload as any
        const id = payload.data?._id || payload._id
        state.pendingRestaurants = state.pendingRestaurants.filter(r => r._id !== id)
      })

      // 🟢 Update User Status
      .addCase(updateUserStatus.fulfilled, (state, action) => {
        const payload = action.payload as any
        const updatedUser = payload.data || payload
        const index = state.users.findIndex(u => u._id === updatedUser._id)
        if (index !== -1) {
          state.users[index] = updatedUser
        }
      })

      // 🟢 Update Order Status
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        const payload = action.payload as any
        const updatedOrder = payload.data || payload

        const index = state.orders.findIndex(o => o._id === updatedOrder._id)
        if (index !== -1) {
          state.orders[index] = updatedOrder
        }
      })

      // ============ 🛵 RIDER HANDLERS ============

      // 🟢 Fetch Riders
      .addCase(fetchRiders.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchRiders.fulfilled, (state, action) => {
        state.isLoading = false
        const payload = action.payload as any
        state.riders = payload.data || payload || []
        if (payload.pagination) {
          state.pagination = payload.pagination
        }
      })
      .addCase(fetchRiders.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })

      // 🟢 Fetch Available Riders
      .addCase(fetchAvailableRiders.fulfilled, (state, action) => {
        const payload = action.payload as any
        state.availableRiders = payload.data || payload || []
      })

      // 🟢 Assign Rider to Order
      .addCase(assignRiderToOrder.fulfilled, (state, action) => {
        const payload = action.payload as any
        const updatedOrder = payload.data || payload

        const index = state.orders.findIndex(o => o._id === updatedOrder._id)
        if (index !== -1) {
          state.orders[index] = updatedOrder
        }
      })

      // ============ ✅ MENU CRUD HANDLERS ============

      // 🟢 Fetch Menu Items
      .addCase(fetchMenuItems.fulfilled, (state, action) => {
        state.isLoading = false
        const payload = action.payload as any
        state.menuItems = payload.data || payload || []
        if (payload.total) {
          state.menuPagination.total = payload.total
        }
      })

      // 🟢 Fetch Single Menu Item
      .addCase(fetchMenuItemById.fulfilled, (state, action) => {
        state.isLoading = false
        const payload = action.payload as any
        state.currentMenuItem = payload.data || payload
      })

      // 🟢 Add Menu Item
      .addCase(addMenuItem.fulfilled, (state, action) => {
        state.isLoading = false
        const payload = action.payload as any
        const newItem = payload.data || payload
        state.menuItems = [newItem, ...state.menuItems]
      })

      // 🟢 Feedback Stats
      .addCase(fetchFeedbackStats.fulfilled, (state, action) => {
        state.isLoading = false
        state.feedback = action.payload.data
      })

      // 🟢 Update Menu Item
      .addCase(updateMenuItem.fulfilled, (state, action) => {
        state.isLoading = false
        const payload = action.payload as any
        const updatedItem = payload.data || payload

        const index = state.menuItems.findIndex(item => item._id === updatedItem._id)
        if (index !== -1) {
          state.menuItems[index] = updatedItem
        }

        if (state.currentMenuItem?._id === updatedItem._id) {
          state.currentMenuItem = updatedItem
        }
      })

      // 🟢 Delete Menu Item
      .addCase(deleteMenuItem.fulfilled, (state, action) => {
        state.isLoading = false
        const { id } = action.payload
        state.menuItems = state.menuItems.filter(item => item._id !== id)
        if (state.currentMenuItem?._id === id) {
          state.currentMenuItem = null
        }
      })

      // 🟢 Toggle Availability
      .addCase(toggleMenuItemAvailability.fulfilled, (state, action) => {
        state.isLoading = false
        const payload = action.payload as any
        const updatedItem = payload.data || payload

        const index = state.menuItems.findIndex(item => item._id === updatedItem._id)
        if (index !== -1) {
          state.menuItems[index] = updatedItem
        }
      })

      // 🟢 Toggle Popular
      .addCase(toggleMenuItemPopular.fulfilled, (state, action) => {
        state.isLoading = false
        const payload = action.payload as any
        const updatedItem = payload.data || payload

        const index = state.menuItems.findIndex(item => item._id === updatedItem._id)
        if (index !== -1) {
          state.menuItems[index] = updatedItem
        }
      })

      // 🟢 Toggle Featured
      .addCase(toggleMenuItemFeatured.fulfilled, (state, action) => {
        state.isLoading = false
        const payload = action.payload as any
        const updatedItem = payload.data || payload

        const index = state.menuItems.findIndex(item => item._id === updatedItem._id)
        if (index !== -1) {
          state.menuItems[index] = updatedItem
        }
      })

      // 🟢 Bulk Add Menu Items
      .addCase(bulkAddMenuItems.fulfilled, (state, action) => {
        state.isLoading = false
        const payload = action.payload as any
        const newItems = payload.data || payload
        if (Array.isArray(newItems)) {
          state.menuItems = [...newItems, ...state.menuItems]
        }
      })

      // 🟢 Fetch Categories
      .addCase(fetchCategories.fulfilled, () => {
        // Categories don't need to be stored in state, but we can if needed
      })

      // Standard Pending/Rejected handlers
      .addMatcher(
        (action) => action.type.endsWith('/pending'),
        (state) => { state.isLoading = true; state.error = null }
      )
      .addMatcher(
        (action) => action.type.endsWith('/rejected'),
        (state, action: any) => {
          state.isLoading = false;
          state.error = action.payload as string
        }
      )
  },
})

export const { clearError, clearAdminData, clearCurrentMenuItem, setSelectedRestaurantId, setOrderStatus, setRiderStatus } = adminSlice.actions
export default adminSlice.reducer