import api from "./api"
import type { CartItem, ApiResponse } from "../types"

export const cartService = {
  getCart: async () => {
    const response = await api.get<ApiResponse<CartItem[]>>("/cart")
    return response.data
  },

  addToCart: async (menuItemId: string, quantity: number, specialInstructions?: string) => {
    const response = await api.post<ApiResponse<CartItem>>("/cart/add", {
      menuItemId,
      quantity,
      specialInstructions,
    })
    return response.data
  },

  updateCartItem: async (menuItemId: string, quantity: number) => {
    const response = await api.put<ApiResponse<CartItem>>(`/cart/update/${menuItemId}`, {
      quantity,
    })
    return response.data
  },

  removeFromCart: async (menuItemId: string) => {
    const response = await api.delete(`/cart/remove/${menuItemId}`)
    return response.data
  },

  clearCart: async () => {
    const response = await api.delete("/cart/clear")
    return response.data
  },

  syncCart: async (items: CartItem[]) => {
    const response = await api.post<ApiResponse<CartItem[]>>("/cart/sync", { items })
    return response.data
  },
}
