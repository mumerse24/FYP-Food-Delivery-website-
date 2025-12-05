"use client"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, Plus, Minus, Trash2, ArrowRight } from "lucide-react"
import { useCart } from "@/lib/cart-context"
import { useNavigate } from "react-router-dom" // ✅ Import useNavigate

export function CartSidebar() {
  const { state, dispatch } = useCart()
  const navigate = useNavigate() // ✅ Create navigate function

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity < 1) return
    dispatch({ type: "UPDATE_QUANTITY", payload: { id, quantity } })
  }

  const removeItem = (id: string) => {
    dispatch({ type: "REMOVE_ITEM", payload: id })
  }

  const clearCart = () => {
    dispatch({ type: "CLEAR_CART" })
  }

  // ✅ Function to handle checkout navigation
  const handleCheckout = () => {
    if (state.items.length === 0) {
      alert("Your cart is empty!")
      return
    }
    
    // Navigate to checkout page
    navigate("/checkout")
    
    // Close the cart sidebar (if needed)
    // You might need to add ref or state management for this
    const sheet = document.querySelector('[data-state="open"]')
    if (sheet) {
      // Close logic depends on your sheet implementation
    }
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <ShoppingCart className="w-5 h-5" />
          {state.itemCount > 0 && (
            <Badge className="absolute -top-2 -right-2 w-5 h-5 rounded-full p-0 flex items-center justify-center text-xs bg-primary text-primary-foreground">
              {state.itemCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Your Cart ({state.itemCount} items)
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 flex-1 overflow-y-auto">
          {state.items.length === 0 ? (
            <div className="text-center py-8 flex flex-col items-center justify-center h-full">
              <ShoppingCart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">Your cart is empty</p>
              <Button variant="outline" onClick={() => navigate("/menu")}>
                Browse Menu
              </Button>
            </div>
          ) : (
            <div className="space-y-4 pb-4">
              {state.items.map((item) => (
                <div key={item.id} className="flex gap-3 p-3 border rounded-lg bg-card">
                  <div className="w-16 h-16 flex-shrink-0">
                    <img
                      src={item.image || "/placeholder.svg"}
                      alt={item.name}
                      className="w-full h-full object-cover rounded"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">{item.name}</h4>
                    <p className="text-primary font-semibold">Rs. {item.price.toFixed(2)}</p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="w-7 h-7"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="w-7 h-7"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-7 h-7 text-destructive hover:text-destructive"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {state.items.length > 0 && (
          <div className="border-t pt-4 mt-auto bg-background">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Subtotal:</span>
                <span className="font-bold text-lg text-primary">Rs. {state.total.toFixed(2)}</span>
              </div>
              
              {/* Tax and Delivery Fee Estimation */}
              <div className="text-sm text-muted-foreground space-y-1">
                <div className="flex justify-between">
                  <span>Tax (15% est.):</span>
                  <span>Rs. {(state.total * 0.15).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee:</span>
                  <span>Rs. 150.00</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Discount:</span>
                  <span>- Rs. 510.00</span>
                </div>
              </div>
              
              <div className="border-t pt-2">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Estimated Total:</span>
                  <span>Rs. {(state.total + (state.total * 0.15) + 150 - 510).toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2 mt-4">
              {/* ✅ Updated Checkout Button */}
              <Button 
                className="w-full" 
                size="lg"
                onClick={handleCheckout}
                disabled={state.items.length === 0}
              >
                Proceed to Checkout
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1" 
                  onClick={() => navigate("/menu")}
                >
                  Add More Items
                </Button>
                <Button 
                  variant="destructive" 
                  className="flex-1" 
                  onClick={clearCart}
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
      </SheetContent>
    </Sheet>
  )
}