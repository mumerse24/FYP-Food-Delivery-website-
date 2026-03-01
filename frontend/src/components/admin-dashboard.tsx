"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import {
  Users, Store, DollarSign, Clock, CheckCircle, XCircle,
  TrendingUp, AlertCircle, RefreshCw, Utensils,
  Plus, Edit, Trash2, Search, Star, X, Upload,
  LayoutGrid, List,
  Home, Bell, Moon, Sun
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import {
  fetchAdminStats,
  fetchPendingRestaurants,
  fetchAllOrders,
  fetchUsers,
  approveRestaurant,
  rejectRestaurant,
  updateOrderStatus,
  fetchMenuItems,
  fetchAllRestaurants, // ✅ NEW
  setSelectedRestaurantId, // ✅ NEW
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleMenuItemAvailability,
  toggleMenuItemPopular,
  toggleMenuItemFeatured,
  fetchCategories,
  uploadMenuItemImage
} from "@/store/slices/adminSlice"
import type { Restaurant, MenuItem } from "@/types"


// Types
interface MenuFormData {
  name: string
  description: string
  price: number | string
  category: string
  images: string[]
  isAvailable: boolean
  isPopular: boolean
  isFeatured: boolean
  discountPercentage: number | string
  preparationTime: string
  spiceLevel: "Mild" | "Medium" | "Hot" | "Extra Hot"
  dietaryTags: string[]
}

// Initial Data
const initialFormData: MenuFormData = {
  name: "",
  description: "",
  price: "",
  category: "Burgers",
  images: [],
  isAvailable: true,
  isPopular: false,
  isFeatured: false,
  discountPercentage: 0,
  preparationTime: "15-20 mins",
  spiceLevel: "Mild",
  dietaryTags: []
}

const categories = [
  "Burgers", "Pizza", "Sides", "Chinese", "Salads",
  "Beverages", "Desserts", "Main Course", "Appetizers",
  "Fast Food", "Indian", "Italian", "Other"
]

const spiceLevels: Array<"Mild" | "Medium" | "Hot" | "Extra Hot"> = [
  "Mild", "Medium", "Hot", "Extra Hot"
]

const dietaryOptions = ["Vegetarian", "Vegan", "Gluten-free", "Halal", "Keto"]

export function AdminDashboard() {
  const dispatch = useAppDispatch()
  const [activeTab, setActiveTab] = useState<"overview" | "menu" | "orders" | "restaurants" | "users">("overview")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [darkMode, setDarkMode] = useState(false)

  // UI States
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false)
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null)
  const [menuFormData, setMenuFormData] = useState<MenuFormData>(initialFormData)
  const [menuSearchTerm, setMenuSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [orderSearchTerm, setOrderSearchTerm] = useState("")
  const [userSearchTerm, setUserSearchTerm] = useState("")
  const [selectedUserRole, setSelectedUserRole] = useState<string>("")
  const [isUploading, setIsUploading] = useState(false)
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({
    from: format(new Date().setDate(new Date().getDate() - 30), 'yyyy-MM-dd'),
    to: format(new Date(), 'yyyy-MM-dd')
  })

  // Redux State
  const {
    stats,
    pendingRestaurants,
    orders,
    users,
    restaurants, // ✅ NEW
    selectedRestaurantId, // ✅ NEW
    menuItems, // ✅ RESTORED
    isLoading,
    error
  } = useAppSelector((state) => state.admin)

  // Effects
  useEffect(() => {
    loadDashboardData()
    dispatch(fetchCategories())
    dispatch(fetchAllRestaurants()) // ✅ Fetch restaurants on mount
  }, [dispatch])

  useEffect(() => {
    if (activeTab === "menu" && selectedRestaurantId) {
      loadMenuItems()
    }
  }, [activeTab, selectedCategory, selectedRestaurantId])

  useEffect(() => {
    if (activeTab === "menu" && selectedRestaurantId) {
      const timer = setTimeout(() => {
        loadMenuItems()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [menuSearchTerm])

  // Data Loading
  const loadDashboardData = () => {
    dispatch(fetchAdminStats())
    dispatch(fetchPendingRestaurants({ limit: 5 }))
    dispatch(fetchAllOrders({ limit: 5, page: 1 }))
    dispatch(fetchUsers({ limit: 5 }))
  }

  const loadMenuItems = async () => {
    if (!selectedRestaurantId) return

    console.log("Loading menu items for restaurant:", selectedRestaurantId)
    try {
      await dispatch(fetchMenuItems({
        restaurantId: selectedRestaurantId,
        filters: {
          category: selectedCategory || undefined,
          search: menuSearchTerm || undefined
        }
      }))
    } catch (error) {
      console.error("Error loading menu items:", error)
    }
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
  }

  // Menu Handlers
  const openMenuModal = (item?: MenuItem) => {
    if (item) {
      setEditingMenuItem(item)
      setMenuFormData({
        name: item.name,
        description: item.description,
        price: item.price,
        category: item.category,
        images: item.images || [],
        isAvailable: item.isAvailable ?? true,
        isPopular: item.isPopular ?? false,
        isFeatured: item.isFeatured ?? false,
        discountPercentage: item.discountPercentage || 0,
        preparationTime: item.preparationTime || "15-20 mins",
        spiceLevel: (item.spiceLevel as "Mild" | "Medium" | "Hot" | "Extra Hot") || "Mild",
        dietaryTags: item.dietaryTags || []
      })
    } else {
      setEditingMenuItem(null)
      setMenuFormData(initialFormData)
    }
    setIsMenuModalOpen(true)
  }

  const handleMenuInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target

    if (name === "spiceLevel") {
      setMenuFormData(prev => ({
        ...prev,
        spiceLevel: value as "Mild" | "Medium" | "Hot" | "Extra Hot"
      }))
    } else {
      setMenuFormData(prev => ({
        ...prev,
        [name]: type === "number" ? parseFloat(value) || 0 : value
      }))
    }
  }

  const handleMenuCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target
    setMenuFormData(prev => ({ ...prev, [name]: checked }))
  }

  const toggleDietaryTag = (tag: string) => {
    setMenuFormData(prev => ({
      ...prev,
      dietaryTags: prev.dietaryTags.includes(tag)
        ? prev.dietaryTags.filter(t => t !== tag)
        : [...prev.dietaryTags, tag]
    }))
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // basic validation
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("File is too large (max 5MB)")
      return
    }

    try {
      setIsUploading(true)
      const res = await dispatch(uploadMenuItemImage(file)).unwrap()
      if (res.imageUrl) {
        setMenuFormData(prev => ({ ...prev, images: [...prev.images, res.imageUrl] }))
      }
    } catch (err: any) {
      alert("Error uploading image: " + (err.message || err))
    } finally {
      setIsUploading(false)
      // Reset the file input so the user can upload the same file again if they remove it
      e.target.value = ""
    }
  }

  const removeImage = (url: string) => {
    setMenuFormData(prev => ({
      ...prev,
      images: prev.images.filter(img => img !== url)
    }))
  }

  const handleSaveMenuItem = async () => {
    try {
      // Validation
      if (!menuFormData.name || menuFormData.name.trim().length < 2) {
        alert("Name must be at least 2 characters")
        return
      }

      if (!menuFormData.description || menuFormData.description.trim().length < 10) {
        alert("Description must be at least 10 characters")
        return
      }

      const price = Number(menuFormData.price)
      if (!price || price <= 0) {
        alert("Price must be a positive number")
        return
      }

      if (!menuFormData.category) {
        alert("Please select a category")
        return
      }

      if (!menuFormData.images || menuFormData.images.length === 0) {
        alert("Please add at least one image URL")
        return
      }

      const itemData = {
        name: menuFormData.name.trim(),
        description: menuFormData.description.trim(),
        price: price,
        category: menuFormData.category,
        images: menuFormData.images,
        isAvailable: menuFormData.isAvailable,
        isPopular: menuFormData.isPopular,
        isFeatured: menuFormData.isFeatured,
        discountPercentage: Number(menuFormData.discountPercentage) || 0,
        preparationTime: menuFormData.preparationTime || "15-20 mins",
        spiceLevel: menuFormData.spiceLevel,
        dietaryTags: menuFormData.dietaryTags || []
      }

      if (editingMenuItem) {
        await dispatch(updateMenuItem({ id: editingMenuItem._id, data: itemData })).unwrap()
      } else {
        await dispatch(addMenuItem({ ...itemData, restaurant: selectedRestaurantId! })).unwrap()
      }

      setIsMenuModalOpen(false)
      loadMenuItems()
      alert("Menu item saved successfully!")

    } catch (error: any) {
      console.error("Failed to save menu item:", error)
      const errorMessage = error?.message || typeof error === 'string' ? error : "An error occurred while saving.";
      alert(`Failed to save menu item: ${errorMessage}`)
    }
  }

  const handleDeleteMenuItem = async (id: string) => {
    if (confirm("Are you sure you want to delete this item?")) {
      await dispatch(deleteMenuItem(id))
      loadMenuItems()
    }
  }

  const handleToggleAvailability = async (id: string, current: boolean) => {
    await dispatch(toggleMenuItemAvailability({ id, isAvailable: !current }))
    loadMenuItems()
  }

  const handleTogglePopular = async (id: string, current: boolean) => {
    await dispatch(toggleMenuItemPopular({ id, isPopular: !current }))
    loadMenuItems()
  }

  // Helper Functions
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered":
      case "completed":
        return { className: "bg-green-100 text-green-800 border-green-200" }
      case "confirmed":
        return { className: "bg-blue-100 text-blue-800 border-blue-200" }
      case "preparing":
      case "cooking":
        return { className: "bg-indigo-100 text-indigo-800 border-indigo-200" }
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
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const getOwnerName = (restaurant: Restaurant) => {
    if (restaurant.owner && typeof restaurant.owner === 'object' && 'name' in restaurant.owner) {
      return (restaurant.owner as any).name;
    }
    return "Unknown Owner";
  }

  // Stats data
  const statsData = stats ? [
    {
      title: "Total Restaurants",
      value: stats.overview.totalRestaurants.toLocaleString(),
      change: "+12%",
      icon: Store,
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    },
    {
      title: "Active Orders",
      value: stats.overview.activeOrders.toLocaleString(),
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-100"
    },
    {
      title: "Total Revenue",
      value: `$${stats.overview.totalRevenue.toLocaleString()}`,
      change: "+15%",
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-100"
    },
    {
      title: "Total Users",
      value: stats.overview.totalUsers.toLocaleString(),
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-100"
    },
  ] : []

  // Filtered data
  const filteredOrders = orders.filter(order =>
    order._id.toLowerCase().includes(orderSearchTerm.toLowerCase()) ||
    order.status.toLowerCase().includes(orderSearchTerm.toLowerCase())
  )

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(userSearchTerm.toLowerCase())
    const matchesRole = selectedUserRole ? user.role === selectedUserRole : true
    return matchesSearch && matchesRole
  })

  // Tabs
  const tabs = [
    { id: "overview", label: "Overview", icon: Home },
    { id: "menu", label: "Menu Management", icon: Utensils },
    { id: "orders", label: "Orders", icon: Clock },
    { id: "restaurants", label: "Restaurants", icon: Store },
    { id: "users", label: "Users", icon: Users },
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
                          const total = order.totalAmount || 0

                          return (
                            <div key={order._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-semibold">#{order._id.slice(-8)}</span>
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
              {/* Menu Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Menu Management</h2>
                  <p className="text-sm text-gray-500 mt-1">{menuItems.length} items in menu</p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
                    className="hidden sm:flex"
                  >
                    {viewMode === "grid" ? <List className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
                  </Button>
                  <Button onClick={() => openMenuModal()} className="bg-amber-600 hover:bg-amber-700 text-white">
                    <Plus className="w-4 h-4 mr-2" /> Add New Item
                  </Button>
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Restaurant Selector */}
                <div className="w-full sm:w-64">
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Target Restaurant</label>
                  <select
                    value={selectedRestaurantId || ""}
                    onChange={(e) => dispatch(setSelectedRestaurantId(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-800 font-medium border-amber-200 focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="" disabled>Select a Restaurant</option>
                    {restaurants.map(res => (
                      <option key={res._id} value={res._id}>{res.name}</option>
                    ))}
                  </select>
                </div>

                <div className="relative flex-1 flex flex-col justify-end">
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Search Food</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search menu items..."
                      value={menuSearchTerm}
                      onChange={(e) => setMenuSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="w-full sm:w-48 flex flex-col justify-end">
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-800"
                  >
                    <option value="">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Menu Items Grid/List */}
              {viewMode === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {menuItems.map((item) => {
                    const itemImage = item.images && item.images.length > 0 ? item.images[0] : item.image || null

                    return (
                      <Card key={item._id} className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
                        <div className="relative h-48 bg-gray-100">
                          {itemImage ? (
                            <img
                              src={itemImage}
                              alt={item.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                                target.parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400">No Image</div>'
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              No Image
                            </div>
                          )}

                          {/* Badges */}
                          <div className="absolute top-2 right-2 flex gap-1 flex-wrap">
                            {!item.isAvailable && (
                              <Badge variant="destructive" className="bg-red-500 text-white border-0">
                                Unavailable
                              </Badge>
                            )}
                            {item.isPopular && (
                              <Badge className="bg-amber-500 text-white border-0">
                                <Star className="w-3 h-3 mr-1 fill-current" /> Popular
                              </Badge>
                            )}
                          </div>

                          {/* Quick Actions */}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              className="bg-white hover:bg-gray-100"
                              onClick={() => openMenuModal(item)}
                            >
                              <Edit className="w-4 h-4 mr-1" /> Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteMenuItem(item._id)}
                            >
                              <Trash2 className="w-4 h-4 mr-1" /> Delete
                            </Button>
                          </div>
                        </div>

                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold text-lg line-clamp-1">{item.name}</h3>
                            <div className="text-right">
                              <p className="font-bold text-amber-600">{formatPrice(item.price)}</p>
                              {item.discountPercentage > 0 && (
                                <p className="text-xs text-green-600">-{item.discountPercentage}%</p>
                              )}
                            </div>
                          </div>

                          <Badge variant="outline" className="mb-2 bg-amber-50 text-amber-700 border-amber-200">
                            {item.category}
                          </Badge>

                          <p className="text-sm text-gray-600 line-clamp-2 mb-3">{item.description}</p>

                          {/* Status Toggles */}
                          <div className="flex items-center justify-between pt-3 border-t">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleToggleAvailability(item._id, item.isAvailable)}
                              className={item.isAvailable ? "text-green-600" : "text-red-600"}
                            >
                              {item.isAvailable ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleTogglePopular(item._id, item.isPopular)}
                              className={item.isPopular ? "text-amber-600" : "text-gray-400"}
                            >
                              <Star className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              ) : (
                // List View
                <div className="space-y-3">
                  {menuItems.map((item) => (
                    <div key={item._id} className="bg-white dark:bg-gray-800 rounded-xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        {item.images && item.images[0] ? (
                          <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No img</div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{item.name}</h3>
                        <p className="text-sm text-gray-500 line-clamp-1">{item.description}</p>
                      </div>
                      <Badge className="bg-amber-50 text-amber-700 border-amber-200">{item.category}</Badge>
                      <p className="font-bold text-amber-600">{formatPrice(item.price)}</p>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openMenuModal(item)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-600" onClick={() => handleDeleteMenuItem(item._id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === "orders" && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="border-b border-gray-100">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <CardTitle>All Orders</CardTitle>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search orders..."
                        value={orderSearchTerm}
                        onChange={(e) => setOrderSearchTerm(e.target.value)}
                        className="pl-9 w-64"
                      />
                    </div>
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
                      const total = order.totalAmount || 0

                      return (
                        <div key={order._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold">Order #{order._id.slice(-8)}</span>
                              <Badge className={statusClass}>{order.status}</Badge>
                            </div>
                            <p className="text-sm text-gray-500">
                              {format(new Date(order.createdAt), "MMM dd, yyyy h:mm a")}
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <p className="font-bold text-amber-600">{formatPrice(total)}</p>
                            {order.status === 'pending' && (
                              <div className="flex gap-2">
                                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white"
                                  onClick={() => handleUpdateOrderStatus(order._id, 'confirmed')}>
                                  Accept
                                </Button>
                                <Button size="sm" variant="destructive"
                                  onClick={() => handleUpdateOrderStatus(order._id, 'rejected')}>
                                  Reject
                                </Button>
                              </div>
                            )}
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
                  <CardTitle>All Users</CardTitle>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search users..."
                        value={userSearchTerm}
                        onChange={(e) => setUserSearchTerm(e.target.value)}
                        className="pl-9 w-64"
                      />
                    </div>
                    <select
                      value={selectedUserRole}
                      onChange={(e) => setSelectedUserRole(e.target.value)}
                      className="px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-800"
                    >
                      <option value="">All Roles</option>
                      <option value="admin">Admin</option>
                      <option value="customer">Customer</option>
                      <option value="restaurant">Restaurant</option>
                    </select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  {filteredUsers.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No users found</div>
                  ) : (
                    filteredUsers.map((user) => (
                      <div key={user._id} className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold">{user.name || 'No Name'}</h3>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className={
                            user.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                              user.role === 'restaurant' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                'bg-gray-50 text-gray-700 border-gray-200'
                          }>
                            {user.role}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </main>

        {/* Menu Modal */}
        {isMenuModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                {/* Modal Header */}
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {editingMenuItem ? "Edit Menu Item" : "Add New Menu Item"}
                  </h3>
                  <button
                    onClick={() => setIsMenuModalOpen(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Form */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Name *</label>
                      <Input
                        name="name"
                        value={menuFormData.name}
                        onChange={handleMenuInputChange}
                        placeholder="e.g., Zinger Burger"
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Description *</label>
                      <textarea
                        name="description"
                        value={menuFormData.description}
                        onChange={handleMenuInputChange}
                        rows={4}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        placeholder="Describe your dish (min 10 characters)..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Price ($) *</label>
                        <Input
                          type="number"
                          name="price"
                          value={menuFormData.price}
                          onChange={handleMenuInputChange}
                          min="0"
                          step="0.01"
                          placeholder="9.99"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Discount %</label>
                        <Input
                          type="number"
                          name="discountPercentage"
                          value={menuFormData.discountPercentage}
                          onChange={handleMenuInputChange}
                          min="0"
                          max="100"
                          placeholder="0"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Category *</label>
                        <select
                          name="category"
                          value={menuFormData.category}
                          onChange={handleMenuInputChange}
                          className="w-full px-3 py-2 border rounded-lg"
                        >
                          {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Spice Level</label>
                        <select
                          name="spiceLevel"
                          value={menuFormData.spiceLevel}
                          onChange={handleMenuInputChange}
                          className="w-full px-3 py-2 border rounded-lg"
                        >
                          {spiceLevels.map(level => (
                            <option key={level} value={level}>{level}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Preparation Time</label>
                      <Input
                        name="preparationTime"
                        value={menuFormData.preparationTime}
                        onChange={handleMenuInputChange}
                        placeholder="e.g., 15-20 mins"
                      />
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    {/* Images */}
                    <div>
                      <label className="block text-sm font-medium mb-1">Images *</label>
                      <div className="flex gap-2 mb-2 flex-col">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          disabled={isUploading}
                          className="flex-1 cursor-pointer"
                        />
                        {isUploading && <p className="text-sm text-blue-600 overflow-hidden">Uploading image...</p>}
                      </div>

                      {menuFormData.images.length > 0 && (
                        <div className="grid grid-cols-3 gap-2 mt-3">
                          {menuFormData.images.map((url, index) => (
                            <div key={index} className="relative group border rounded-lg overflow-hidden">
                              <img
                                src={url}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-20 object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.src = 'https://via.placeholder.com/150?text=Error'
                                }}
                              />
                              <button
                                onClick={() => removeImage(url)}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                type="button"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {menuFormData.images.length === 0 && (
                        <p className="text-sm text-amber-600 mt-1">⚠️ At least one image required</p>
                      )}
                    </div>

                    {/* Dietary Tags */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Dietary Tags</label>
                      <div className="flex flex-wrap gap-2">
                        {dietaryOptions.map(tag => (
                          <button
                            key={tag}
                            onClick={() => toggleDietaryTag(tag)}
                            type="button"
                            className={`px-3 py-1 text-sm rounded-full transition-colors ${menuFormData.dietaryTags.includes(tag)
                              ? "bg-green-600 text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                              }`}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Status Toggles */}
                    <div className="space-y-3 pt-4 border-t">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          name="isAvailable"
                          checked={menuFormData.isAvailable}
                          onChange={handleMenuCheckboxChange}
                          className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                        />
                        <span className="text-sm">Available for order</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          name="isPopular"
                          checked={menuFormData.isPopular}
                          onChange={handleMenuCheckboxChange}
                          className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                        />
                        <span className="text-sm">Mark as Popular</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          name="isFeatured"
                          checked={menuFormData.isFeatured}
                          onChange={handleMenuCheckboxChange}
                          className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                        />
                        <span className="text-sm">Mark as Featured</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                  <Button variant="outline" onClick={() => setIsMenuModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveMenuItem} className="bg-amber-600 hover:bg-amber-700 text-white">
                    {editingMenuItem ? "Update Item" : "Add Item"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}