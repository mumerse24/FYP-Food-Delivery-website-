"use client"

import { useState } from "react" // ✅ ADD FOR LOCAL LOADING STATE
import { motion } from "framer-motion"
import { useAppSelector, useAppDispatch } from "@/store/hooks"
import type { MenuItem, Filters } from "@/types"
import { addToCartServer } from "@/store/slices/cartSlice"

interface RestaurantMenuProps {
  filters: Filters
}

export default function RestaurantMenu({ filters }: RestaurantMenuProps) {
  const menuItems = useAppSelector((state) => state.menu.items)
  const cartState = useAppSelector((state) => state.cart)
  const dispatch = useAppDispatch()
  const [loadingItemId, setLoadingItemId] = useState<string | null>(null) // ✅ TRACK WHICH ITEM IS LOADING

  // Filter items
  const filteredItems = menuItems.filter((item) => {
    if (filters.categories.length > 0 && !filters.categories.includes(item.category)) {
      return false
    }
    return true
  })

  // Fixed image URLs
  const getImageUrl = (item: MenuItem) => {
    // Check if the array has a valid image
    if (item.images && item.images.length > 0) {
      return item.images[0]
    }

    // Backward compatibility for scalar 'image'
    if (item.image) {
      return item.image
    }

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

  // Add to cart handler (optimized)
  const handleAddToCart = async (item: MenuItem) => {
    const validId = item._id || (item as any).id;

    if (!validId) {
      console.error("Missing ID for item:", item);
      return;
    }

    const restaurantId = typeof item.restaurant === "object" && item.restaurant !== null
      ? (item.restaurant as { _id: string })._id
      : item.restaurant;

    if (!restaurantId) {
      console.error("Missing restaurant ID for item:", item);
      return;
    }

    console.log("🛒 Adding to cart:", {
      menuItemId: validId,
      restaurantId,
      itemName: item.name
    });

    setLoadingItemId(validId); // ✅ SET LOADING FOR THIS ITEM

    try {
      await dispatch(
        addToCartServer({
          menuItemId: validId,
          quantity: 1,
          restaurantId,
        })
      ).unwrap(); // ✅ unwrap() se promise resolve hota hai
    } catch (error) {
      console.error("Failed to add to cart:", error);
    } finally {
      setLoadingItemId(null); // ✅ RESET LOADING
    }
  };

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
    <>
      {/* Error Display (if any) */}
      {cartState.error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl"
        >
          <div className="flex items-center">
            <div className="text-red-500 mr-3">⚠️</div>
            <div>
              <p className="text-red-700 font-medium">{cartState.error}</p>
              <p className="text-red-600 text-sm mt-1">Please try again</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Success Message */}
      {cartState.items.length > 0 && !cartState.error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl"
        >
          <div className="flex items-center">
            <div className="text-green-500 mr-3">🛒</div>
            <div>
              <p className="text-green-700 font-medium">
                Cart updated! {cartState.totalItems} item{cartState.totalItems !== 1 ? 's' : ''} in cart
              </p>
              <p className="text-green-600 text-sm mt-1">
                Total: Rs. {cartState.totalAmount}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredItems.map((item) => {
          const itemId = item._id || (item as any).id;
          const isAdding = loadingItemId === itemId; // ✅ PER-ITEM LOADING STATE

          return (
            <motion.div
              key={itemId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              whileHover={{ y: -5 }}
              className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300"
            >
              {/* Image */}
              <div className="h-48 overflow-hidden relative bg-gray-100">
                <img
                  src={getImageUrl(item)}
                  alt={item.name}
                  className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (!target.src.includes('unsplash.com')) {
                      const defaultImages: Record<string, string> = {
                        "Burgers": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&h=600&fit=crop",
                        "Pizza": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=600&fit=crop",
                        "Sides": "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800&h=600&fit=crop",
                        "Beverages": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&h=600&fit=crop",
                        "Desserts": "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=800&h=600&fit=crop",
                      };
                      target.src = defaultImages[item.category] || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=600&fit=crop";
                    }
                  }}
                />
                {isAdding && (
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-white border-t-transparent"></div>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg text-gray-900 truncate">{item.name}</h3>
                  <span className="text-xs font-medium bg-amber-100 text-amber-800 px-2 py-1 rounded whitespace-nowrap">
                    {item.category}
                  </span>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{item.description}</p>

                <div className="flex justify-between items-center">
                  <span className="font-bold text-amber-600 text-lg">Rs. {item.price}</span>

                  <button
                    onClick={() => handleAddToCart(item)}
                    disabled={isAdding || cartState.isLoading}
                    className={`
                      bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-medium
                      transition-all duration-200 min-w-[120px] flex items-center justify-center
                      ${isAdding
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:bg-amber-600 active:scale-95 shadow-md hover:shadow-lg"
                      }
                    `}
                  >
                    {isAdding ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Adding...
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                        </svg>
                        Add to Cart
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </>
  )
}