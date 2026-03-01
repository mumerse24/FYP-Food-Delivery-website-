export interface User {
  _id: string
  name: string
  email: string
  role: "customer" | "restaurant" | "admin"
  phone?: string
  address?: string
  isActive?: boolean
  createdAt: string
  updatedAt?: string
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
  owner: string | User
  createdAt: string
  updatedAt?: string
}

export interface MenuItem {
  _id: string
  restaurant: string | Restaurant
  
  // Basic Info
  name: string
  description: string
  category: string
  price: number
  originalPrice?: number
  
  // Media
  images: string[]  // ✅ Fixed: string[] instead of never[]
  image?: string     // For backward compatibility
  
  // Availability & Status
  isAvailable: boolean
  isPopular: boolean
  isFeatured: boolean
  discountPercentage: number
  
  // Dietary & Preparation
  dietaryTags: string[]  // ✅ Fixed: string[] instead of never[]
  spiceLevel?: "Mild" | "Medium" | "Hot" | "Extra Hot"
  preparationTime?: string
  
  // Ingredients & Allergens
  ingredients?: string[]
  allergens?: string[]
  
  // Nutritional Info
  nutritionalInfo?: {
    calories?: number
    protein?: number
    carbs?: number
    fat?: number
    fiber?: number
    sugar?: number
    sodium?: number
  }
  
  // Customizations
  customizations?: Array<{
    name: string
    options: Array<{
      name: string
      price: number
    }>
    required?: boolean
    multiSelect?: boolean
  }>
  
  // Ratings & Stats
  rating?: {
    average: number
    count: number
  }
  orderCount?: number
  
  // Timestamps
  createdAt: string
  updatedAt: string
}

export interface CartItem {
  menuItem: MenuItem
  quantity: number
  specialInstructions?: string
  selectedCustomizations?: Array<{
    name: string
    option: string
    price: number
  }>
}

export interface Order {
  _id: string
  user: string | User
  restaurant: string | Restaurant
  items: CartItem[]
  totalAmount: number
  deliveryAddress: string
  deliveryFee?: number
  tax?: number
  discount?: number
  status: "pending" | "confirmed" | "preparing" | "out_for_delivery" | "delivered" | "cancelled" | "rejected"
  paymentStatus: "pending" | "paid" | "failed" | "refunded"
  paymentMethod?: string
  specialInstructions?: string
  estimatedDeliveryTime?: string
  deliveredAt?: string
  createdAt: string
  updatedAt?: string
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  total?: number
  pagination?: {
    current: number
    pages: number
    total: number
    limit: number
  }
}

export interface Filters {
  categories: string[]
  cuisines: string[]
  rating: string
  price: string
  isAvailable?: boolean
  isPopular?: boolean
  search?: string
}

export interface ApiError {
  message: string
  status: number
  errors?: any[]
}