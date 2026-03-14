import api from "./api"

export const riderService = {
    // ============ Auth ============
    login: async (email: string, password: string) => {
        const response = await api.post("/auth/login", { email, password })
        const data = response.data
        if (data.success && data.data?.user?.role === "rider") {
            localStorage.setItem("riderToken", data.data.token)
            localStorage.setItem("riderData", JSON.stringify(data.data.user))
        }
        return data
    },

    logout: () => {
        localStorage.removeItem("riderToken")
        localStorage.removeItem("riderData")
    },

    // ============ Orders ============
    getMyOrders: async (status?: string) => {
        const params = status ? { status } : {}
        const response = await api.get("/rider/orders", { params })
        return response.data
    },

    updateOrderStatus: async (orderId: string, status: string, note?: string) => {
        const response = await api.put(`/rider/orders/${orderId}/status`, { status, note })
        return response.data
    },

    // ============ History ============
    getHistory: async (page = 1, limit = 20) => {
        const response = await api.get("/rider/history", { params: { page, limit } })
        return response.data
    },

    // ============ Profile ============
    getProfile: async () => {
        const response = await api.get("/rider/profile")
        return response.data
    },

    updateStatus: async (status: "available" | "offline") => {
        const response = await api.put("/rider/status", { status })
        return response.data
    },
}
