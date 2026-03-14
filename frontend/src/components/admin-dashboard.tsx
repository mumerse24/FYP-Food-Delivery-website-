"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import {
  Users, Store, DollarSign, Clock, CheckCircle, XCircle,
  TrendingUp, AlertCircle, RefreshCw,
  Home, Bell, Moon, Sun, Bike,
  UserPlus, Utensils, Plus, MessageSquare, Star
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import { OrderBill } from "./order-bill"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import {
  fetchAdminStats,
  fetchPendingRestaurants,
  fetchAllOrders,
  fetchUsers,
  approveRestaurant,
  rejectRestaurant,
  updateOrderStatus,
  fetchAllRestaurants,
  setSelectedRestaurantId,
  fetchRiders,
  fetchAvailableRiders,
  assignRiderToOrder,
  setOrderStatus,
  setRiderStatus,
  fetchFeedbackStats,
} from "@/store/slices/adminSlice"
import type { Restaurant, Order, User } from "@/types"
import { requestForToken, onMessageListener } from "@/services/firebase"
import { toast } from "sonner"
import RestaurantMenu from "./restaurant-menu"
import { MenuItemModal } from "./menu-item-modal"
import { fetchAllMenuItems } from "@/store/slices/menuSlice"
import type { MenuItem } from "@/types"
import socketService from "@/services/socket"


export function AdminDashboard() {
  const dispatch = useAppDispatch()
  const [activeTab, setActiveTab] = useState<"overview" | "menu" | "orders" | "restaurants" | "users" | "riders" | "feedback">("overview")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [darkMode, setDarkMode] = useState(false)
  const [userSearchTerm, setUserSearchTerm] = useState("")
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false)
  const [isCreateRiderModalOpen, setIsCreateRiderModalOpen] = useState(false)
  const [newRiderData, setNewRiderData] = useState({ name: "", email: "", password: "", phone: "" })


  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({
    from: format(new Date().setDate(new Date().getDate() - 30), 'yyyy-MM-dd'),
    to: format(new Date(), 'yyyy-MM-dd')
  })

  // Menu Modal State
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false)
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null)

  // Redux State
  const {
    stats,
    pendingRestaurants,
    orders,
    users,
    riders,
    availableRiders,
    feedback,
    isLoading,
    error
  } = useAppSelector((state) => state.admin)

  // Effects
  useEffect(() => {
    loadDashboardData()
    dispatch(fetchAllRestaurants()) // ✅ Fetch restaurants on mount

    // ✅ Real-time Socket.IO Listeners
    const socket = socketService.connect()
    if (socket) {
      socket.on("orderStatusUpdated", (order: Order) => {
        dispatch(setOrderStatus(order))
        toast.info(`Order #${order.orderNumber || order._id.slice(-6)} status updated: ${order.status}`)
      })
      socket.on("riderStatusUpdated", (data: { riderId: string; status: string }) => {
        dispatch(setRiderStatus(data))
      })
    }

    // ✅ Firebase Notifications
    let unsubscribe: (() => void) | undefined;
    const setupNotifications = async () => {
      try {
        await requestForToken();
        unsubscribe = onMessageListener((payload: any) => {
          console.log("🔔 Foreground Notification Received:", payload);

          // Sound Alert
          try {
            const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
            audio.play().catch(e => console.warn("Sound play failed:", e));
          } catch (e) {
            console.error("Audio error:", e);
          }

          toast.success(payload.notification.title || "New Order!", {
            description: payload.notification.body || "A new order has been placed.",
            duration: 10000,
          });

          // Refresh dashboard data
          loadDashboardData();
        });
      } catch (err) {
        console.warn("Notification setup failed:", err);
      }
    };

    setupNotifications();

    return () => {
      if (unsubscribe) unsubscribe();
      const socket = socketService.getSocket()
      if (socket) {
        socket.off("orderStatusUpdated")
        socket.off("riderStatusUpdated")
      }
    };
  }, [dispatch])

  // Data Loading
  const loadDashboardData = () => {
    dispatch(fetchAdminStats())
    dispatch(fetchPendingRestaurants({ limit: 5 }))
    dispatch(fetchAllOrders({ limit: 20, page: 1 }))
    dispatch(fetchUsers({ limit: 100 }))
    dispatch(fetchRiders({ limit: 50 }))
    dispatch(fetchAvailableRiders())
    dispatch(fetchAllMenuItems())
    dispatch(fetchFeedbackStats())
  }

  // Restaurant Handlers
  const handleApproveRestaurant = async (restaurantId: string) => {
    await dispatch(approveRestaurant({ restaurantId, message: "Welcome to the platform!" }))
    loadDashboardData()
  }

  const handleRejectRestaurant = async (restaurantId: string) => {
    const reason = window.prompt("Please enter a reason for rejection:", "Does not meet requirements")
    if (reason) {
      await dispatch(rejectRestaurant({ restaurantId, reason }))
      loadDashboardData()
    }
  }

  // Order Handlers
  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    await dispatch(updateOrderStatus({ orderId, status }))
    loadDashboardData()
    if (selectedOrder && selectedOrder._id === orderId) {
      setIsOrderModalOpen(false)
      setSelectedOrder(null)
    }
  }

  const handleViewOrderDetails = (order: Order) => {
    setSelectedOrder(order)
    setIsOrderModalOpen(true)
    if (order.status === 'confirmed' || order.status === 'preparing' || order.status === 'ready') {
      dispatch(fetchAvailableRiders())
    }
  }

  const handleAssignRider = async (orderId: string, riderId: string) => {
    if (!riderId) {
      toast.error("Please select a rider")
      return
    }
    await dispatch(assignRiderToOrder({ orderId, riderId }))
    toast.success("Rider assigned to order!")
    setIsOrderModalOpen(false)
    setSelectedOrder(null)
    loadDashboardData()
  }

  const handleCreateRider = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // NOTE: Create Rider action needs to be added to adminSlice, but for now we fallback to direct fetch
      // if it's not implemented in the slice yet.
      const response = await fetch("http://localhost:5000/api/admin/riders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("adminToken")}`
        },
        body: JSON.stringify(newRiderData)
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Rider created successfully!");
        setIsCreateRiderModalOpen(false);
        setNewRiderData({ name: "", email: "", password: "", phone: "" });
        dispatch(fetchRiders({ limit: 50 })); // Refresh list
      } else {
        toast.error(data.message || "Failed to create rider");
      }
    } catch (err) {
      toast.error("An error occurred");
    }
  }



  // Helper Functions
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered":
      case "completed":
        return { className: "bg-green-100 text-green-800 border-green-200" }
      case "confirmed":
      case "accepted":
        return { className: "bg-blue-100 text-blue-800 border-blue-200" }
      case "preparing":
      case "cooking":
      case "picked_up":
        return { className: "bg-indigo-100 text-indigo-800 border-indigo-200" }
      case "on_the_way":
      case "out_for_delivery":
        return { className: "bg-amber-100 text-amber-800 border-amber-200" }
      case "pending":
        return { className: "bg-yellow-100 text-yellow-800 border-yellow-200" }
      case "cancelled":
      case "rejected":
        return { className: "bg-red-100 text-red-800 border-red-200" }
      default:
        return { className: "bg-gray-100 text-gray-800 border-gray-200" }
    }
  }

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount).replace('PKR', 'Rs.')
  }

  const getOwnerName = (restaurant: Restaurant) => {
    if (restaurant.owner && typeof restaurant.owner === 'object' && 'name' in restaurant.owner) {
      return (restaurant.owner as any).name;
    }
    return "Unknown Owner";
  }

  // Stats data
  const statsData = stats?.overview ? [
    {
      title: "Total Restaurants",
      value: (stats.overview.totalRestaurants || 0).toLocaleString(),
      change: "+12%",
      icon: Store,
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    },
    {
      title: "Active Orders",
      value: (stats.overview.activeOrders || 0).toLocaleString(),
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-100"
    },
    {
      title: "Total Revenue",
      value: formatPrice(stats.overview.totalRevenue || 0),
      change: "+15%",
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-100"
    },
    {
      title: "Total Users",
      value: (stats.overview.totalUsers || 0).toLocaleString(),
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-100"
    },
  ] : []

  // Filtered data
  const filteredOrders = orders.filter(() => true)

  const filteredUsers = users.filter((user) => {
    if (!userSearchTerm) return true
    const search = userSearchTerm.toLowerCase()
    return (
      user.name?.toLowerCase().includes(search) ||
      user.email?.toLowerCase().includes(search) ||
      user.phone?.toLowerCase().includes(search)
    )
  })

  // Tabs
  const tabs = [
    { id: "overview", label: "Overview", icon: Home },
    { id: "menu", label: "Menu", icon: Utensils },
    { id: "orders", label: "Orders", icon: Clock },
    { id: "restaurants", label: "Restaurants", icon: Store },
    { id: "users", label: "Users", icon: Users },
    { id: "riders", label: "Riders", icon: Bike },
    { id: "feedback", label: "Feedback", icon: MessageSquare },
  ]

  if (isLoading && !stats && activeTab === "overview") {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Admin Dashboard
                </h1>
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                  v2.0
                </Badge>
              </div>

              <div className="flex items-center space-x-3">
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setDarkMode(!darkMode)}>
                  {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </Button>
                <Button onClick={loadDashboardData} variant="outline" size="sm">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 mt-4 overflow-x-auto pb-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === tab.id
                    ? "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                    }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-6">
          {/* Error Display */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statsData.map((stat, index) => (
                  <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                          <p className="text-3xl font-bold mt-2">{stat.value}</p>
                          {stat.change && (
                            <div className="flex items-center gap-1 mt-2">
                              <TrendingUp className="w-4 h-4 text-green-600" />
                              <p className="text-sm text-green-600">{stat.change}</p>
                            </div>
                          )}
                        </div>
                        <div className={`p-4 rounded-2xl ${stat.bgColor}`}>
                          <stat.icon className={`w-6 h-6 ${stat.color}`} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Charts and Tables */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Orders */}
                <Card className="border-0 shadow-sm">
                  <CardHeader className="border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <CardTitle>Recent Orders</CardTitle>
                      <Button variant="ghost" size="sm" onClick={() => setActiveTab("orders")}>
                        View All
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    {orders.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">No orders found</div>
                    ) : (
                      <div className="space-y-3">
                        {orders.slice(0, 5).map((order) => {
                          const statusClass = getStatusBadge(order.status).className
                          const total = order.pricing?.total || 0

                          return (
                            <div key={order._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-semibold">#{order.orderNumber || order._id.slice(-8)}</span>
                                  <Badge className={statusClass}>{order.status}</Badge>
                                </div>
                                <p className="text-xs text-gray-500">
                                  {format(new Date(order.createdAt), "MMM dd, h:mm a")}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-amber-600">{formatPrice(total)}</p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Pending Restaurants */}
                <Card className="border-0 shadow-sm">
                  <CardHeader className="border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <CardTitle>Pending Approvals</CardTitle>
                      {pendingRestaurants.length > 0 && (
                        <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                          {pendingRestaurants.length} pending
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    {pendingRestaurants.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <CheckCircle className="w-12 h-12 text-green-200 mx-auto mb-3" />
                        <p>All caught up! No pending applications.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {pendingRestaurants.slice(0, 5).map((restaurant) => (
                          <div key={restaurant._id} className="p-4 bg-gray-50 rounded-xl">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h4 className="font-semibold">{restaurant.name}</h4>
                                <p className="text-sm text-gray-500">Owner: {getOwnerName(restaurant)}</p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {format(new Date(restaurant.createdAt), "MMM dd, yyyy")}
                                </p>
                              </div>
                              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                Pending
                              </Badge>
                            </div>

                            <div className="flex gap-2">
                              <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => handleApproveRestaurant(restaurant._id)}>
                                <CheckCircle className="w-4 h-4 mr-1" /> Approve
                              </Button>
                              <Button size="sm" variant="destructive" className="flex-1"
                                onClick={() => handleRejectRestaurant(restaurant._id)}>
                                <XCircle className="w-4 h-4 mr-1" /> Reject
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Menu Tab */}
          {activeTab === "menu" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl font-bold">Platform Menu Items</CardTitle>
                <Button
                  onClick={() => {
                    setEditingMenuItem(null)
                    setIsMenuModalOpen(true)
                  }}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Menu Item
                </Button>
              </div>
              <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-lg p-6">
                <RestaurantMenu
                  filters={{ categories: [], rating: "", price: "", cuisines: [] }}
                  onEdit={(item) => {
                    setEditingMenuItem(item)
                    setIsMenuModalOpen(true)
                  }}
                />
              </div>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === "orders" && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="border-b border-gray-100">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <CardTitle>All Orders</CardTitle>
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      value={dateRange.from}
                      onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                      className="w-40"
                    />
                    <Input
                      type="date"
                      value={dateRange.to}
                      onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                      className="w-40"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  {filteredOrders.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No orders found</div>
                  ) : (
                    filteredOrders.map((order) => {
                      const statusClass = getStatusBadge(order.status).className
                      const total = order.pricing?.total || 0

                      return (
                        <div key={order._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold">Order #{order.orderNumber || order._id.slice(-8)}</span>
                              <Badge className={statusClass}>{order.status}</Badge>
                            </div>
                            <p className="text-sm text-gray-500">
                              {format(new Date(order.createdAt), "MMM dd, yyyy h:mm a")}
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <p className="font-bold text-amber-600">{formatPrice(total)}</p>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-amber-200 text-amber-700 hover:bg-amber-50"
                                onClick={() => handleViewOrderDetails(order)}
                              >
                                View Bill
                              </Button>
                              {order.status === 'pending' && (
                                <>
                                  <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white"
                                    onClick={() => handleUpdateOrderStatus(order._id, 'confirmed')}>
                                    Accept
                                  </Button>
                                  <Button size="sm" variant="destructive"
                                    onClick={() => handleUpdateOrderStatus(order._id, 'rejected')}>
                                    Reject
                                  </Button>
                                </>
                              )}
                              {['confirmed', 'preparing', 'ready', 'picked_up', 'out_for_delivery'].includes(order.status) && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-600 hover:bg-red-50"
                                  onClick={() => {
                                    if (window.confirm("Are you sure you want to cancel this order?")) {
                                      handleUpdateOrderStatus(order._id, 'cancelled')
                                    }
                                  }}
                                >
                                  Cancel
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Restaurants Tab */}
          {activeTab === "restaurants" && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="border-b border-gray-100">
                <CardTitle>All Restaurants</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  {pendingRestaurants.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No restaurants found</div>
                  ) : (
                    pendingRestaurants.map((restaurant) => (
                      <div key={restaurant._id} className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-lg">{restaurant.name}</h3>
                            <p className="text-sm text-gray-500">Owner: {getOwnerName(restaurant)}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              Applied: {format(new Date(restaurant.createdAt), "MMM dd, yyyy")}
                            </p>
                          </div>
                          <Badge variant="outline" className={
                            restaurant.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200' :
                              restaurant.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                                'bg-yellow-50 text-yellow-700 border-yellow-200'
                          }>
                            {restaurant.status || 'pending'}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Users Tab */}
          {activeTab === "users" && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="border-b border-gray-100">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <CardTitle>Users Directory</CardTitle>
                  <div className="w-full sm:w-72">
                    <Input
                      placeholder="Search users..."
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      className="bg-gray-50 border-gray-200"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  {filteredUsers.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No users found</div>
                  ) : (
                    <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-3">
                      {filteredUsers.map((user) => (
                        <div key={user._id} className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors flex justify-between items-center">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{user.name || 'No Name'}</h3>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-1">
                              <p className="text-sm text-gray-500">{user.email}</p>
                              {user.createdAt && (
                                <p className="text-xs text-gray-400">
                                  Joined: {format(new Date(user.createdAt), "MMM dd, yyyy")}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className={
                              user.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-200 capitalize' :
                                user.role === 'restaurant' ? 'bg-blue-50 text-blue-700 border-blue-200 capitalize' :
                                  'bg-gray-50 text-gray-700 border-gray-200 capitalize'
                            }>
                              {user.role}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Riders Tab */}
          {activeTab === "riders" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl font-bold">Delivery Riders</CardTitle>
                <Button
                  onClick={() => setIsCreateRiderModalOpen(true)}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Rider
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {riders.length === 0 ? (
                  <div className="col-span-full text-center py-12 text-gray-500 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                    <Bike className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No delivery riders found.</p>
                  </div>
                ) : (
                  riders.map((rider) => (
                    <Card key={rider._id} className="border border-gray-100 shadow-sm hover:border-amber-200 transition-colors">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                              <Bike className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                              <h4 className="font-bold">{rider.name}</h4>
                              <p className="text-sm text-gray-500">{rider.phone}</p>
                            </div>
                          </div>
                          <Badge className={
                            rider.riderStatus === 'available' ? 'bg-green-100 text-green-700 border-green-200' :
                              rider.riderStatus === 'busy' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                                'bg-gray-100 text-gray-700 border-gray-200'
                          }>
                            {rider.riderStatus || 'Offline'}
                          </Badge>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                          <p className="text-xs text-gray-400 truncate">{rider.email}</p>
                          <Badge variant="outline" className={rider.isActive ? "text-green-600 border-green-200 bg-green-50" : "text-red-600 border-red-200 bg-red-50"}>
                            {rider.isActive ? "Active Account" : "Inactive Account"}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}

        </main>

        {/* Order Details Modal */}
        <Dialog open={isOrderModalOpen} onOpenChange={setIsOrderModalOpen}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto p-0 border-none bg-transparent shadow-none">
            {selectedOrder && (
              <div className="relative">
                <OrderBill order={selectedOrder} />
                <div className="bg-white p-6 border-t rounded-b-xl space-y-4">
                  {/* Assign Rider Section */}
                  {(selectedOrder.status === 'confirmed' || selectedOrder.status === 'preparing' || selectedOrder.status === 'ready') && selectedOrder.orderType === 'delivery' && (
                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                      <div className="flex items-center gap-2 mb-3">
                        <Bike className="w-5 h-5 text-amber-600" />
                        <h4 className="font-bold text-amber-900">Assign Delivery Staff</h4>
                      </div>

                      {availableRiders.length === 0 ? (
                        <p className="text-sm text-amber-700 bg-amber-100/50 p-3 rounded-lg border border-amber-200">
                          ⚠️ No available riders found at the moment.
                        </p>
                      ) : (
                        <div className="flex gap-2">
                          <select
                            className="flex-1 px-3 py-2 bg-white border border-amber-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                            id="rider-select"
                          >
                            <option value="">Select an available rider...</option>
                            {availableRiders.map((rider) => (
                              <option key={rider._id} value={rider._id}>
                                {rider.name} ({rider.phone})
                              </option>
                            ))}
                          </select>
                          <Button
                            className="bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
                            onClick={() => {
                              const select = document.getElementById('rider-select') as HTMLSelectElement;
                              handleAssignRider(selectedOrder._id, select.value);
                            }}
                          >
                            Assign Rider
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-2">
                    {selectedOrder.status === 'pending' && (
                      <>
                        <Button variant="destructive" onClick={() => handleUpdateOrderStatus(selectedOrder._id, 'rejected')}>Reject Order</Button>
                        <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleUpdateOrderStatus(selectedOrder._id, 'confirmed')}>Accept Order</Button>
                      </>
                    )}
                    <Button variant="outline" onClick={() => setIsOrderModalOpen(false)}>Close</Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Feedback Tab content */}
        {activeTab === "feedback" && feedback && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Customer Feedback</h2>
                <p className="text-gray-500">Analyze service quality and customer satisfaction</p>
              </div>
            </div>

            {/* Feedback Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="rounded-2xl border-none shadow-sm bg-blue-50 dark:bg-blue-900/10">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Ratings</p>
                      <h3 className="text-2xl font-bold text-blue-900 dark:text-blue-100">{feedback.stats.totalRatings}</h3>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-none shadow-sm bg-amber-50 dark:bg-amber-900/10">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Avg. Overall</p>
                      <h3 className="text-2xl font-bold text-amber-900 dark:text-amber-100">{feedback.stats.avgOverallRating.toFixed(1)} / 5</h3>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                      <Star className="w-5 h-5 text-amber-600 fill-amber-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-none shadow-sm bg-green-50 dark:bg-green-900/10">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600 dark:text-green-400">Food Quality</p>
                      <h3 className="text-2xl font-bold text-green-900 dark:text-green-100">{feedback.stats.avgFoodRating.toFixed(1)} / 5</h3>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <Utensils className="w-5 h-5 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-none shadow-sm bg-purple-50 dark:bg-purple-900/10">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Delivery Speed</p>
                      <h3 className="text-2xl font-bold text-purple-900 dark:text-purple-100">{feedback.stats.avgDeliveryRating.toFixed(1)} / 5</h3>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <Bike className="w-5 h-5 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Feedback List */}
              <Card className="lg:col-span-2 rounded-2xl border-none shadow-sm bg-white dark:bg-gray-800">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Recent Customer Reviews</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {feedback.recentFeedback.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p>No feedback received yet.</p>
                      </div>
                    ) : (
                      feedback.recentFeedback.map((item, idx) => (
                        <div key={idx} className="p-4 rounded-xl border border-gray-100 dark:border-gray-700 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center font-bold text-xs">
                                {item.customer?.name?.[0] || 'C'}
                              </div>
                              <div>
                                <p className="text-sm font-bold">{item.customer?.name || 'Anonymous Customer'}</p>
                                <p className="text-xs text-gray-500">Ordered from {item.restaurant?.name || 'Restaurant'}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded text-xs font-bold">
                              <Star className="w-3 h-3 fill-amber-700" />
                              {item.rating?.overall}
                            </div>
                          </div>
                          <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                            "{item.rating?.comment || 'No comment provided.'}"
                          </p>
                          <div className="flex gap-4 text-xs text-gray-500">
                            <span>Food: {item.rating?.food}/5</span>
                            <span>Delivery: {item.rating?.delivery}/5</span>
                            <span className="ml-auto">Order #{item.orderNumber?.slice(-6) || '...'}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Rating Summary Card */}
              <Card className="rounded-2xl border-none shadow-sm bg-white dark:bg-gray-800">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Rating Insights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500">Performance Overview</p>
                    <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-amber-600" />
                        <span className="text-sm font-bold text-amber-900 dark:text-amber-100">Excellence Level</span>
                      </div>
                      <p className="text-xs text-amber-700 dark:text-amber-400">
                        {feedback.stats.avgOverallRating >= 4.5 ? "Outstanding service quality! Customers are extremely satisfied." :
                          feedback.stats.avgOverallRating >= 4 ? "Great service, keep it up!" :
                            feedback.stats.avgOverallRating >= 3 ? "Service is satisfactory but has room for improvement." :
                              feedback.stats.avgOverallRating > 0 ? "Service quality needs immediate attention." : "Waiting for more ratings to analyze."}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Quick Stats</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                        <p className="text-lg font-bold">{feedback.stats.totalRatings}</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">Responses</p>
                      </div>
                      <div className="text-center p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                        <p className="text-lg font-bold text-green-600">{((feedback.recentFeedback.filter(f => f.rating?.overall >= 4).length / (feedback.recentFeedback.length || 1)) * 100).toFixed(0)}%</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">Positive</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
        {/* Create Rider Modal */}
        <Dialog open={isCreateRiderModalOpen} onOpenChange={setIsCreateRiderModalOpen}>
          <DialogContent className="max-w-md bg-white dark:bg-gray-800 p-6 rounded-2xl border-none shadow-2xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <Bike className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold dark:text-white">Create Rider Account</CardTitle>
                <p className="text-sm text-gray-500 dark:text-gray-400">Add a new delivery staff member</p>
              </div>
            </div>

            <form onSubmit={handleCreateRider} className="space-y-4 pt-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Target Full Name</label>
                <Input
                  required
                  placeholder="e.g. John Doe"
                  value={newRiderData.name}
                  onChange={(e) => setNewRiderData({ ...newRiderData, name: e.target.value })}
                  className="bg-gray-50 border-gray-200 dark:bg-gray-700 dark:border-gray-600"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
                <Input
                  required
                  type="email"
                  placeholder="john@example.com"
                  value={newRiderData.email}
                  onChange={(e) => setNewRiderData({ ...newRiderData, email: e.target.value })}
                  className="bg-gray-50 border-gray-200 dark:bg-gray-700 dark:border-gray-600"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone Number</label>
                <Input
                  required
                  placeholder="0300..."
                  value={newRiderData.phone}
                  onChange={(e) => setNewRiderData({ ...newRiderData, phone: e.target.value })}
                  className="bg-gray-50 border-gray-200 dark:bg-gray-700 dark:border-gray-600"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Temporary Password</label>
                <Input
                  required
                  type="password"
                  minLength={6}
                  placeholder="Min. 6 characters"
                  value={newRiderData.password}
                  onChange={(e) => setNewRiderData({ ...newRiderData, password: e.target.value })}
                  className="bg-gray-50 border-gray-200 dark:bg-gray-700 dark:border-gray-600"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setIsCreateRiderModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 bg-amber-600 hover:bg-amber-700 text-white shadow-md">
                  Create Account
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Menu Item Modal */}
        <MenuItemModal
          isOpen={isMenuModalOpen}
          onClose={() => {
            setIsMenuModalOpen(false)
            setEditingMenuItem(null)
          }}
          onSaved={() => loadDashboardData()}
          editingItem={editingMenuItem}
          restaurantId="" // Handled inside modal via selector
        />
      </div>
    </div>
  )
}