"use client"

import { useState } from "react" // ✅ ADD FOR LOCAL LOADING STATE
import { motion } from "framer-motion"
import { useAppSelector, useAppDispatch } from "@/store/hooks"
import type { MenuItem, Filters } from "@/types"
import { addToCartServer } from "@/store/slices/cartSlice"
import { deleteMenuItem } from "@/store/slices/menuSlice" // Import the action
import { Edit, Trash2 } from "lucide-react"

interface RestaurantMenuProps {
  filters: Filters
  onEdit?: (item: MenuItem) => void // Add an optional prop to handle editing if needed
}

export default function RestaurantMenu({ filters, onEdit }: RestaurantMenuProps) {
  const menuItems = useAppSelector((state) => state.menu.items)
  const cartState = useAppSelector((state) => state.cart)
  const user = useAppSelector((state) => state.auth.user) // Get current user
  const dispatch = useAppDispatch()
  const [loadingItemId, setLoadingItemId] = useState<string | null>(null) // TRACK WHICH ITEM IS LOADING
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin'
  console.log("RestaurantMenu user check:", user);


  // Separate items into Deals and Regular Items
  const deals = menuItems.filter(item => 
    item.isDeal || item.category === "Special Deals"
  )
  const regularItems = menuItems.filter(item => 
    !item.isDeal && item.category !== "Special Deals"
  )

  // Filter regular items based on current category selection
  const filteredRegularItems = regularItems.filter((item) => {
    if (filters.categories.length > 0 && !filters.categories.includes(item.category)) {
      return false
    }
    return true
  })

  // Determine what to show in the deals section
  // Show deals if:
  // 1. "Special Deals" is selected in filters
  // 2. OR No specific category is selected (show all deals at top)
  const showDeals = filters.categories.length === 0 || filters.categories.includes("Special Deals")
  const filteredDeals = deals.filter(item => {
    // If Special Deals is selected, we show all of them.
    // If nothing is selected, we show all deals.
    return true; 
  })

  // Fixed image URLs
  const getImageUrl = (item: MenuItem) => {
    let imgPath = null;

    // Check if the array has a valid image
    if (item.images && item.images.length > 0) {
      imgPath = item.images[0];
    }
    // Backward compatibility for scalar 'image'
    else if (item.image) {
      imgPath = item.image;
    }

    if (!imgPath) {
      return "https://placehold.co/800x600/f3f4f6/a1a1aa?text=No+Image";
    }

    // If it's already a full HTTP URL, return it
    if (imgPath.startsWith("http")) {
      return imgPath;
    }

    // Process relative paths
    const backendUrl = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000";
    const formattedPath = imgPath.replace(/\\/g, "/"); // normalize slashes

    if (formattedPath.startsWith("/")) {
      return `${backendUrl}${formattedPath}`;
    } else {
      return `${backendUrl}/${formattedPath}`;
    }
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

  // Delete item handler
  const handleDelete = async (itemId: string, itemName: string) => {
    if (window.confirm(`Are you sure you want to delete ${itemName}?`)) {
      try {
        await dispatch(deleteMenuItem(itemId)).unwrap()
      } catch (error) {
        console.error("Failed to delete item:", error)
        alert("Failed to delete item. Please try again.")
      }
    }
  }

  // If no items at all
  if (filteredDeals.length === 0 && filteredRegularItems.length === 0) {
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

      <div className="space-y-12">
        {/* 🔥 Special Deals Section */}
        {showDeals && filteredDeals.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-2xl font-bold text-gray-900">🔥 Special Deals</h2>
              <div className="h-px bg-amber-200 flex-1" />
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredDeals.map((item) => renderMenuItem(item))}
            </div>
          </div>
        )}

        {/* Regular Menu Items */}
        {filteredRegularItems.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-2xl font-bold text-gray-900">🍽️ Menu Items</h2>
              <div className="h-px bg-gray-200 flex-1" />
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredRegularItems.map((item) => renderMenuItem(item))}
            </div>
          </div>
        )}
      </div>
    </>
  )

  // Helper to render a menu item
  function renderMenuItem(item: MenuItem) {
    const itemId = item._id || (item as any).id;
    const isAdding = loadingItemId === itemId;
    const isADeal = item.isDeal || item.category === "Special Deals";

    return (
      <motion.div
        key={itemId}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        whileHover={{ y: -5 }}
        className={`bg-white rounded-2xl shadow-lg overflow-hidden border ${isADeal ? 'border-amber-200 ring-1 ring-amber-100' : 'border-gray-100'} hover:shadow-xl transition-all duration-300 relative group`}
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
              const fallback = "https://placehold.co/800x600/f3f4f6/a1a1aa?text=No+Image";
              if (target.src !== fallback) {
                target.src = fallback;
              }
            }}
          />

          {/* Deal Overlay */}
          {isADeal && (
            <div className="absolute top-3 left-3 bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
              <span>🔥 DEAL</span>
            </div>
          )}

          {/* Admin Quick Actions (Hover) */}
          {isAdmin && (
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <button
                onClick={() => onEdit?.(item)}
                className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg transition-transform hover:scale-110"
                title="Edit Item"
              >
                <Edit className="w-5 h-5" />
              </button>
              <button
                onClick={() => itemId && handleDelete(itemId, item.name)}
                className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-transform hover:scale-110"
                title="Delete Item"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          )}

          {isAdding && (
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-white border-t-transparent"></div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold text-lg text-gray-900 truncate pr-2">{item.name}</h3>
            <span className={`text-xs font-medium px-2 py-1 rounded whitespace-nowrap shrink-0 ${isADeal ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-800'}`}>
              {item.category}
            </span>
          </div>

          <p className="text-gray-600 text-sm mb-4 line-clamp-2">{item.description}</p>

          {/* Deal Items Bundle */}
          {isADeal && item.dealItems && item.dealItems.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-1">
              {item.dealItems.map((bundleItem, idx) => (
                <span key={idx} className="bg-amber-50 text-[10px] text-amber-700 px-2 py-0.5 rounded-md border border-amber-100 underline decoration-amber-200">
                  + {bundleItem}
                </span>
              ))}
            </div>
          )}

          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <span className="font-bold text-amber-600 text-lg">Rs. {item.price}</span>
              {item.discountPercentage > 0 && item.originalPrice && (
                <span className="text-xs text-gray-400 line-through">Rs. {item.originalPrice}</span>
              )}
            </div>

            <button
              onClick={() => handleAddToCart(item)}
              disabled={isAdding || cartState.isLoading}
              className={`
                ${isADeal ? 'bg-amber-600 hover:bg-amber-700' : 'bg-amber-500 hover:bg-amber-600'}
                text-white px-4 py-2 rounded-lg text-sm font-medium
                transition-all duration-200 min-w-[120px] flex items-center justify-center
                ${isAdding
                  ? "opacity-50 cursor-not-allowed"
                  : "active:scale-95 shadow-md hover:shadow-lg"
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
    );
  }
}