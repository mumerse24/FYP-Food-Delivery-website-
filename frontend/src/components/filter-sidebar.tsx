"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown } from "lucide-react"
import type { MenuItem, Filters } from "@/types"

interface FilterSidebarProps {
  currentFilters: Filters
  onFilterChange: (newFilters: Partial<Filters>) => void
}

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
  const contentVariants = { collapsed: { height: 0, opacity: 0 }, open: { height: "auto", opacity: 1 } }

  return (
    <div className="border-b border-amber-100">
      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center justify-between w-full py-3">
        <h4 className="font-semibold text-amber-800">{title}</h4>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.25 }}>
          <ChevronDown size={20} className="text-amber-500" />
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
            className="overflow-hidden pb-4"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function FilterSidebar({ currentFilters, onFilterChange }: FilterSidebarProps) {
  const cuisines = ["Italian", "Chinese", "Indian", "Mexican", "Japanese", "Thai", "American", "French"]

  const toggleCuisine = (cuisine: string) => {
    const updated = currentFilters.cuisines.includes(cuisine)
      ? currentFilters.cuisines.filter((c) => c !== cuisine)
      : [...currentFilters.cuisines, cuisine]
    onFilterChange({ cuisines: updated })
  }

  const setPrice = (price: string) => onFilterChange({ price: currentFilters.price === price ? "" : price })

  const clearFilters = () =>
    onFilterChange({
      categories: [],
      cuisines: [],
      rating: "",
      price: "",
    })

  return (
    <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}
      className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl border border-amber-200 p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-amber-800">Filters</h3>
        <Button variant="ghost" size="sm" onClick={clearFilters} className="text-orange-600">Clear All</Button>
      </div>

      <FilterSection title="Cuisine Type" defaultOpen>
        <div className="space-y-1 max-h-48 overflow-y-auto pr-2">
          {cuisines.map((cuisine) => (
            <label key={cuisine} className="flex items-center space-x-2 cursor-pointer p-2 rounded-lg hover:bg-orange-50">
              <input type="checkbox" checked={currentFilters.cuisines.includes(cuisine)} onChange={() => toggleCuisine(cuisine)} className="accent-orange-600" />
              <span className="text-sm text-gray-800">{cuisine}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Price Range" defaultOpen={false}>
        <div className="space-y-1">
          {[
            { value: "$", label: "$ - Under $15" },
            { value: "$$", label: "$$ - $15-30" },
            { value: "$$$", label: "$$$ - $30-50" },
            { value: "$$$$", label: "$$$$ - Over $50" },
          ].map((price) => (
            <label key={price.value} className="flex items-center space-x-2 cursor-pointer p-2 rounded-lg hover:bg-orange-50">
              <input type="radio" checked={currentFilters.price === price.value} onChange={() => setPrice(price.value)} className="accent-orange-600" />
              <span className="text-sm text-gray-800">{price.label}</span>
            </label>
          ))}
        </div>
      </FilterSection>
    </motion.div>
  )
}
