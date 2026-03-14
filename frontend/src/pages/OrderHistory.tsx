"use client"

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { format } from "date-fns"
import {
    Package, XCircle,
    ChevronRight, RefreshCw,
    Search, ShoppingBag
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog"
import { OrderBill } from "@/components/order-bill"
import { toast } from "sonner"
import api from "@/services/api"
import { Header } from "@/components/header"

import { Order } from "@/types"

export default function OrderHistoryPage() {
    const navigate = useNavigate()
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isModifyModalOpen, setIsModifyModalOpen] = useState(false)
    const [modifyItems, setModifyItems] = useState<any[]>([])
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        fetchOrders()
    }, [])

    const fetchOrders = async () => {
        try {
            setLoading(true)
            const response = await api.get("/orders")
            if (response.data.success) {
                setOrders(response.data.data)
            }
        } catch (error) {
            console.error("Failed to fetch orders:", error)
            toast.error("Failed to load your order history")
        } finally {
            setLoading(false)
        }
    }

    const handleCancelOrder = async (orderId: string) => {
        if (!window.confirm("Are you sure you want to cancel this order?")) return

        try {
            const response = await api.post(`/orders/${orderId}/cancel`, {
                reason: "Cancelled by customer"
            })
            if (response.data.success) {
                toast.success("Order cancelled successfully")
                fetchOrders() // Refresh list
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to cancel order")
        }
    }

    const handleModifyOrder = async () => {
        if (!selectedOrder) return

        try {
            setIsSaving(true)
            const response = await api.put(`/orders/${selectedOrder._id}`, {
                items: modifyItems
            })
            if (response.data.success) {
                toast.success("Order modified successfully")
                setIsModifyModalOpen(false)
                fetchOrders()
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to modify order")
        } finally {
            setIsSaving(false)
        }
    }

    const updateModifyQuantity = (itemId: string, delta: number) => {
        setModifyItems(prev => prev.map(item => {
            if (item.menuItem._id === itemId || item.menuItem === itemId) {
                const newQty = Math.max(1, item.quantity + delta)
                return { ...item, quantity: newQty, itemTotal: (item.price || item.menuItem.price) * newQty }
            }
            return item
        }))
    }

    const removeItemFromModify = (itemId: string) => {
        if (modifyItems.length <= 1) {
            toast.error("An order must have at least one item. Consider cancelling the order instead.")
            return
        }
        setModifyItems(prev => prev.filter(item => (item.menuItem._id || item.menuItem) !== itemId))
    }

    const getStatusBadge = (status: string) => {
        switch (status.toLowerCase()) {
            case "delivered":
                return { label: "Delivered", className: "bg-green-100 text-green-700 border-green-200" }
            case "cancelled":
            case "rejected":
                return { label: status.charAt(0).toUpperCase() + status.slice(1), className: "bg-red-100 text-red-700 border-red-200" }
            case "pending":
                return { label: "Pending", className: "bg-yellow-100 text-yellow-700 border-yellow-200" }
            case "confirmed":
                return { label: "Confirmed", className: "bg-blue-100 text-blue-700 border-blue-200" }
            default:
                return { label: status.charAt(0).toUpperCase() + status.slice(1), className: "bg-gray-100 text-gray-700 border-gray-200" }
        }
    }

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-PK', {
            style: 'currency',
            currency: 'PKR',
            minimumFractionDigits: 0
        }).format(price).replace('PKR', 'Rs.')
    }

    const filteredOrders = orders.filter(order => {
        const restaurantName = typeof order.restaurant === 'object' ? order.restaurant.name : ""
        return order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            restaurantName.toLowerCase().includes(searchTerm.toLowerCase())
    })

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header />

            <main className="flex-1 container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto">
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
                            <p className="text-gray-600 mt-1">Track and manage your order history</p>
                        </div>
                        <Button variant="outline" onClick={fetchOrders} disabled={loading}>
                            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                    </div>

                    {/* Search & Filter */}
                    <Card className="mb-6">
                        <CardContent className="p-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <Input
                                    placeholder="Search by order number or restaurant..."
                                    className="pl-10 h-12 rounded-xl"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Orders List */}
                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-32 bg-gray-200 animate-pulse rounded-xl" />
                            ))}
                        </div>
                    ) : filteredOrders.length === 0 ? (
                        <Card className="text-center py-12">
                            <CardContent>
                                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                    <ShoppingBag className="w-8 h-8 text-gray-400" />
                                </div>
                                <h3 className="text-xl font-semibold mb-2">No orders found</h3>
                                <p className="text-gray-500 mb-6">You haven't placed any orders yet or none match your search.</p>
                                <Button onClick={() => navigate("/menu")}>
                                    Start Ordering
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {filteredOrders.map(order => {
                                const badge = getStatusBadge(order.status)
                                const total = order.pricing?.total || 0
                                const restaurantName = typeof order.restaurant === 'object' ? order.restaurant.name : "Restaurant"

                                return (
                                    <Card key={order._id} className="overflow-hidden hover:shadow-md transition-shadow border-0 shadow-sm">
                                        <div className="p-4 md:p-6">
                                            <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
                                                <div className="flex items-start gap-4">
                                                    <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                                                        <Package className="w-6 h-6 text-amber-600" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h3 className="font-bold text-lg text-gray-900">{restaurantName}</h3>
                                                            <Badge variant="outline" className={badge.className}>
                                                                {badge.label}
                                                            </Badge>
                                                        </div>
                                                        <p className="text-sm text-gray-500 font-medium font-mono">
                                                            #{order.orderNumber}
                                                        </p>
                                                        <p className="text-xs text-gray-400 mt-1">
                                                            {format(new Date(order.createdAt), "EEE, MMM dd • h:mm a")}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-start gap-2">
                                                    <p className="text-xl font-bold text-gray-900">{formatPrice(total)}</p>
                                                    <p className="text-xs text-gray-500">{order.items.length} items</p>
                                                </div>
                                            </div>

                                            <Separator className="my-4" />

                                            <div className="flex flex-wrap items-center justify-between gap-4">
                                                <div className="flex -space-x-2 overflow-hidden">
                                                    {order.items.slice(0, 3).map((item, idx) => (
                                                        <div key={idx} className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-600">
                                                            {item.quantity}x
                                                        </div>
                                                    ))}
                                                    {order.items.length > 3 && (
                                                        <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-amber-50 flex items-center justify-center text-[10px] font-bold text-amber-600">
                                                            +{order.items.length - 3}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="border-amber-200 text-amber-700 hover:bg-amber-50"
                                                        onClick={() => {
                                                            setSelectedOrder(order)
                                                            setIsModalOpen(true)
                                                        }}
                                                    >
                                                        View Receipt
                                                    </Button>
                                                    {order.status === "pending" && (
                                                        <>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="border-amber-500 text-amber-600 hover:bg-amber-50"
                                                                onClick={() => {
                                                                    setSelectedOrder(order)
                                                                    setModifyItems([...order.items])
                                                                    setIsModifyModalOpen(true)
                                                                }}
                                                            >
                                                                Modify Items
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="text-red-600 border-red-200 hover:bg-red-50"
                                                                onClick={() => handleCancelOrder(order._id)}
                                                            >
                                                                <XCircle className="w-4 h-4 mr-2" />
                                                                Cancel Order
                                                            </Button>
                                                        </>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                                        onClick={() => navigate(`/rate-order/${order._id}`)} // Placeholder navigation
                                                        disabled={order.status !== "delivered"}
                                                    >
                                                        Track/Rate
                                                        <ChevronRight className="w-4 h-4 ml-1" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                )
                            })}
                        </div>
                    )}
                </div>
            </main>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 border-none bg-transparent shadow-none">
                    {selectedOrder && (
                        <div className="relative">
                            <OrderBill order={selectedOrder} />
                            <div className="bg-white p-4 border-t rounded-b-xl flex justify-end px-6 pb-6">
                                <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                                    Close
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={isModifyModalOpen} onOpenChange={setIsModifyModalOpen}>
                <DialogContent className="max-w-md bg-white rounded-2xl p-6">
                    <CardHeader className="px-0 pt-0">
                        <CardTitle>Modify Order Items</CardTitle>
                        <CardDescription>Adjust quantities or remove items from your pending order.</CardDescription>
                    </CardHeader>
                    <div className="space-y-4 my-4 max-h-[50vh] overflow-y-auto pr-2">
                        {modifyItems.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between py-2 border-b">
                                <div className="flex-1">
                                    <p className="font-medium">{item.name}</p>
                                    <p className="text-sm text-gray-500">Rs. {item.price || item.menuItem.price}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center border rounded-lg">
                                        <button
                                            className="px-2 py-1 hover:bg-gray-100"
                                            onClick={() => updateModifyQuantity(item.menuItem._id || item.menuItem, -1)}
                                        >
                                            -
                                        </button>
                                        <span className="px-3 font-medium">{item.quantity}</span>
                                        <button
                                            className="px-2 py-1 hover:bg-gray-100"
                                            onClick={() => updateModifyQuantity(item.menuItem._id || item.menuItem, 1)}
                                        >
                                            +
                                        </button>
                                    </div>
                                    <button
                                        className="text-red-500 hover:text-red-700"
                                        onClick={() => removeItemFromModify(item.menuItem._id || item.menuItem)}
                                    >
                                        <XCircle className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-3 mt-6">
                        <Button variant="outline" className="flex-1" onClick={() => setIsModifyModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button className="flex-1 bg-amber-500 hover:bg-amber-600" onClick={handleModifyOrder} disabled={isSaving}>
                            {isSaving ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
