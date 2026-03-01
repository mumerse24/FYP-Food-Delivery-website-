"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAppSelector, useAppDispatch } from "@/store/hooks"
import { clearCart, clearCartServer } from "@/store/slices/cartSlice"
import { toast } from "sonner"
import { ArrowLeft, CreditCard, Wallet, MapPin, Clock, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export default function CheckoutPage() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const cart = useAppSelector((state) => state.cart)
  const [loading, setLoading] = useState(false)

  // Form state
  // OLD (replace with this):
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    address: "",
    city: "",
    deliveryInstructions: "",
    paymentMethod: "cash",
    deliveryTime: "30",
    // ✅ NEW FIELDS FOR PAYMENTS
    mobileNumber: "", // For JazzCash/EasyPaisa
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardName: ""
  })

  // Delivery time options
  const deliveryTimes = [
    { value: "30", label: "30 minutes (Fastest)" },
    { value: "45", label: "45 minutes" },
    { value: "60", label: "1 hour" },
    { value: "90", label: "1.5 hours" },
  ]

  // Payment methods
  const paymentMethods = [
    { id: "cash", label: "Cash on Delivery", icon: <Wallet className="w-4 h-4" /> },
    { id: "card", label: "Credit/Debit Card", icon: <CreditCard className="w-4 h-4" /> },
    { id: "jazzcash", label: "JazzCash", icon: <div className="w-4 h-4 bg-green-500 text-white flex items-center justify-center rounded text-xs">J</div> },
    { id: "easypaisa", label: "EasyPaisa", icon: <div className="w-4 h-4 bg-blue-500 text-white flex items-center justify-center rounded text-xs">E</div> },
  ]

  // Calculate totals
  const calculateTotals = () => {
    const subtotal = cart.totalAmount
    const tax = subtotal * 0.15
    const deliveryFee = 150.00
    const discount = subtotal > 1000 ? 100 : 0

    return {
      subtotal: Number(subtotal.toFixed(2)),
      tax: Number(tax.toFixed(2)),
      deliveryFee: Number(deliveryFee.toFixed(2)),
      discount: Number(discount.toFixed(2)),
      total: Number((subtotal + tax + deliveryFee - discount).toFixed(2))
    }
  }

  const totals = calculateTotals()

  // Handle form input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }
  // ✅ NEW FUNCTION: Handle radio button change
  const [showPhoneInput, setShowPhoneInput] = useState(false)
  const [showCardInput, setShowCardInput] = useState(false)
  // Handle radio change for payment method
  const handleRadioChange = (value: string) => {
    setFormData(prev => ({ ...prev, paymentMethod: value }))

    // Show/hide additional inputs based on selection
    if (value === "jazzcash" || value === "easypaisa") {
      setShowPhoneInput(true)
      setShowCardInput(false)
    } else if (value === "card") {
      setShowCardInput(true)
      setShowPhoneInput(false)
    } else {
      setShowPhoneInput(false)
      setShowCardInput(false)
    }
  }
  // Handle select change for delivery time
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, deliveryTime: e.target.value }))
  }

  // Place order
  const handlePlaceOrder = async () => {
    // Validation
    if (!formData.fullName.trim()) {
      toast.error("Please enter your full name")
      return
    }
    if (!formData.phone.trim() || formData.phone.length < 11) {
      toast.error("Please enter a valid phone number")
      return
    }
    if (!formData.address.trim()) {
      toast.error("Please enter your delivery address")
      return
    }
    if (!formData.city.trim()) {
      toast.error("Please enter your city")
      return
    }
    if (cart.items.length === 0) {
      toast.error("Your cart is empty!")
      return
    }

    setLoading(true)

    try {
      // Prepare order data
      const orderData = {
        customer: {
          fullName: formData.fullName,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          deliveryInstructions: formData.deliveryInstructions,
        },
        items: cart.items,
        totals: {
          subtotal: totals.subtotal,
          tax: totals.tax,
          deliveryFee: totals.deliveryFee,
          discount: totals.discount,
          total: totals.total,
        },
        paymentMethod: formData.paymentMethod,
        deliveryTime: formData.deliveryTime,
        restaurantId: cart.restaurantId,
      }

      console.log("Placing order:", orderData)

      // Here you would call your backend API
      // const response = await api.post("/orders", orderData)

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Clear cart after successful order
      await dispatch(clearCartServer()).unwrap()
      dispatch(clearCart())

      toast.success("🎉 Order placed successfully!")

      // Redirect to order confirmation
      navigate("/order-confirmation", {
        state: {
          orderNumber: `ORD-${Date.now()}`,
          estimatedTime: `${formData.deliveryTime} minutes`,
          customerName: formData.fullName,
          totalAmount: totals.total
        }
      })

    } catch (error) {
      console.error("Order placement failed:", error)
      toast.error("Failed to place order. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // If cart is empty
  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 pt-20">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <Card className="text-center">
            <CardHeader>
              <CardTitle className="text-2xl">Your cart is empty</CardTitle>
              <CardDescription>
                Add some delicious items to your cart first!
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex justify-center">
              <Button onClick={() => navigate("/menu")}>
                <ArrowLeft className="mr-2 w-4 h-4" />
                Back to Menu
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 pt-20 pb-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 w-4 h-4" />
            Back to Cart
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
          <p className="text-gray-600 mt-2">Complete your order</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Delivery Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Delivery Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      placeholder="John Doe"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      name="phone"
                      placeholder="03XX XXXXXXX"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Delivery Address *</Label>
                  <textarea
                    id="address"
                    name="address"
                    placeholder="House #, Street, Area"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      name="city"
                      placeholder="e.g., Karachi"
                      value={formData.city}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deliveryTime">Delivery Time</Label>
                    <select
                      id="deliveryTime"
                      value={formData.deliveryTime}
                      onChange={handleSelectChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    >
                      {deliveryTimes.map((time) => (
                        <option key={time.value} value={time.value}>
                          {time.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deliveryInstructions">Delivery Instructions (Optional)</Label>
                  <textarea
                    id="deliveryInstructions"
                    name="deliveryInstructions"
                    placeholder="e.g., Call before delivery, Leave at gate, etc."
                    value={formData.deliveryInstructions}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {paymentMethods.map((method) => (
                    <div key={method.id} className="flex items-center space-x-3">
                      <input
                        type="radio"
                        id={method.id}
                        name="paymentMethod"
                        value={method.id}
                        checked={formData.paymentMethod === method.id}
                        onChange={() => handleRadioChange(method.id)}
                        className="w-4 h-4 text-amber-600 focus:ring-amber-500"
                      />
                      <Label
                        htmlFor={method.id}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        {method.icon}
                        {method.label}
                      </Label>
                    </div>
                  ))}
                </div>
                {/* 👇👇👇 YAHAN PASTE KARNA HAI 👇👇👇 */}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Order Summary */}
          <div className="space-y-6">
            {/* Order Summary */}
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
                <CardDescription>{cart.totalItems} item{cart.totalItems !== 1 ? 's' : ''} in cart</CardDescription>
              </CardHeader>

              <CardContent>
                {/* Cart Items */}
                <div className="space-y-3 mb-6 max-h-60 overflow-y-auto pr-2">
                  {cart.items.map((item) => (
                    <div key={item.menuItem._id} className="flex justify-between items-center py-2 border-b">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.menuItem.name}</p>
                        <p className="text-xs text-gray-500">
                          {item.quantity} × Rs. {item.menuItem.price.toFixed(2)}
                        </p>
                      </div>
                      <p className="font-medium">
                        Rs. {(item.menuItem.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span>Rs. {totals.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax (15%)</span>
                    <span>Rs. {totals.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Delivery Fee</span>
                    <span>Rs. {totals.deliveryFee.toFixed(2)}</span>
                  </div>
                  {totals.discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount</span>
                      <span>- Rs. {totals.discount.toFixed(2)}</span>
                    </div>
                  )}

                  <Separator />

                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>Rs. {totals.total.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>

              <CardFooter>
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handlePlaceOrder}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing Order...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 w-4 h-4" />
                      Place Order
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>

            {/* Security Note */}
            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="bg-amber-100 p-2 rounded-full">
                    <CheckCircle className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-amber-800">Secure Checkout</h4>
                    <p className="text-sm text-amber-700 mt-1">
                      Your payment information is secure. We don't store your credit card details.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}