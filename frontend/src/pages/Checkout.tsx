"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAppSelector, useAppDispatch } from "@/store/hooks"
import { clearCart, clearCartServer } from "@/store/slices/cartSlice"
import { toast } from "sonner"
import { ArrowLeft, CreditCard, Wallet, MapPin, CheckCircle, Bike, ShoppingBag, UtensilsCrossed, Smartphone, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import api from "@/services/api"

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
    orderType: "delivery", // 'delivery' | 'pickup' | 'dine-in'
    // ✅ NEW FIELDS FOR PAYMENTS
    mobileNumber: "", // For JazzCash/EasyPaisa
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardName: "",
    tableNumber: "", // For Dine-in
  })

  // Order type options
  const orderTypes = [
    { value: "delivery", label: "Delivery", icon: <Bike className="w-6 h-6 mb-2" /> },
    { value: "pickup", label: "Pickup", icon: <ShoppingBag className="w-6 h-6 mb-2" /> },
    { value: "dine-in", label: "Dine-in", icon: <UtensilsCrossed className="w-6 h-6 mb-2" /> },
  ]

  // Delivery time options
  const deliveryTimes = [
    { value: "30", label: "30 minutes (Fastest)" },
    { value: "45", label: "45 minutes" },
    { value: "60", label: "1 hour" },
    { value: "90", label: "1.5 hours" },
  ]

  // Payment methods
  const paymentMethods = [
    {
      id: "cash",
      label: "Cash on Delivery",
      icon: <Wallet className="w-5 h-5 text-amber-600" />,
      color: "border-amber-500 bg-amber-50"
    },
    {
      id: "card",
      label: "Credit/Debit Card",
      icon: <CreditCard className="w-5 h-5 text-blue-600" />,
      color: "border-blue-500 bg-blue-50"
    },
    {
      id: "jazzcash",
      label: "JazzCash",
      icon: <div className="w-8 h-8 bg-[#ED1C24] text-white flex items-center justify-center rounded-lg font-bold text-[10px] shadow-sm">JC</div>,
      color: "border-red-500 bg-red-50"
    },
    {
      id: "easypaisa",
      label: "EasyPaisa",
      icon: <div className="w-8 h-8 bg-[#1B9E56] text-white flex items-center justify-center rounded-lg font-bold text-[10px] shadow-sm">EP</div>,
      color: "border-green-500 bg-green-50"
    },
  ]

  // Calculate totals
  const calculateTotals = () => {
    const subtotal = cart.totalAmount
    const tax = subtotal * 0.15
    const deliveryFee = formData.orderType === "delivery" ? 150.00 : 0
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
  // Handle radio change for payment method
  const handleRadioChange = (value: string) => {
    setFormData(prev => ({ ...prev, paymentMethod: value }))

    // Additional inputs logic removed for now as UI wasn't implemented
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
    if (formData.orderType === "delivery") {
      if (!formData.address.trim()) {
        toast.error("Please enter your delivery address")
        return
      }
      if (!formData.city.trim()) {
        toast.error("Please enter your city")
        return
      }
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
          address: formData.orderType === "delivery" ? formData.address : "N/A",
          city: formData.orderType === "delivery" ? formData.city : "N/A",
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
        orderType: formData.orderType,
        tableNumber: formData.orderType === "dine-in" ? formData.tableNumber : null,
        paymentDetails: {
          mobileNumber: formData.mobileNumber,
          cardNumber: formData.cardNumber.replace(/\s/g, '').slice(-4), // Masked
          cardName: formData.cardName
        }
      }

      console.log("Placing order:", orderData)

      // ✅ REAL API CALL to backend
      const response = await api.post("/orders", {
        restaurant: cart.restaurantId,
        items: cart.items.map(item => ({
          menuItem: item.menuItem._id,
          name: item.menuItem.name,
          price: item.menuItem.price,
          quantity: item.quantity,
          customizations: item.selectedCustomizations?.map(c => ({
            name: c.name,
            selectedOptions: [{ name: c.option, price: c.price }]
          })) || [],
          itemTotal: item.menuItem.price * item.quantity,
          specialInstructions: item.specialInstructions || ""
        })),
        deliveryAddress: {
          street: formData.address,
          city: formData.city,
          state: "N/A", // Default or extract if available
          zipCode: "N/A" // Default or extract if available
        },
        contactInfo: {
          phone: formData.phone,
          email: "customer@example.com", // Replace with actual user email from state if available
          fullName: formData.fullName
        },
        paymentInfo: {
          method: formData.paymentMethod === 'cash' ? 'Cash' :
            formData.paymentMethod === 'card' ? 'Card' : 'Digital Wallet',
          status: 'pending'
        },
        orderType: formData.orderType,
        specialInstructions: formData.deliveryInstructions,
        tableNumber: formData.orderType === "dine-in" ? formData.tableNumber : null,
        paymentDetails: {
          mobileNumber: formData.mobileNumber,
          cardNumber: formData.cardNumber.replace(/\s/g, '').slice(-4), // Masked
          cardName: formData.cardName
        }
      })

      if (response.data.success) {
        // Clear cart after successful order
        await dispatch(clearCartServer()).unwrap()
        dispatch(clearCart())

        toast.success("🎉 Order placed successfully!")

        // Redirect to order confirmation
        navigate("/order-confirmation", {
          state: {
            orderNumber: response.data.data.orderNumber,
            estimatedTime: `${formData.deliveryTime} minutes`,
            customerName: formData.fullName,
            totalAmount: totals.total
          }
        })
      } else {
        throw new Error(response.data.message || "Failed to place order")
      }

    } catch (error: any) {
      console.error("Order placement failed:", error)
      const errorMsg = error.response?.data?.message || "Failed to place order. Please try again."
      toast.error(errorMsg)
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

            {/* Order Type Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Order Type
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  {orderTypes.map((type) => (
                    <Label
                      key={type.value}
                      className={`flex flex-col items-center justify-center p-6 border-2 rounded-2xl cursor-pointer transition-all duration-300 ring-offset-2 ${formData.orderType === type.value
                        ? "border-amber-500 bg-amber-50 text-amber-700 ring-2 ring-amber-500"
                        : "border-gray-100 bg-white hover:border-amber-200 hover:bg-gray-50"
                        }`}
                    >
                      <input
                        type="radio"
                        name="orderType"
                        value={type.value}
                        checked={formData.orderType === type.value}
                        onChange={(e) => setFormData((prev) => ({ ...prev, orderType: e.target.value }))}
                        className="sr-only"
                      />
                      {type.icon}
                      <span className="font-semibold text-sm sm:text-base">{type.label}</span>
                    </Label>
                  ))}
                </div>

                {formData.orderType === "dine-in" && (
                  <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-100 flex items-center gap-4 animate-in fade-in slide-in-from-top-2">
                    <div className="bg-amber-100 p-3 rounded-full">
                      <UtensilsCrossed className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <Label htmlFor="tableNumber" className="text-amber-900 font-semibold">Table Number</Label>
                      <Input
                        id="tableNumber"
                        name="tableNumber"
                        placeholder="e.g., Table 5"
                        value={formData.tableNumber}
                        onChange={handleInputChange}
                        className="bg-white border-amber-200 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Delivery/Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  {formData.orderType === "delivery" ? "Delivery Information" : "Contact Information"}
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

                {formData.orderType === "delivery" && (
                  <>
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
                  </>
                )}
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {paymentMethods.map((method) => (
                    <div key={method.id} className="relative">
                      <input
                        type="radio"
                        id={method.id}
                        name="paymentMethod"
                        value={method.id}
                        checked={formData.paymentMethod === method.id}
                        onChange={() => handleRadioChange(method.id)}
                        className="sr-only"
                      />
                      <Label
                        htmlFor={method.id}
                        className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 ${formData.paymentMethod === method.id
                          ? method.color + " ring-2 ring-offset-1"
                          : "border-gray-100 bg-white hover:border-gray-200"
                          }`}
                      >
                        <div className={`p-2 rounded-full ${formData.paymentMethod === method.id ? 'bg-white' : 'bg-gray-50'}`}>
                          {method.icon}
                        </div>
                        <span className="font-semibold">{method.label}</span>
                        {formData.paymentMethod === method.id && (
                          <div className="ml-auto bg-white rounded-full p-0.5">
                            <CheckCircle className="w-4 h-4 text-inherit" />
                          </div>
                        )}
                      </Label>
                    </div>
                  ))}
                </div>

                {/* Conditional Payment Fields */}
                <div className="mt-6 space-y-4 animate-in fade-in zoom-in-95 duration-300">
                  {(formData.paymentMethod === "jazzcash" || formData.paymentMethod === "easypaisa") && (
                    <div className={`p-4 rounded-xl border ${formData.paymentMethod === 'jazzcash' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
                      <div className="flex items-center gap-3 mb-3">
                        <Smartphone className={`w-5 h-5 ${formData.paymentMethod === 'jazzcash' ? 'text-red-600' : 'text-green-600'}`} />
                        <h4 className="font-bold text-gray-900">Mobile Wallet Details</h4>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="mobileNumber">Registered Mobile Number</Label>
                        <div className="relative">
                          <Input
                            id="mobileNumber"
                            name="mobileNumber"
                            placeholder="03XX XXXXXXX"
                            value={formData.mobileNumber}
                            onChange={handleInputChange}
                            className="bg-white border-transparent focus:ring-amber-500 pl-10"
                          />
                          <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Button
                            className={`absolute right-1 top-1 h-8 ${formData.paymentMethod === 'jazzcash' ? 'bg-red-600' : 'bg-green-600'}`}
                            size="sm"
                          >
                            <Send className="w-3 h-3 mr-1" />
                            Verify
                          </Button>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1">
                          You will receive a push notification on your phone to complete the payment.
                        </p>
                      </div>
                    </div>
                  )}

                  {formData.paymentMethod === "card" && (
                    <div className="p-4 rounded-xl border border-blue-200 bg-blue-50 space-y-4">
                      <div className="flex items-center gap-3">
                        <CreditCard className="w-5 h-5 text-blue-600" />
                        <h4 className="font-bold text-gray-900">Card Information</h4>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cardName">Name on Card</Label>
                        <Input
                          id="cardName"
                          name="cardName"
                          placeholder="AS APPEARS ON CARD"
                          className="bg-white border-transparent focus:ring-blue-500 uppercase font-mono"
                          value={formData.cardName}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cardNumber">Card Number</Label>
                        <div className="relative">
                          <Input
                            id="cardNumber"
                            name="cardNumber"
                            placeholder="0000 0000 0000 0000"
                            className="bg-white border-transparent focus:ring-blue-500 font-mono"
                            value={formData.cardNumber}
                            onChange={handleInputChange}
                          />
                          <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="expiryDate">Expiry Date</Label>
                          <Input
                            id="expiryDate"
                            name="expiryDate"
                            placeholder="MM/YY"
                            className="bg-white border-transparent focus:ring-blue-500 text-center font-mono"
                            value={formData.expiryDate}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cvv">CVV</Label>
                          <Input
                            id="cvv"
                            name="cvv"
                            type="password"
                            placeholder="***"
                            className="bg-white border-transparent focus:ring-blue-500 text-center font-mono"
                            value={formData.cvv}
                            onChange={handleInputChange}
                            maxLength={3}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
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