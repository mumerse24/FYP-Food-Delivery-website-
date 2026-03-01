import api from "./api"
import type { Restaurant, Order, User, MenuItem, ApiResponse } from "../types"

// ✅ Type Definitions matched to Backend Responses
interface Pagination {
  current: number
  pages: number
  total: number
  limit: number
}

interface AdminStats {
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

// ✅ Menu Item Filters Interface
interface MenuFilters {
  category?: string
  search?: string
  isAvailable?: boolean
  isPopular?: boolean
  isFeatured?: boolean
  page?: number
  limit?: number
}

export const adminService = {
  // ✅ Dashboard Stats
  getStats: async () => {
    const response = await api.get<ApiResponse<AdminStats>>("/admin/dashboard")
    return response.data
  },

  // ✅ Restaurant Management
  getPendingRestaurants: async (page = 1, limit = 20) => {
    const response = await api.get<ApiResponse<{ data: Restaurant[]; pagination: Pagination }>>(
      "/admin/restaurants/pending",
      { params: { page, limit } }
    )
    return response.data
  },

  getAllRestaurants: async (params: { page?: number; limit?: number; status?: string } = {}) => {
    const response = await api.get<ApiResponse<{ data: Restaurant[]; pagination: Pagination }>>(
      "/restaurants",
      { params: { ...params, status: "approved" } }
    )
    return response.data
  },

  approveRestaurant: async (restaurantId: string, message?: string) => {
    const response = await api.put<ApiResponse<Restaurant>>(
      `/admin/restaurants/${restaurantId}/approve`,
      { message }
    )
    return response.data
  },

  rejectRestaurant: async (restaurantId: string, reason: string) => {
    const response = await api.put<ApiResponse<Restaurant>>(
      `/admin/restaurants/${restaurantId}/reject`,
      { reason }
    )
    return response.data
  },

  // ✅ Order Management
  getAllOrders: async (
    params: {
      page?: number
      limit?: number
      status?: string
      restaurant?: string
      customer?: string
      dateFrom?: string
      dateTo?: string
    } = {},
  ) => {
    const response = await api.get<ApiResponse<{ data: Order[]; pagination: Pagination }>>(
      "/admin/orders",
      { params }
    )
    return response.data
  },

  updateOrderStatus: async (orderId: string, status: string) => {
    const response = await api.put<ApiResponse<Order>>(
      `/admin/orders/${orderId}/status`,
      { status }
    )
    return response.data
  },

  // ✅ User Management
  getUsers: async (
    params: {
      page?: number
      limit?: number
      role?: string
      search?: string
      isActive?: boolean
    } = {},
  ) => {
    const response = await api.get<ApiResponse<{ data: User[]; pagination: Pagination }>>(
      "/admin/users",
      { params }
    )
    return response.data
  },

  updateUserStatus: async (userId: string, isActive: boolean) => {
    const response = await api.put<ApiResponse<User>>(
      `/admin/users/${userId}/status`,
      { isActive }
    )
    return response.data
  },

  // ============ 📦 MENU MANAGEMENT (CRUD) ============

  // ✅ GET /api/menu/restaurant/:restaurantId
  // Get all menu items for a restaurant (with filters)
  getMenuItems: async (restaurantId: string, filters?: MenuFilters) => {
    const params = { ...filters }
    const response = await api.get<ApiResponse<MenuItem[]>>(
      `/menu/restaurant/${restaurantId}`,
      { params }
    )
    return response.data
  },

  // ✅ GET /api/menu/:id
  // Get single menu item by ID
  getMenuItemById: async (id: string) => {
    const response = await api.get<ApiResponse<MenuItem>>(`/menu/${id}`)
    return response.data
  },

  // ✅ POST /api/menu
  // Add new menu item (Admin only)
  addMenuItem: async (data: Partial<MenuItem>) => {
    const response = await api.post<ApiResponse<MenuItem>>("/menu", data)
    return response.data
  },

  // ✅ PUT /api/menu/:id
  // Update menu item (Admin only)
  updateMenuItem: async (id: string, data: Partial<MenuItem>) => {
    const response = await api.put<ApiResponse<MenuItem>>(`/menu/${id}`, data)
    return response.data
  },

  // ✅ DELETE /api/menu/:id
  // Delete menu item (Admin only)
  deleteMenuItem: async (id: string) => {
    const response = await api.delete<ApiResponse<null>>(`/menu/${id}`)
    return response.data
  },

  // ✅ PATCH /api/menu/:id/availability
  // Toggle menu item availability (Admin only)
  toggleAvailability: async (id: string, isAvailable: boolean) => {
    const response = await api.patch<ApiResponse<MenuItem>>(
      `/menu/${id}/availability`,
      { isAvailable }
    )
    return response.data
  },

  // ✅ POST /api/menu/bulk
  // Add multiple menu items (Admin only)
  bulkAddMenuItems: async (items: Partial<MenuItem>[]) => {
    const response = await api.post<ApiResponse<MenuItem[]>>("/menu/bulk", { items })
    return response.data
  },

  // ✅ GET /api/menu/categories/list
  // Get all available categories
  getCategories: async () => {
    const response = await api.get<ApiResponse<string[]>>("/menu/categories/list")
    return response.data
  },

  // ✅ Toggle popular/featured status
  togglePopular: async (id: string, isPopular: boolean) => {
    const response = await api.patch<ApiResponse<MenuItem>>(
      `/menu/${id}`,
      { isPopular }
    )
    return response.data
  },

  toggleFeatured: async (id: string, isFeatured: boolean) => {
    const response = await api.patch<ApiResponse<MenuItem>>(
      `/menu/${id}`,
      { isFeatured }
    )
    return response.data
  },

  // ============ 📢 BROADCAST & ANALYTICS ============

  // ✅ POST /api/upload
  // Upload an image file directly to the backend
  uploadImage: async (file: File) => {
    const formData = new FormData()
    formData.append("image", file)

    const response = await api.post<ApiResponse<{ imageUrl: string }>>("/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    })
    return response.data
  },

  sendNotification: async (data: {
    title: string
    message: string
    userType: "all" | "customers" | "restaurants"
    priority?: "low" | "medium" | "high"
  }) => {
    const response = await api.post("/admin/broadcast", data)
    return response.data
  },

  getRevenueAnalytics: async (params?: { period?: string; groupBy?: string }) => {
    const response = await api.get("/admin/analytics/revenue", { params })
    return response.data
  },

  getOrderAnalytics: async (params?: { period?: string }) => {
    const response = await api.get("/admin/analytics/orders", { params })
    return response.data
  },

  getSystemHealth: async () => {
    const response = await api.get("/admin/system/health")
    return response.data
  },
}

// ============ USAGE EXAMPLES ============
/*
// ✅ Add new menu item
const newItem = await adminService.addMenuItem({
  restaurant: "6973975518858a5d42961807",
  name: "Zinger Burger",
  description: "Crispy chicken burger",
  price: 500,
  category: "Burgers",
  images: ["url1.jpg"]
})

// ✅ Get all items
const items = await adminService.getMenuItems("6973975518858a5d42961807", {
  category: "Burgers",
  isAvailable: true
})

// ✅ Update item
await adminService.updateMenuItem("65fa123abc456789", {
  price: 550,
  isPopular: true
})

// ✅ Delete item
await adminService.deleteMenuItem("65fa123abc456789")

// ✅ Toggle availability
await adminService.toggleAvailability("65fa123abc456789", false)
*/