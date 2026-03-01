"use client"

import { useLocation, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Clock, MapPin, Phone, Home } from "lucide-react"

export default function OrderConfirmationPage() {
  const location = useLocation()
  const navigate = useNavigate()
  
  const { 
    orderNumber = `ORD-${Date.now()}`, 
    estimatedTime = "30-45 minutes",
    customerName = "Customer",
    totalAmount = "0.00"
  } = location.state || {}

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white pt-20">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Card className="border-green-200">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <CardTitle className="text-3xl text-green-700">Order Confirmed!</CardTitle>
            <CardDescription className="text-lg">
              Thank you, {customerName}! Your order has been placed.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Order Details */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-600">Order Number:</span>
                <span className="font-bold text-gray-900">{orderNumber}</span>
              </div>
              
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Total Amount:</span>
                <span className="font-bold text-green-600">Rs. {totalAmount}</span>
              </div>
              
              <div className="flex items-center gap-3 text-gray-600 mt-4">
                <Clock className="w-5 h-5" />
                <span>Estimated delivery: <strong>{estimatedTime}</strong></span>
              </div>
            </div>

            {/* Next Steps */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">What's next?</h3>
              
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 p-2 rounded-full mt-1">
                  <Phone className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium">We'll call you</h4>
                  <p className="text-sm text-gray-600">Our delivery team will call you to confirm the order.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="bg-amber-100 p-2 rounded-full mt-1">
                  <MapPin className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <h4 className="font-medium">Track your order</h4>
                  <p className="text-sm text-gray-600">You'll receive SMS updates about your order status.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="bg-purple-100 p-2 rounded-full mt-1">
                  <Home className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-medium">Get ready for delivery</h4>
                  <p className="text-sm text-gray-600">Please keep your phone handy for the delivery person.</p>
                </div>
              </div>
            </div>

            {/* Support Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Need help?</h4>
              <p className="text-sm text-gray-600">
                Contact our customer support at <strong>021-12345678</strong> or email <strong>support@foodapp.com</strong>
              </p>
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col gap-3">
            <Button 
              className="w-full" 
              onClick={() => navigate("/menu")}
            >
              Order More Food
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate("/")}
            >
              Back to Home
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}