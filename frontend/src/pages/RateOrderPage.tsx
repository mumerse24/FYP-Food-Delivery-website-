"use client"

import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Star, ArrowLeft, Package, CheckCircle, Clock } from "lucide-react"
import { toast } from "sonner"
import api from "@/services/api"

export default function RateOrderPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(false)
  const [orderLoading, setOrderLoading] = useState(true)
  const [order, setOrder] = useState<any>(null)
  
  // Rating states (Backend ke hisaab se)
  const [food, setFood] = useState(5) // ✅ food (required)
  const [delivery, setDelivery] = useState(5) // ✅ delivery (optional)
  const [overall, setOverall] = useState(5) // ✅ overall (required)
  const [comment, setComment] = useState("") // ✅ comment (optional)

  // Fetch order details
  useEffect(() => {
    if (id) {
      fetchOrderDetails()
    }
  }, [id])

  const fetchOrderDetails = async () => {
    try {
      setOrderLoading(true)
      const response = await api.get(`/orders/${id}`)
      setOrder(response.data.data)
    } catch (error: any) {
      console.error("Failed to fetch order:", error)
      toast.error(error.response?.data?.message || "Failed to load order details")
      navigate("/order-history")
    } finally {
      setOrderLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!id) return

    // Validation (Backend validation ke hisaab se)
    if (!food || food < 1 || food > 5) {
      toast.error("Food rating must be between 1 and 5")
      return
    }

    if (!overall || overall < 1 || overall > 5) {
      toast.error("Overall rating must be between 1 and 5")
      return
    }

    // Delivery optional hai, agar nahi hai toh food rating use karo
    const deliveryRating = delivery || food

    setLoading(true)
    try {
      // ✅ Backend ke hisaab se API call
      const response = await api.post(`/orders/${id}/rate`, {
        food,           // required (1-5)
        delivery: deliveryRating, // optional (1-5)
        overall,        // required (1-5)
        comment         // optional
      })

      toast.success("Thank you for your feedback! Your rating has been submitted.")
      
      // Wait for 2 seconds then redirect
      setTimeout(() => {
        navigate("/order-history")
      }, 2000)
      
    } catch (error: any) {
      console.error("Rating failed:", error)
      
      // Specific error messages
      if (error.response?.status === 400) {
        if (error.response?.data?.message?.includes("already rated")) {
          toast.error("You have already rated this order")
          navigate("/order-history")
        } else if (error.response?.data?.message?.includes("delivered")) {
          toast.error("You can only rate delivered orders")
          navigate("/order-history")
        } else {
          toast.error(error.response?.data?.message || "Invalid rating data")
        }
      } else if (error.response?.status === 403) {
        toast.error("You are not authorized to rate this order")
        navigate("/order-history")
      } else if (error.response?.status === 404) {
        toast.error("Order not found")
        navigate("/order-history")
      } else {
        toast.error("Failed to submit rating. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  const RatingStars = ({ rating, setRating, label, required = true }: any) => (
    <div className="space-y-2">
      <Label>
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            className="text-3xl focus:outline-none hover:scale-110 transition-transform"
            disabled={loading}
          >
            {star <= rating ? (
              <Star className="w-8 h-8 fill-amber-500 text-amber-500" />
            ) : (
              <Star className="w-8 h-8 text-gray-300 hover:text-gray-400" />
            )}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-sm text-gray-600">
        <span>Poor</span>
        <span>Excellent</span>
      </div>
      <div className="text-center">
        <span className="text-lg font-bold text-amber-600">{rating}/5</span>
        <span className="ml-2 text-sm text-gray-600">
          {rating === 1 && "Poor"}
          {rating === 2 && "Fair"}
          {rating === 3 && "Good"}
          {rating === 4 && "Very Good"}
          {rating === 5 && "Excellent"}
        </span>
      </div>
    </div>
  )

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  // Check if order is delivered (rating allowed only for delivered orders)
  const isOrderDelivered = order?.status === "delivered"

  // Check if already rated
  const isAlreadyRated = order?.rating?.ratedAt

  if (orderLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 pt-20">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading order details...</p>
          </div>
        </div>
      </div>
    )
  }

  // Check if order exists
  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 pt-20">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <Package className="w-8 h-8 text-red-400" />
              </div>
              <CardTitle className="text-2xl">Order Not Found</CardTitle>
              <CardDescription>
                The order you're trying to rate doesn't exist or you don't have access to it.
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex justify-center">
              <Button onClick={() => navigate("/order-history")}>
                Back to Order History
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    )
  }

  // Check if order can be rated
  if (!isOrderDelivered) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 pt-20">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                <Clock className="w-8 h-8 text-yellow-400" />
              </div>
              <CardTitle className="text-2xl">Order Not Yet Delivered</CardTitle>
              <CardDescription>
                You can only rate orders that have been delivered. Current status:{" "}
                <span className="font-bold capitalize">{order.status?.replace(/_/g, ' ')}</span>
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex justify-center">
              <Button onClick={() => navigate("/order-history")}>
                Back to Order History
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    )
  }

  // Check if already rated
  if (isAlreadyRated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 pt-20">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Star className="w-8 h-8 text-green-400 fill-green-400" />
              </div>
              <CardTitle className="text-2xl">Already Rated</CardTitle>
              <CardDescription>
                You have already rated this order on {formatDate(order.rating.ratedAt)}.
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex justify-center">
              <Button onClick={() => navigate("/order-history")}>
                Back to Order History
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 pt-20 pb-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/order-history")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 w-4 h-4" />
            Back to Order History
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Rate Your Order</h1>
          <p className="text-gray-600 mt-2">Share your experience to help us improve</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left - Rating Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  Rate Your Experience
                </CardTitle>
                <CardDescription>
                  Order #{order.orderNumber || id}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Food Quality (REQUIRED) */}
                <RatingStars
                  rating={food}
                  setRating={setFood}
                  label="Food Quality"
                  required={true}
                />

                <Separator />

                {/* Delivery Experience (OPTIONAL) */}
                <RatingStars
                  rating={delivery}
                  setRating={setDelivery}
                  label="Delivery Experience"
                  required={false}
                />

                <Separator />

                {/* Overall Experience (REQUIRED) */}
                <RatingStars
                  rating={overall}
                  setRating={setOverall}
                  label="Overall Experience"
                  required={true}
                />

                <Separator />

                {/* Comments (OPTIONAL) */}
                <div className="space-y-3">
                  <Label htmlFor="comment">
                    Additional Comments (Optional)
                  </Label>
                  <Textarea
                    id="comment"
                    placeholder="Tell us more about your experience. Was the food hot? Was delivery on time? Any suggestions?"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={4}
                    className="resize-none"
                    disabled={loading}
                  />
                  <p className="text-sm text-gray-500">
                    Your detailed feedback helps restaurants improve their service
                  </p>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-4">
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 w-4 h-4" />
                      Submit Rating
                    </>
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate("/order-history")}
                  disabled={loading}
                >
                  Skip Rating
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Right - Order Summary */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
                <CardDescription>
                  Delivered on {formatDate(order.actualDeliveryTime || order.createdAt)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Restaurant Info */}
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                      {order.restaurant?.logo || order.restaurant?.images?.logo ? (
                        <img
                          src={order.restaurant.logo || order.restaurant.images.logo}
                          alt={order.restaurant.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <Package className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold">{order.restaurant?.name || "Restaurant"}</h3>
                      <p className="text-sm text-gray-600">
                        {order.items?.length || 0} items • Rs. {order.pricing?.total?.toFixed(2) || "0.00"}
                      </p>
                    </div>
                  </div>

                  {/* Order Details */}
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Order Number</span>
                      <span className="font-mono">{order.orderNumber || "N/A"}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Order Type</span>
                      <span className="capitalize">{order.orderType || "delivery"}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Payment Method</span>
                      <span className="capitalize">{order.paymentInfo?.method || "Cash"}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Delivery Address</span>
                      <span className="text-right">
                        {order.deliveryAddress?.street?.substring(0, 20)}...
                      </span>
                    </div>
                  </div>

                  {/* Items Preview */}
                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-2">Items Ordered</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                      {order.items?.slice(0, 5).map((item: any, index: number) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="truncate">
                            {item.quantity} × {item.menuItem?.name || "Item"}
                          </span>
                          <span>Rs. {(item.quantity * item.price).toFixed(2)}</span>
                        </div>
                      ))}
                      {order.items?.length > 5 && (
                        <p className="text-xs text-gray-500 text-center">
                          +{order.items.length - 5} more items
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Rating Guidelines */}
            <Card className="mt-4 bg-amber-50 border-amber-200">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="bg-amber-100 p-2 rounded-full">
                    <Star className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-amber-800">Rating Guidelines</h4>
                    <ul className="text-sm text-amber-700 mt-2 space-y-1">
                      <li>• 1 Star: Very poor experience</li>
                      <li>• 2 Stars: Below expectations</li>
                      <li>• 3 Stars: Average, met expectations</li>
                      <li>• 4 Stars: Good, exceeded expectations</li>
                      <li>• 5 Stars: Excellent experience</li>
                    </ul>
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