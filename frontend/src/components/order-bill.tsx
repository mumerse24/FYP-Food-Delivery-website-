import React from "react"
import { format } from "date-fns"
import {
    Package, MapPin, Phone, Mail, User,
    CreditCard, Receipt, Info
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Order } from "@/types"

interface OrderBillProps {
    order: Order
}

export const OrderBill: React.FC<OrderBillProps> = ({ order }) => {
    const formatPrice = (amount: number) => {
        return new Intl.NumberFormat('en-PK', {
            style: 'currency',
            currency: 'PKR',
            minimumFractionDigits: 0
        }).format(amount).replace('PKR', 'Rs.')
    }

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case "delivered":
                return "bg-green-100 text-green-700 border-green-200"
            case "cancelled":
            case "rejected":
                return "bg-red-100 text-red-700 border-red-200"
            case "pending":
                return "bg-yellow-100 text-yellow-700 border-yellow-200"
            case "confirmed":
                return "bg-blue-100 text-blue-700 border-blue-200"
            default:
                return "bg-gray-100 text-gray-700 border-gray-200"
        }
    }

    return (
        <div className="bg-white p-6 max-w-2xl mx-auto border rounded-xl shadow-sm">
            {/* Header */}
            <div className="flex justify-between items-start mb-6 pb-6 border-b">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Receipt className="w-6 h-6 text-amber-600" />
                        <h2 className="text-2xl font-bold text-gray-900">Order Receipt</h2>
                    </div>
                    <p className="text-gray-500 font-mono text-sm">Order ID: #{order.orderNumber || order._id}</p>
                </div>
                <div className="text-right">
                    <Badge className={getStatusColor(order.status)}>
                        {order.status.toUpperCase()}
                    </Badge>
                    <p className="text-xs text-gray-400 mt-2">
                        {format(new Date(order.createdAt), "MMM dd, yyyy • h:mm a")}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* Customer & Delivery Info */}
                <div className="space-y-4">
                    <div>
                        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <User className="w-4 h-4" /> Customer Details
                        </h3>
                        <div className="space-y-1">
                            <p className="font-semibold text-gray-900">
                                {order.contactInfo?.fullName || (typeof order.customer === 'object' ? order.customer.name : 'Customer')}
                            </p>
                            <p className="text-sm text-gray-600 flex items-center gap-2">
                                <Phone className="w-3 h-3" /> {order.contactInfo?.phone}
                            </p>
                            <p className="text-sm text-gray-600 flex items-center gap-2">
                                <Mail className="w-3 h-3" /> {order.contactInfo?.email}
                            </p>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <MapPin className="w-4 h-4" /> Delivery Address
                        </h3>
                        <div className="text-sm text-gray-600 space-y-1">
                            <p className="font-medium text-gray-900">{order.deliveryAddress?.street}</p>
                            <p>{order.deliveryAddress?.city}, {order.deliveryAddress?.state} {order.deliveryAddress?.zipCode}</p>
                            {order.deliveryAddress?.instructions && (
                                <div className="mt-2 p-2 bg-blue-50 rounded text-blue-700 text-xs flex items-start gap-2">
                                    <Info className="w-3 h-3 mt-0.5 shrink-0" />
                                    <span>{order.deliveryAddress.instructions}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Order Info */}
                <div className="space-y-4">
                    <div>
                        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <Package className="w-4 h-4" /> Order Summary
                        </h3>
                        <div className="space-y-1 text-sm text-gray-600">
                            <p className="flex justify-between">
                                <span>Restaurant:</span>
                                <span className="font-medium text-gray-900">{typeof order.restaurant === 'object' ? order.restaurant.name : 'Restaurant'}</span>
                            </p>
                            <p className="flex justify-between">
                                <span>Order Type:</span>
                                <span className="capitalize">{order.orderType}</span>
                            </p>
                            <p className="flex justify-between">
                                <span>Date:</span>
                                <span>{format(new Date(order.createdAt), "MMM dd, yyyy")}</span>
                            </p>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <CreditCard className="w-4 h-4" /> Payment Status
                        </h3>
                        <div className="space-y-1 text-sm text-gray-600">
                            <p className="flex justify-between">
                                <span>Method:</span>
                                <span className="font-medium text-gray-900">{order.paymentInfo?.method}</span>
                            </p>
                            <p className="flex justify-between">
                                <span>Status:</span>
                                <Badge variant="outline" className="text-[10px] h-5 py-0">
                                    {order.paymentInfo?.status}
                                </Badge>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Items Table */}
            <div className="mb-6 mb-8">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Ordered Items</h3>
                <div className="space-y-3">
                    {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-start py-2">
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs shrink-0">
                                    {item.quantity}x
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">{item.name}</p>
                                    {item.specialInstructions && (
                                        <p className="text-xs text-gray-500 italic">Note: {item.specialInstructions}</p>
                                    )}
                                </div>
                            </div>
                            <p className="font-semibold text-gray-900">{formatPrice(item.itemTotal)}</p>
                        </div>
                    ))}
                </div>
            </div>

            <Separator className="my-6" />

            {/* Totals */}
            <div className="space-y-3 max-w-[250px] ml-auto">
                <div className="flex justify-between text-sm text-gray-600">
                    <span>Subtotal</span>
                    <span>{formatPrice(order.pricing.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                    <span>Delivery Fee</span>
                    <span>{formatPrice(order.pricing.deliveryFee)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                    <span>Service Fee</span>
                    <span>{formatPrice(order.pricing.serviceFee)}</span>
                </div>
                {order.pricing.tax > 0 && (
                    <div className="flex justify-between text-sm text-gray-600">
                        <span>Tax</span>
                        <span>{formatPrice(order.pricing.tax)}</span>
                    </div>
                )}
                {order.pricing.discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600 font-medium">
                        <span>Discount</span>
                        <span>-{formatPrice(order.pricing.discount)}</span>
                    </div>
                )}
                <Separator className="my-2" />
                <div className="flex justify-between text-lg font-bold text-gray-900">
                    <span>Total</span>
                    <span className="text-amber-600">{formatPrice(order.pricing.total)}</span>
                </div>
            </div>

            {/* Footer Note */}
            <div className="mt-12 text-center text-gray-400 text-xs">
                <p>Thank you for ordering with us!</p>
                <p className="mt-1">Generated on {format(new Date(), "PPpp")}</p>
            </div>
        </div>
    )
}
