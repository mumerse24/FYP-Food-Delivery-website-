"use client"

import React, { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { FilterSidebar } from "@/components/filter-sidebar"
import { motion } from "framer-motion"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { fetchAllMenuItems, addMenuItem, updateMenuItem, removeMenuItem } from "@/store/slices/menuSlice"
import { socketService } from "@/services/socket"
import RestaurantMenu from "@/components/restaurant-menu"
import { MenuItemModal } from "@/components/menu-item-modal"
import { Plus } from "lucide-react"
import { DealsCarousel } from "@/components/deals-carousel"
import type { Filters, MenuItem } from "@/types"

// ✅ Initial Filters
const initialFilters: Filters = {
  categories: [],
  cuisines: [],
  rating: "",
  price: "",
}

// RESTAURANT_ID no longer needed for main menu load — GET /api/menu returns all items
const RESTAURANT_ID = "6973975518858a5d42961807" // kept for admin modal (adding/editing items)

export default function MenuPage() {
  const dispatch = useAppDispatch()
  const menuState = useAppSelector((state) => state.menu)
  const user = useAppSelector((state) => state.auth.user) // Get current user
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin'

  const [filters, setFilters] = useState<Filters>(initialFilters)
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  // Menu Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)

  const loadMenu = async () => {
    console.log("🔄 Loading menu from /api/menu ...")
    try {
      await dispatch(fetchAllMenuItems())
      console.log("✅ Menu loaded successfully")
    } catch (error) {
      console.error("❌ Failed to load menu:", error)
    } finally {
      setIsInitialLoad(false)
    }
  }

  // ✅ Load initial menu
  useEffect(() => {
    if (isInitialLoad) {
      loadMenu()
    }
  }, [dispatch, isInitialLoad])

  // ✅ Set up WebSockets for real-time menu updates
  useEffect(() => {
    // Connect to the socket server
    const socket = socketService.connect()

    // Listen for real-time events from the backend
    socket.on("menuItemAdded", (newItem: MenuItem) => {
      console.log("🔔 Real-time event: menuItemAdded", newItem.name)
      // Only add to state if it passes current filters (or at least let Redux hold it)
      dispatch(addMenuItem(newItem))
    })

    socket.on("menuItemUpdated", (updatedItem: MenuItem) => {
      console.log("🔔 Real-time event: menuItemUpdated", updatedItem.name)
      dispatch(updateMenuItem(updatedItem))
    })

    socket.on("menuItemDeleted", (deletedId: string) => {
      console.log("🔔 Real-time event: menuItemDeleted ID:", deletedId)
      dispatch(removeMenuItem(deletedId))
    })

    // Cleanup on unmount
    return () => {
      socket.off("menuItemAdded")
      socket.off("menuItemUpdated")
      socket.off("menuItemDeleted")
      // We don't necessarily disconnect entirely here as other parts might use it,
      // but cleaning up the listeners is crucial to avoid duplicates.
    }
  }, [dispatch])

  // Update filters from sidebar
  const handleFilterChange = (newFilters: Partial<Filters>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
    }))
  }

  // Toggle category selection
  const toggleCategory = (category: string) => {
    const current = filters.categories
    const updated = current.includes(category)
      ? current.filter((c) => c !== category)
      : [...current, category]
    handleFilterChange({ categories: updated })
  }

  // Get unique categories from items
  const CATEGORIES = Array.from(
    new Set(menuState.items.map(item => item.category))
  ).filter(Boolean)

  const handleEditClick = (item: MenuItem) => {
    setEditingItem(item)
    setIsModalOpen(true)
  }

  const handleAddClick = () => {
    setEditingItem(null)
    setIsModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-amber-50 relative">
      {/* Header */}
      <Header />

      <main className="pt-20">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-amber-50 to-orange-100 py-16 shadow-inner relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center position-relative">
            <h1 className="text-5xl font-extrabold text-gray-900 mb-4">
              Our Delicious <span className="text-amber-600">Menu</span>
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              new Explore our mouth-watering dishes and find your next favorite meal.
            </p>
            <div className="h-1 bg-amber-500 w-24 mx-auto mt-4 rounded-full" />
          </div>
        </section>

        <DealsCarousel />

        {/* Main Content */}
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row gap-8">

              {/* Sidebar */}
              <aside className="lg:w-64 flex-shrink-0 bg-white/60 backdrop-blur-md rounded-2xl shadow-md p-4 h-fit sticky top-24">
                <FilterSidebar
                  currentFilters={filters}
                  onFilterChange={handleFilterChange}
                />
              </aside>

              {/* Main Menu Area */}
              <div className="flex-1">

                {/* Loading State */}
                {menuState.isLoading ? (
                  <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-lg p-8 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading delicious menu...</p>
                  </div>
                ) : menuState.error ? (
                  // Error State
                  <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-lg p-8">
                    <div className="text-red-500 text-center">
                      <div className="text-4xl mb-4">😟</div>
                      <h3 className="text-xl font-semibold mb-2">Oops! Something went wrong</h3>
                      <p className="text-gray-600 mb-4">{menuState.error}</p>
                      <button
                        onClick={() => setIsInitialLoad(true)}
                        className="px-6 py-2 bg-amber-500 text-white rounded-full hover:bg-amber-600"
                      >
                        Try Again
                      </button>
                    </div>
                  </div>
                ) : menuState.items.length === 0 ? (
                  // Empty State
                  <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-lg p-8 text-center">
                    <div className="text-4xl mb-4">🍽️</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Menu is Empty</h3>
                    <p className="text-gray-500">No menu items available at the moment.</p>
                  </div>
                ) : (
                  // Success State
                  <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-shadow duration-500">

                    {/* Category Buttons */}
                    <div className="mb-8 overflow-x-auto pb-2 flex justify-between items-center gap-4 border-b pb-4">
                      <div className="flex space-x-3 min-w-max px-1">
                        <button
                          onClick={() => handleFilterChange({ categories: [] })}
                          className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${filters.categories.length === 0
                            ? "bg-amber-600 text-white shadow-md"
                            : "bg-white text-gray-600 hover:bg-amber-50 border"
                            }`}
                        >
                          All
                        </button>

                        {CATEGORIES.map((cat) => {
                          const isActive = filters.categories.includes(cat)
                          return (
                            <button
                              key={cat}
                              onClick={() => toggleCategory(cat)}
                              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${isActive
                                ? "bg-amber-600 text-white shadow-md"
                                : "bg-white text-gray-600 hover:bg-amber-50 border"
                                }`}
                            >
                              {cat}
                            </button>
                          )
                        })}
                      </div>

                      {isAdmin && (
                        <button
                          onClick={handleAddClick}
                          className="flex items-center gap-2 whitespace-nowrap bg-amber-600 text-white px-4 py-2 rounded-full font-semibold shadow-md hover:bg-amber-700 transition"
                        >
                          <Plus className="w-4 h-4" /> Add Item
                        </button>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="flex justify-between items-center mb-6">
                      <div className="text-sm text-gray-600">
                        <span className="font-semibold">{menuState.items.length}</span> delicious items available
                      </div>
                    </div>

                    {/* Restaurant Menu Component */}
                    <RestaurantMenu filters={filters} onEdit={handleEditClick} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />

      {/* Modal */}
      <MenuItemModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaved={() => loadMenu()}
        editingItem={editingItem}
        restaurantId={RESTAURANT_ID}
      />
    </div>
  )
}