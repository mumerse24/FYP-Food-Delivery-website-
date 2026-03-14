import api from "./api"
import type { CartItem, ApiResponse } from "../types"

export const cartService = {
  getCart: async () => {
    const response = await api.get<ApiResponse<any>>("/cart")
    return response.data
  },

  // ✅ FIXED: restaurantId parameter add karo
  addToCart: async (
    menuItemId: string, 
    quantity: number, 
    restaurantId: string, // ✅ ADD THIS
    specialInstructions?: string
  ) => {
    const response = await api.post<ApiResponse<any>>("/cart/add", {
      menuItemId,
      quantity,
      restaurantId, // ✅ SEND TO BACKEND
      specialInstructions,
    })
    return response.data
  },

  // ✅ NOTE: Yeh "itemId" hai (cart item ka ID, menuItemId nahi)
  updateCartItem: async (itemId: string, quantity: number) => {
    const response = await api.put<ApiResponse<any>>(`/cart/update/${itemId}`, {
      quantity,
    })
    return response.data
  },

  // ✅ NOTE: Yeh bhi "itemId" hai (cart item ka ID)
  removeFromCart: async (itemId: string) => {
    const response = await api.delete<ApiResponse<any>>(`/cart/remove/${itemId}`)
    return response.data
  },

  clearCart: async () => {
    const response = await api.delete<ApiResponse<any>>("/cart/clear")
    return response.data
  },

  syncCart: async (items: CartItem[]) => {
    const response = await api.post<ApiResponse<any>>("/cart/sync", { items })
    return response.data
  },
}