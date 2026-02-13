"use client"

import { motion } from "framer-motion"
import { useAppSelector } from "@/store/hooks"
import type { MenuItem, Filters } from "@/types"

interface RestaurantMenuProps {
  filters: Filters
}

export default function RestaurantMenu({ filters }: RestaurantMenuProps) {
  const menuItems = useAppSelector((state) => state.menu.items)
  
  // Filter items
  const filteredItems = menuItems.filter((item) => {
    if (filters.categories.length > 0 && !filters.categories.includes(item.category)) {
      return false
    }
    return true
  })

  // Fixed image URLs
  const getImageUrl = (item: MenuItem) => {
    if (!item.image) {
      // Default images based on category
      const defaultImages: Record<string, string> = {
        "Burgers": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&h=600&fit=crop",
        "Pizza": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=600&fit=crop",
        "Sides": "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800&h=600&fit=crop",
        "Beverages": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&h=600&fit=crop",
        "Desserts": "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=800&h=600&fit=crop",
      }
      return defaultImages[item.category] || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=600&fit=crop"
    }
    return item.image
  }

  // If no items after filtering
  if (filteredItems.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">🔍</div>
        <h3 className="text-xl font-semibold text-gray-900">No items match your filters</h3>
        <p className="text-gray-500 mt-2">Try different categories</p>
      </div>
    )
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
      {filteredItems.map((item) => (
        <motion.div
          key={item._id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-shadow"
        >
          {/* Image */}
          <div className="h-48 overflow-hidden">
            <img
              src={getImageUrl(item)}
              alt={item.name}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-lg text-gray-900">{item.name}</h3>
              <span className="text-xs font-medium bg-amber-100 text-amber-800 px-2 py-1 rounded">
                {item.category}
              </span>
            </div>
            
            <p className="text-gray-600 text-sm mb-4">{item.description}</p>
            
            <div className="flex justify-between items-center">
              <span className="font-bold text-amber-600 text-lg">Rs. {item.price}</span>
              <button className="bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-600">
                Add to Cart
              </button>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}