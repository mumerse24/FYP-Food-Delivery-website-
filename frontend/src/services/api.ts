import axios from "axios"

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api"
console.log("🔧 API Base URL →", API_BASE_URL)

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
})

// ✅ ENHANCED REQUEST INTERCEPTOR
api.interceptors.request.use(
  (config) => {
    // Debug logging for development
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔧 API Request: ${config.method?.toUpperCase()} ${config.url}`)
      if (config.data) {
        console.log("📦 Request Data:", JSON.stringify(config.data, null, 2))
      }
    }

    // Get token based on application context
    let token = null;
    if (typeof window !== 'undefined') {
      if (window.location.pathname.startsWith('/admin')) {
        token = localStorage.getItem("adminToken");
      } else if (window.location.pathname.startsWith('/rider')) {
        token = localStorage.getItem("riderToken");
      } else {
        token = localStorage.getItem("token");
      }
    }

    // Fallback if specific token not found
    if (!token) {
      token = localStorage.getItem("adminToken") || localStorage.getItem("token") || localStorage.getItem("riderToken");
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`

      // Debug logging
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔧 Authorization token attached: ${token.substring(0, 20)}...`)
      }
    } else {
      // Only warn in development, not production
      if (process.env.NODE_ENV === 'development') {
        console.warn("⚠️ No authentication token found in localStorage")
      }
    }

    return config
  },
  (error) => {
    console.error("❌ Request interceptor error:", error)
    return Promise.reject(error)
  }
)

// ✅ ENHANCED RESPONSE INTERCEPTOR with Menu-Specific Handling
api.interceptors.response.use(
  (response) => {
    // Debug logging for successful responses
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ API Success: ${response.status} ${response.config.url}`)
    }
    return response
  },
  (error) => {
    // Don't log for cancelled requests
    if (axios.isCancel(error)) {
      console.log("Request cancelled:", error.message)
      return Promise.reject(error)
    }

    const { response } = error
    const originalRequest = error.config

    // ============ MENU-SPECIFIC ERROR HANDLING ============
    if (originalRequest?.url === '/menu' && originalRequest?.method === 'post') {
      console.error("❌ MENU ADD ERROR - Detailed Analysis:")

      // Check if user is authenticated
      const token = localStorage.getItem("token") || localStorage.getItem("adminToken")
      if (!token) {
        console.error("❌ No authentication token found")
        alert("You must be logged in as admin to add menu items")

        // Redirect to admin login
        setTimeout(() => {
          window.location.href = '/admin/login'
        }, 2000)
        return Promise.reject(error)
      }

      // Check token format
      try {
        const tokenParts = token.split('.')
        if (tokenParts.length !== 3) {
          console.error("❌ Invalid token format")
        }
      } catch (e) {
        console.error("❌ Token parse error:", e)
      }

      // Log the data that was sent
      if (originalRequest.data) {
        console.log("📦 Data sent:", JSON.parse(originalRequest.data))
      }
    }

    // Debug logging for errors
    console.error("❌ API Error:", {
      url: originalRequest?.url,
      method: originalRequest?.method,
      status: response?.status,
      message: error.message,
      data: response?.data
    })

    // Show validation errors for 400 responses
    if (response?.status === 400 && response?.data?.errors) {
      console.table(response.data.errors)

      // Create a user-friendly message
      const errorMessages = response.data.errors.map((e: any) => {
        if (e.param === 'images') return "At least one image is required"
        if (e.param === 'name') return "Name must be between 2 and 100 characters"
        if (e.param === 'description') return "Description must be between 10 and 300 characters"
        if (e.param === 'price') return "Price must be a positive number"
        if (e.param === 'category') return "Category is required"
        if (e.param === 'restaurant') return "Valid restaurant ID is required"
        return e.msg || e.message
      }).join("\n")

      alert(`Validation Error:\n${errorMessages}`)
    }

    // Handle 401 Unauthorized
    if (response?.status === 401) {
      console.warn("🔒 Unauthorized access detected")

      // Show user-friendly message
      if (!originalRequest._retry) {
        originalRequest._retry = true

        // Don't intercept 401 for login endpoints (let the login forms handle their own errors)
        if (originalRequest.url?.includes('/auth/login')) {
          return Promise.reject(error);
        }

        // Don't logout if FCM token registration fails (not critical)
        if (originalRequest.url?.includes('/auth/fcm-token')) {
          console.warn("FCM token registration failed, but proceeding without logout.");
          return Promise.reject(error);
        }

        // Clear all authentication data
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        localStorage.removeItem("adminToken")
        localStorage.removeItem("adminUser")

        // Remove auth header from axios defaults
        delete api.defaults.headers.common.Authorization

        const isAdminPage = window.location.pathname.includes('/admin')
        const isRiderPage = window.location.pathname.includes('/rider')

        const message = isAdminPage
          ? "Admin session expired. Please login again."
          : isRiderPage
            ? "Rider session expired. Please login again."
            : "Your session has expired. Please login again."

        alert(message)

        // Redirect after a delay
        setTimeout(() => {
          const redirectTo = isAdminPage
            ? '/admin/login'
            : isRiderPage
              ? '/rider/login'
              : '/'
          window.location.href = redirectTo
        }, 2000)
      }
    }

    // Handle 403 Forbidden
    if (response?.status === 403) {
      console.warn("🚫 Forbidden access detected")

      if (typeof window !== 'undefined') {
        // Clear admin token since it's invalid for this action
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");

        const message = "You don't have admin permission to perform this action."
        alert(message)

        setTimeout(() => {
          window.location.href = '/admin/login'
        }, 1000)
      }
    }

    // Handle 404 Not Found
    if (response?.status === 404) {
      console.warn("🔍 Endpoint not found:", originalRequest?.url)
    }

    // Handle 500 Server Error
    if (response?.status >= 500) {
      console.error("💥 Server error:", response.status)
      alert("Server error. Please try again later.")
    }

    // Handle Network Errors
    if (!response && error.message === "Network Error") {
      console.error("🌐 Network error - Check your internet connection")
      alert("Cannot connect to server. Please check your internet connection.")
    }

    // Handle Timeout
    if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
      console.error("⏰ Request timeout")
      alert("Request timed out. Please try again.")
    }

    // Always return a consistent error format
    return Promise.reject({
      status: response?.status || 0,
      message: error.message || "Unknown error occurred",
      data: response?.data || null,
      config: originalRequest
    })
  }
)

// ✅ Helper function to set token manually
export const setAuthToken = (token: string) => {
  localStorage.setItem("token", token)
  api.defaults.headers.common.Authorization = `Bearer ${token}`
  console.log("🔧 Authentication token set")
}

// ✅ Helper function to set admin token specifically
export const setAdminToken = (token: string) => {
  localStorage.setItem("adminToken", token)
  api.defaults.headers.common.Authorization = `Bearer ${token}`
  console.log("🔧 Admin authentication token set")
}

// ✅ Helper function to clear all auth data
export const clearAuth = () => {
  localStorage.removeItem("token")
  localStorage.removeItem("user")
  localStorage.removeItem("adminToken")
  localStorage.removeItem("adminUser")
  delete api.defaults.headers.common.Authorization
  console.log("🔧 Authentication cleared")
}

// ✅ Helper to check if user is authenticated
export const isAuthenticated = () => {
  if (typeof window !== 'undefined') {
    if (window.location.pathname.startsWith('/admin')) {
      return !!localStorage.getItem("adminToken");
    } else if (window.location.pathname.startsWith('/rider')) {
      return !!localStorage.getItem("riderToken");
    }
  }
  const token = localStorage.getItem("token") || localStorage.getItem("adminToken");
  return !!token
}

// ✅ Helper to check if admin is authenticated
export const isAdminAuthenticated = () => {
  const token = localStorage.getItem("adminToken")
  return !!token
}

// ✅ Helper to get current token
export const getCurrentToken = () => {
  if (typeof window !== 'undefined') {
    if (window.location.pathname.startsWith('/admin')) {
      return localStorage.getItem("adminToken");
    } else if (window.location.pathname.startsWith('/rider')) {
      return localStorage.getItem("riderToken");
    }
  }
  return localStorage.getItem("token") || localStorage.getItem("adminToken");
}

// ✅ Helper to get admin token
export const getAdminToken = () => {
  return localStorage.getItem("adminToken")
}

// ✅ Helper to validate token format
export const validateToken = (token: string) => {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return false

    // Check if it's a valid JWT format
    const header = JSON.parse(atob(parts[0]))
    const payload = JSON.parse(atob(parts[1]))

    return header && payload
  } catch (e) {
    return false
  }
}

// ✅ Cancel token utility for cancelling requests
export const createCancelToken = () => {
  return axios.CancelToken.source()
}

export default api