"use client"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, Plus, Minus, Trash2, ArrowRight } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useState } from "react"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import {
  updateQuantity,
  removeFromCart,
  clearCart,
  clearCartServer,
  addToCartServer,
  syncCartWithServer,
  removeFromCartServer
} from "@/store/slices/cartSlice"
import type { CartItem as CartItemType } from "@/types"
import { toast } from "sonner" // Optional: for notifications

export function CartSidebar() {
  const dispatch = useAppDispatch()
  const cartState = useAppSelector((state) => state.cart)
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)

  const { items, totalAmount, totalItems, isLoading: cartLoading } = cartState

  // Update quantity - sync with server
  // ✅ SAHI FUNCTION


  // Clear cart - sync with server
  const handleClearCart = async () => {
    if (!confirm("Are you sure you want to clear your cart?")) return

    setLoading(true)
    try {
      // Clear from server first using async thunk
      const resultAction = await dispatch(clearCartServer())

      if (clearCartServer.fulfilled.match(resultAction)) {
        // Only clear locally if server operation was successful
        dispatch(clearCart())
        toast.success("Cart cleared successfully")
      } else {
        toast.error("Failed to clear cart on server")
      }

    } catch (err) {
      console.error("Failed to clear cart", err)
      toast.error("Failed to clear cart")
    } finally {
      setLoading(false)
    }
  }

  // Alternative: Simplified version without unwrap()
  const handleRemoveItemSimple = (menuItemId: string) => {
    setLoading(true)
    dispatch(removeFromCart(menuItemId))

    // Fire and forget server call
    dispatch(removeFromCartServer(menuItemId))
      .then(() => {
        setLoading(false)
      })
      .catch((err) => {
        console.error("Failed to remove from server:", err)
        toast.error("Failed to remove item from server")
        // Sync to get correct state
        dispatch(syncCartWithServer())
        setLoading(false)
      })
  }

  // Navigate to checkout
  const handleCheckout = () => {
    if (items.length === 0) {
      toast.error("Your cart is empty!")
      return
    }
    setSheetOpen(false)
    navigate("/checkout")
  }

  // Handle opening cart - sync with server
  const handleOpenCart = async () => {
    setSheetOpen(true)
    try {
      // Sync cart with server when opening
      const resultAction = await dispatch(syncCartWithServer())

      if (syncCartWithServer.rejected.match(resultAction)) {
        toast.warning("Using local cart data")
      }
    } catch (err) {
      console.error("Failed to sync cart", err)
      // Continue with local data
    }
  }

  // Calculate totals
  const calculateTotals = () => {
    const subtotal = totalAmount
    const tax = subtotal * 0.15
    const deliveryFee = 150.00
    const discount = 30.00

    return {
      subtotal,
      tax: Number(tax.toFixed(2)),
      deliveryFee,
      discount,
      total: Number((subtotal + tax + deliveryFee - discount).toFixed(2))
    }
  }

  const totals = calculateTotals()
  const isAnyLoading = loading || cartLoading

  return (
    <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          onClick={handleOpenCart}
        >
          <ShoppingCart className="w-5 h-5" />
          {totalItems > 0 && (
            <Badge className="absolute -top-2 -right-2 w-5 h-5 rounded-full p-0 flex items-center justify-center text-xs bg-primary text-primary-foreground">
              {totalItems}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Your Cart ({totalItems} {totalItems === 1 ? 'item' : 'items'})
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="text-center py-8 flex flex-col items-center justify-center h-full">
              <ShoppingCart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">Your cart is empty</p>
              <Button
                variant="outline"
                onClick={() => {
                  setSheetOpen(false)
                  navigate("/menu")
                }}
                disabled={isAnyLoading}
              >
                Browse Menu
              </Button>
            </div>
          ) : (
            <div className="space-y-4 pb-4">
              {items.map((item: CartItemType) => {
                if (!item.menuItem) return null;

                return (
                  <div key={item.menuItem._id} className="flex gap-3 p-3 border rounded-lg bg-card">
                    <div className="w-16 h-16 flex-shrink-0">
                      <img
                        src={item.menuItem.image || "/placeholder.svg"}
                        alt={item.menuItem.name}
                        className="w-full h-full object-cover rounded"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{item.menuItem.name}</h4>
                      <p className="text-primary font-semibold">
                        Rs. {(item.menuItem.price * item.quantity).toFixed(2)}
                        <span className="text-xs text-muted-foreground ml-2">
                          (Rs. {item.menuItem.price.toFixed(2)} each)
                        </span>
                      </p>
                      {item.specialInstructions && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          Note: {item.specialInstructions}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="w-7 h-7"
                            onClick={() => {
                              const newQuantity = item.quantity - 1;

                              if (newQuantity < 1) {
                                // Remove item if quantity becomes 0
                                handleRemoveItemSimple(item.menuItem._id)
                              } else {
                                // ✅ LOCAL UPDATE
                                dispatch(updateQuantity({
                                  menuItemId: item.menuItem._id,
                                  quantity: newQuantity
                                }))

                                // ✅ SERVER UPDATE - Backend should handle decrement
                                const restaurantId = typeof item.menuItem.restaurant === 'object'
                                  ? item.menuItem.restaurant._id
                                  : item.menuItem.restaurant;

                                dispatch(addToCartServer({
                                  menuItemId: item.menuItem._id,
                                  quantity: -1,
                                  restaurantId
                                })).catch(err => {
                                  console.error("Server update failed:", err)
                                  dispatch(syncCartWithServer())
                                })
                              }
                            }}
                            disabled={item.quantity <= 1 || isAnyLoading}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="text-sm font-medium w-8 text-center">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="w-7 h-7"
                            onClick={() => {
                              // ✅ Quantity increase
                              const newQuantity = item.quantity + 1;

                              // LOCAL UPDATE IMMEDIATELY
                              dispatch(updateQuantity({
                                menuItemId: item.menuItem._id,
                                quantity: newQuantity
                              }))

                              // SERVER UPDATE (fire and forget)
                              const restaurantId = typeof item.menuItem.restaurant === 'object'
                                ? item.menuItem.restaurant._id
                                : item.menuItem.restaurant;

                              dispatch(addToCartServer({
                                menuItemId: item.menuItem._id,
                                quantity: 1,
                                restaurantId
                              })).catch(err => {
                                console.error("Server update failed:", err)
                                // Sync from server to fix state
                                dispatch(syncCartWithServer())
                              })
                            }}
                            disabled={isAnyLoading}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-7 h-7 text-destructive hover:text-destructive"
                          onClick={() => handleRemoveItemSimple(item.menuItem._id)}
                          disabled={isAnyLoading}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t pt-4 mt-auto bg-background">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Subtotal:</span>
                <span className="font-bold text-lg text-primary">
                  Rs. {totals.subtotal.toFixed(2)}
                </span>
              </div>

              <div className="text-sm text-muted-foreground space-y-1">
                <div className="flex justify-between">
                  <span>Tax (15% est.):</span>
                  <span>Rs. {totals.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee:</span>
                  <span>Rs. {totals.deliveryFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Discount:</span>
                  <span>- Rs. {totals.discount.toFixed()}</span>
                </div>
              </div>

              <div className="border-t pt-2">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Estimated Total:</span>
                  <span>Rs. {totals.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 mt-4">
              <Button
                className="w-full"
                size="lg"
                onClick={handleCheckout}
                disabled={items.length === 0 || isAnyLoading}
              >
                {isAnyLoading ? "Processing..." : "Proceed to Checkout"}
                {!isAnyLoading && <ArrowRight className="ml-2 w-4 h-4" />}
              </Button>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setSheetOpen(false)
                    navigate("/menu")
                  }}
                  disabled={isAnyLoading}
                >
                  Add More Items
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={handleClearCart}
                  disabled={isAnyLoading}
                >
                  Clear Cart
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center mt-2">
                Prices may change based on location and time
              </p>
            </div>
          </div>
        )}

        {/* Loading overlay */}
        {isAnyLoading && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}