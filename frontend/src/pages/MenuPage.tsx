import React, { useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { FilterSidebar } from "@/components/filter-sidebar"
import RestaurantMenu, { Filters } from "@/components/restaurant-menu"
import { motion } from "framer-motion"

// ✅ FIX: Added 'categories: []' to match the updated Filters type definition
const initialFilters: Filters = {
  categories: [], 
  cuisines: [],
  rating: "",
  price: "",
}

// 1. Define Categories List
const CATEGORIES = [
  "Appetizers",
  "Salads",
  "Soups",
  "Main Course",
  "Sides",
  "Desserts",
  "Beverages"
]

export default function MenuPage() {
  // 1. State to hold the active filters
  const [filters, setFilters] = useState<Filters>(initialFilters)

  // 2. Handler to update filters (passed to Sidebar)
  const handleFilterChange = (newFilters: Partial<Filters>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
    }))
  }

  // 3. Helper for Horizontal Category Toggles
  const toggleCategory = (category: string) => {
    const current = filters.categories;
    const updated = current.includes(category)
      ? current.filter((c) => c !== category)
      : [...current, category];
    
    handleFilterChange({ categories: updated });
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-amber-50">
      {/* 🔹 Animated Header */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Header />
      </motion.div>

      <main className="pt-20">
        {/* 🔥 Hero Section with Smooth Fade + Slide */}
        <motion.section
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="bg-gradient-to-br from-amber-50 to-orange-100 py-16 shadow-inner"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-5xl font-extrabold text-gray-900 mb-4">
              Our Delicious <span className="text-amber-600">Menu</span>
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Explore our mouth-watering dishes and find your next favorite meal.
            </p>

            {/* ✨ Animated underline */}
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "6rem" }}
              transition={{ duration: 0.8 }}
              className="h-1 bg-amber-500 mx-auto mt-4 rounded-full"
            />
          </div>
        </motion.section>

        {/* 🔥 Main Content Section with Filters + Menu */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="py-12"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* 🧭 Sidebar with Slide Animation */}
              <motion.aside
                initial={{ opacity: 0, x: -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7 }}
                viewport={{ once: true }}
                // Added sticky positioning so it stays visible while scrolling
                className="lg:w-64 flex-shrink-0 bg-white/60 backdrop-blur-md rounded-2xl shadow-md p-4 h-fit sticky top-24"
              >
                {/* PASSING PROPS: Connected state handler to the sidebar */}
                <FilterSidebar 
                  currentFilters={filters} 
                  onFilterChange={handleFilterChange} 
                />
              </motion.aside>

              {/* 🍽️ Menu Items with Fade-in and Hover Effects */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                viewport={{ once: true }}
                className="flex-1 bg-white/70 backdrop-blur-md rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-shadow duration-500"
              >
                {/* 4. ⭐ Horizontal Category Bar (Added Here) */}
                <div className="mb-8 overflow-x-auto pb-2 scrollbar-hide">
                   <div className="flex space-x-3 min-w-max px-1">
                     {/* 'All' Button */}
                     <button
                        onClick={() => handleFilterChange({ categories: [] })}
                        className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 shadow-sm
                          ${filters.categories.length === 0 
                            ? "bg-amber-600 text-white shadow-md scale-105" 
                            : "bg-white text-gray-600 hover:bg-amber-50 border border-gray-200"
                          }`}
                     >
                        All
                     </button>

                     {/* Category Buttons */}
                     {CATEGORIES.map((cat) => {
                        const isActive = filters.categories.includes(cat);
                        return (
                          <button
                            key={cat}
                            onClick={() => toggleCategory(cat)}
                            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 shadow-sm border
                              ${isActive 
                                ? "bg-amber-600 text-white border-amber-600 shadow-md scale-105" 
                                : "bg-white text-gray-600 border-gray-200 hover:bg-amber-50 hover:border-amber-200"
                              }`}
                          >
                            {cat}
                          </button>
                        )
                     })}
                   </div>
                </div>

                {/* PASSING PROPS: Connected state data to the menu */}
                <RestaurantMenu filters={filters} />
              </motion.div>
            </div>
          </div>
        </motion.section>
      </main>

      {/* ⚡ Animated Footer */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <Footer />
      </motion.div>
    </div>
  )
}