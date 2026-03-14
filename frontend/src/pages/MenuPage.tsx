"use client"

import React, { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { FilterSidebar } from "@/components/filter-sidebar"
import { motion } from "framer-motion"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { fetchMenuItems } from "@/store/slices/menuSlice"
import RestaurantMenu from "@/components/restaurant-menu"
import type { Filters } from "@/types"

// ✅ Initial Filters
const initialFilters: Filters = {
  categories: [],
  cuisines: [],
  rating: "",
  price: "",
}

export default function MenuPage() {
  const dispatch = useAppDispatch()
  const menuState = useAppSelector((state) => state.menu)
  const [filters, setFilters] = useState<Filters>(initialFilters)
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  // ✅ FIXED: Ek hi baar fetch karo
  useEffect(() => {
    const loadMenu = async () => {
      const RESTAURANT_ID = "6973975518858a5d42961807"
      console.log("🔄 Loading menu for restaurant:", RESTAURANT_ID)
      
      try {
        await dispatch(fetchMenuItems(RESTAURANT_ID))
        console.log("✅ Menu loaded successfully")
      } catch (error) {
        console.error("❌ Failed to load menu:", error)
      } finally {
        setIsInitialLoad(false)
      }
    }

    if (isInitialLoad) {
      loadMenu()
    }
  }, [dispatch, isInitialLoad])

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-amber-50">
      {/* Header */}
      <Header />

      <main className="pt-20">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-amber-50 to-orange-100 py-16 shadow-inner">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-5xl font-extrabold text-gray-900 mb-4">
              Our Delicious <span className="text-amber-600">Menu</span>
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Explore our mouth-watering dishes and find your next favorite meal.
            </p>
            <div className="h-1 bg-amber-500 w-24 mx-auto mt-4 rounded-full" />
          </div>
        </section>

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
                    <div className="mb-8 overflow-x-auto pb-2">
                      <div className="flex space-x-3 min-w-max px-1">
                        <button
                          onClick={() => handleFilterChange({ categories: [] })}
                          className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                            filters.categories.length === 0
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
                              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                                isActive
                                  ? "bg-amber-600 text-white shadow-md"
                                  : "bg-white text-gray-600 hover:bg-amber-50 border"
                              }`}
                            >
                              {cat}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="mb-6 text-sm text-gray-600">
                      <span className="font-semibold">{menuState.items.length}</span> delicious items available
                    </div>

                    {/* Restaurant Menu Component */}
                    <RestaurantMenu filters={filters} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}