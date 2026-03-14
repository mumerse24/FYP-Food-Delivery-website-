export interface User {
  _id: string
  name: string
  email: string
  role: "customer" | "restaurant" | "admin"
  phone?: string
  address?: string
  createdAt: string
}

export interface Restaurant {
  _id: string
  name: string
  description: string
  cuisine: string
  address: string
  phone: string
  email: string
  image: string
  rating: number
  deliveryTime: string
  deliveryFee: number
  minimumOrder: number
  isOpen: boolean
  status: "pending" | "approved" | "rejected" | "suspended"
  owner: string
  createdAt: string
}

export interface MenuItem {
  originalPrice: any
  _id: string
  restaurant: string
  name: string
  description: string
  price: number
  category: string
  image: string
  isAvailable: boolean
  cuisine: string   // ✅ string hona chahiye, method nahi
  rating?: number   // ✅ optional rating
  ingredients?: string[]
  allergens?: string[]
  nutritionalInfo?: {
    calories: number
    protein: number
    carbs: number
    fat: number
  }
}


export interface CartItem {
  menuItem: MenuItem
  quantity: number
  specialInstructions?: string
}

export interface Order {
  _id: string
  user: string
  restaurant: Restaurant
  items: CartItem[]
  totalAmount: number
  deliveryAddress: string
  status: "pending" | "confirmed" | "preparing" | "out_for_delivery" | "delivered" | "cancelled"
  paymentStatus: "pending" | "paid" | "failed"
  createdAt: string
  estimatedDeliveryTime?: string
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}
export interface Filters {
  categories: string[]
  cuisines: string[]
  rating: string
  price: string
}

export interface ApiError {
  message: string
  status: number
}
