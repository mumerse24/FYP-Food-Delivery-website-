"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, X } from "lucide-react"
import { Filters } from "@/components/restaurant-menu"

// --- Interface for Props ---
interface FilterSidebarProps {
  currentFilters: Filters;
  onFilterChange: (newFilters: Partial<Filters>) => void;
}

// --- Accordion Section (Reusable Component) ---
const FilterSection = ({
  title,
  children,
  defaultOpen = false,
}: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  const contentVariants = {
    collapsed: { height: 0, opacity: 0 },
    open: { height: "auto", opacity: 1 },
  }

  return (
    <div className="border-b border-amber-100">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full py-3 group"
      >
        <h4 className="font-semibold text-amber-800 group-hover:text-orange-600 transition-colors">
          {title}
        </h4>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.25 }}
        >
          <ChevronDown
            size={20}
            className="text-amber-500 group-hover:text-orange-600 transition-colors"
          />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial="collapsed"
            animate="open"
            exit="collapsed"
            variants={contentVariants}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="pb-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function FilterSidebar({ currentFilters, onFilterChange }: FilterSidebarProps) {
  
  // Cuisines Data
  const cuisines = [
    "Italian", "Chinese", "Indian", "Mexican", "Japanese",
    "Thai", "American", "Mediterranean", "French", "Korean",
  ]

  // --- Handlers ---
  // (Removed toggleCategory handler since it's handled in MenuPage now)

  const toggleCuisine = (cuisine: string) => {
    const current = currentFilters.cuisines;
    const updated = current.includes(cuisine)
      ? current.filter((c) => c !== cuisine)
      : [...current, cuisine];
    
    onFilterChange({ cuisines: updated });
  }

  const setRating = (rating: string) => {
    const value = currentFilters.rating === rating ? "" : rating;
    onFilterChange({ rating: value });
  }

  const setPrice = (price: string) => {
    const value = currentFilters.price === price ? "" : price;
    onFilterChange({ price: value });
  }

  const clearFilters = () => {
    onFilterChange({
      categories: [], // Also clears categories
      cuisines: [],
      rating: "",
      price: "",
    });
  }

  // Helper to check if filters are active
  const hasActiveFilters = 
    currentFilters.categories.length > 0 ||
    currentFilters.cuisines.length > 0 || 
    currentFilters.rating || 
    currentFilters.price;

  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl border border-amber-200 p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-amber-800">Filters</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 px-2"
        >
          Clear All
        </Button>
      </div>

      {/* Note: Categories Section removed from here as it is now horizontal in MenuPage */}

      {/* 1. Cuisine Type */}
      <FilterSection title="Cuisine Type" defaultOpen={true}>
        <div className="space-y-1 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
          {cuisines.map((cuisine) => (
            <label
              key={cuisine}
              className="flex items-center space-x-2 cursor-pointer p-2 rounded-lg hover:bg-orange-50 transition-colors"
            >
              <input
                type="checkbox"
                checked={currentFilters.cuisines.includes(cuisine)}
                onChange={() => toggleCuisine(cuisine)}
                className="rounded border-gray-300 text-orange-600 focus:ring-orange-500 accent-orange-600"
              />
              <span className="text-sm text-gray-800">{cuisine}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* 2. Rating */}
      <FilterSection title="Rating" defaultOpen={false}>
        <div className="space-y-1">
          {["4.5", "4.0", "3.5", "3.0"].map((rating) => (
            <label
              key={rating}
              className="flex items-center space-x-2 cursor-pointer p-2 rounded-lg hover:bg-orange-50 transition-colors"
            >
              <input
                type="radio"
                name="rating"
                value={rating}
                checked={currentFilters.rating === rating}
                onChange={() => setRating(rating)}
                className="text-orange-600 focus:ring-orange-500 accent-orange-600"
              />
              <span className="text-sm text-gray-800">{rating}+ stars</span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* 3. Price Range */}
      <FilterSection title="Price Range" defaultOpen={false}>
        <div className="space-y-1">
          {[ 
            { value: "$", label: "$ - Under $15" },
            { value: "$$", label: "$$ - $15-30" },
            { value: "$$$", label: "$$$ - $30-50" },
            { value: "$$$$", label: "$$$$ - Over $50" },
          ].map((price) => (
            <label
              key={price.value}
              className="flex items-center space-x-2 cursor-pointer p-2 rounded-lg hover:bg-orange-50 transition-colors"
            >
              <input
                type="radio"
                name="price"
                value={price.value}
                checked={currentFilters.price === price.value}
                onChange={() => setPrice(price.value)}
                className="text-orange-600 focus:ring-orange-500 accent-orange-600"
              />
              <span className="text-sm text-gray-800">{price.label}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Active Filters Badges */}
      {hasActiveFilters && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="pt-5 border-t border-amber-100 mt-4"
        >
          <h4 className="font-semibold text-amber-800 mb-3 text-sm">Active Filters</h4>
          <div className="flex flex-wrap gap-2">
            <AnimatePresence>
              {/* Categories Badges - Still show them here if you want to be able to remove them from sidebar too, 
                  but the main control is now top bar. Let's keep them for consistency. */}
              {currentFilters.categories.map((cat) => (
                <motion.div
                  key={cat}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                >
                  <Badge className="bg-orange-600 text-white hover:bg-orange-700 pl-2 pr-1 py-1 cursor-pointer" 
                    onClick={() => {
                       // We need to pass this up to the parent if we want to remove it from here
                       const current = currentFilters.categories;
                       const updated = current.filter((c) => c !== cat);
                       onFilterChange({ categories: updated });
                    }}>
                    {cat}
                    <X size={14} className="ml-1" />
                  </Badge>
                </motion.div>
              ))}

              {/* Cuisines Badges */}
              {currentFilters.cuisines.map((cuisine) => (
                <motion.div
                  key={cuisine}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                >
                  <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200 pl-2 pr-1 py-1 cursor-pointer" onClick={() => toggleCuisine(cuisine)}>
                    {cuisine}
                    <X size={14} className="ml-1" />
                  </Badge>
                </motion.div>
              ))}

              {currentFilters.rating && (
                <motion.div
                   key="rating"
                   initial={{ opacity: 0, scale: 0.8 }}
                   animate={{ opacity: 1, scale: 1 }}
                   exit={{ opacity: 0, scale: 0.8 }}
                >
                  <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200 pl-2 pr-1 py-1 cursor-pointer" onClick={() => setRating(currentFilters.rating)}>
                    {currentFilters.rating}+ Stars
                    <X size={14} className="ml-1" />
                  </Badge>
                </motion.div>
              )}

              {currentFilters.price && (
                <motion.div
                   key="price"
                   initial={{ opacity: 0, scale: 0.8 }}
                   animate={{ opacity: 1, scale: 1 }}
                   exit={{ opacity: 0, scale: 0.8 }}
                >
                  <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200 pl-2 pr-1 py-1 cursor-pointer" onClick={() => setPrice(currentFilters.price)}>
                    {currentFilters.price}
                    <X size={14} className="ml-1" />
                  </Badge>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}