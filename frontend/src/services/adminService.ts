import api from "./api"
import type { Restaurant, Order, User, ApiResponse } from "../types"

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

export const adminService = {
  getStats: async () => {
    const response = await api.get<ApiResponse<AdminStats>>("/admin/stats")
    return response.data
  },

  getPendingRestaurants: async () => {
    const response = await api.get<ApiResponse<Restaurant[]>>("/admin/restaurants/pending")
    return response.data
  },

  approveRestaurant: async (restaurantId: string) => {
    const response = await api.put<ApiResponse<Restaurant>>(`/admin/restaurants/${restaurantId}/approve`)
    return response.data
  },

  rejectRestaurant: async (restaurantId: string, reason: string) => {
    const response = await api.put<ApiResponse<Restaurant>>(`/admin/restaurants/${restaurantId}/reject`, {
      reason,
    })
    return response.data
  },

  suspendRestaurant: async (restaurantId: string, reason: string) => {
    const response = await api.put<ApiResponse<Restaurant>>(`/admin/restaurants/${restaurantId}/suspend`, {
      reason,
    })
    return response.data
  },

  getRecentOrders: async () => {
    const response = await api.get<ApiResponse<Order[]>>("/admin/orders/recent")
    return response.data
  },

  getAllOrders: async (
    params: {
      page?: number
      limit?: number
      status?: string
      restaurant?: string
      dateFrom?: string
      dateTo?: string
    } = {},
  ) => {
    const response = await api.get<
      ApiResponse<{
        orders: Order[]
        pagination: { page: number; limit: number; total: number; totalPages: number }
      }>
    >("/admin/orders", { params })
    return response.data
  },

  getUsers: async (
    params: {
      page?: number
      limit?: number
      role?: string
      search?: string
    } = {},
  ) => {
    const response = await api.get<
      ApiResponse<{
        users: User[]
        pagination: { page: number; limit: number; total: number; totalPages: number }
      }>
    >("/admin/users", { params })
    return response.data
  },

  updateUserStatus: async (userId: string, status: "active" | "suspended" | "banned") => {
    const response = await api.put<ApiResponse<User>>(`/admin/users/${userId}/status`, { status })
    return response.data
  },

  deleteUser: async (userId: string) => {
    const response = await api.delete(`/admin/users/${userId}`)
    return response.data
  },

  sendNotification: async (data: {
    type: "email" | "push"
    recipients: string[]
    subject: string
    message: string
  }) => {
    const response = await api.post("/admin/notifications", data)
    return response.data
  },

  exportData: async (type: "orders" | "users" | "restaurants", format: "csv" | "excel") => {
    const response = await api.get(`/admin/export/${type}`, {
      params: { format },
      responseType: "blob",
    })
    return response.data
  },
}
