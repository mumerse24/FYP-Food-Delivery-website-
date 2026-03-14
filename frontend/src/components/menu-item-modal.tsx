import React, { useState } from "react"
import { X, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { MenuItem } from "@/types"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { uploadMenuItemImage, addMenuItem, updateMenuItem } from "@/store/slices/adminSlice"

export interface MenuFormData {
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
    restaurantId: string
    isDeal: boolean
    dealItems: string[]
}

const CATEGORIES = [
    "Special Deals", "Burgers", "Pizza", "Sides", "Chinese", "Salads",
    "Beverages", "Desserts", "Main Course", "Appetizers",
    "Fast Food", "Indian", "Italian", "Other"
]

const SPICE_LEVELS: Array<"Mild" | "Medium" | "Hot" | "Extra Hot"> = [
    "Mild", "Medium", "Hot", "Extra Hot"
]

const DIETARY_OPTIONS = ["Vegetarian", "Vegan", "Gluten-free", "Halal", "Keto"]

interface MenuItemModalProps {
    isOpen: boolean
    onClose: () => void
    onSaved: () => void
    editingItem: MenuItem | null
    restaurantId: string
}

export function MenuItemModal({ isOpen, onClose, onSaved, editingItem, restaurantId }: MenuItemModalProps) {
    const dispatch = useAppDispatch()
    const { restaurants } = useAppSelector((state) => state.admin)
    const [isUploading, setIsUploading] = useState(false)
    const [newDealItem, setNewDealItem] = useState("")

    const [menuFormData, setMenuFormData] = useState<MenuFormData>(() => {
        if (editingItem) {
            return {
                name: editingItem.name,
                description: editingItem.description,
                price: editingItem.price,
                category: editingItem.category,
                images: editingItem.images || [],
                isAvailable: editingItem.isAvailable ?? true,
                isPopular: editingItem.isPopular ?? false,
                isFeatured: editingItem.isFeatured ?? false,
                discountPercentage: editingItem.discountPercentage || 0,
                preparationTime: editingItem.preparationTime || "15-20 mins",
                spiceLevel: (editingItem.spiceLevel as "Mild" | "Medium" | "Hot" | "Extra Hot") || "Mild",
                dietaryTags: editingItem.dietaryTags || [],
                restaurantId: typeof editingItem.restaurant === 'object' ? editingItem.restaurant._id : (editingItem.restaurant || restaurantId),
                isDeal: editingItem.isDeal ?? false,
                dealItems: editingItem.dealItems || []
            }
        }
        return {
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
            dietaryTags: [],
            restaurantId: restaurantId,
            isDeal: false,
            dealItems: []
        }
    })

    if (!isOpen) return null

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

    const addDealItem = () => {
        if (newDealItem.trim()) {
            setMenuFormData(prev => ({
                ...prev,
                dealItems: [...prev.dealItems, newDealItem.trim()]
            }))
            setNewDealItem("")
        }
    }

    const removeDealItem = (index: number) => {
        setMenuFormData(prev => ({
            ...prev,
            dealItems: prev.dealItems.filter((_, i) => i !== index)
        }))
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

            if (!menuFormData.restaurantId) {
                alert("Please select a restaurant")
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
                dietaryTags: menuFormData.dietaryTags || [],
                isDeal: menuFormData.isDeal,
                dealItems: menuFormData.dealItems || []
            }

            if (editingItem) {
                await dispatch(updateMenuItem({ id: editingItem._id, data: { ...itemData, restaurant: menuFormData.restaurantId } })).unwrap()
            } else {
                await dispatch(addMenuItem({ ...itemData, restaurant: menuFormData.restaurantId })).unwrap()
            }

            alert("Menu item saved successfully!")
            onSaved()
            onClose()
        } catch (error: any) {
            console.error("Failed to save menu item:", error)
            const errorMessage = error?.message || typeof error === 'string' ? error : "An error occurred while saving.";
            alert(`Failed to save menu item: ${errorMessage}`)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            {editingItem ? "Edit Menu Item" : "Add New Menu Item"}
                        </h3>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Restaurant *</label>
                                <select
                                    name="restaurantId"
                                    value={menuFormData.restaurantId}
                                    onChange={handleMenuInputChange}
                                    className="w-full px-3 py-2 border rounded-lg"
                                    disabled={!!editingItem && !!menuFormData.restaurantId} // Optional: disable if editing an existing item heavily tied to a restaurant
                                >
                                    <option value="" disabled>Select a restaurant</option>
                                    {restaurants?.map(r => (
                                        <option key={r._id} value={r._id}>{r.name}</option>
                                    ))}
                                </select>
                            </div>

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
                                        {CATEGORIES.map(cat => (
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
                                        {SPICE_LEVELS.map(level => (
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

                        <div className="space-y-4">
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

                            <div>
                                <label className="block text-sm font-medium mb-2">Dietary Tags</label>
                                <div className="flex flex-wrap gap-2">
                                    {DIETARY_OPTIONS.map(tag => (
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
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="isDeal"
                                        checked={menuFormData.isDeal}
                                        onChange={handleMenuCheckboxChange}
                                        className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                                    />
                                    <span className="text-sm font-bold text-amber-600 italic">🔥 Professional Deal / Combo</span>
                                </label>

                                {menuFormData.isDeal && (
                                    <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
                                        <label className="block text-sm font-bold text-amber-800 mb-2">Deal Items (Bundle)</label>
                                        <div className="flex gap-2 mb-3">
                                            <Input
                                                value={newDealItem}
                                                onChange={(e) => setNewDealItem(e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && addDealItem()}
                                                placeholder="e.g., Zinger Burger"
                                                className="flex-1 bg-white"
                                            />
                                            <Button 
                                                type="button" 
                                                onClick={addDealItem}
                                                className="bg-amber-600 hover:bg-amber-700 h-10 w-10 p-0"
                                            >
                                                <Plus className="w-5 h-5" />
                                            </Button>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {menuFormData.dealItems.map((item, idx) => (
                                                <div key={idx} className="bg-white px-3 py-1 rounded-full border border-amber-300 text-sm flex items-center gap-2 shadow-sm">
                                                    {item}
                                                    <button onClick={() => removeDealItem(idx)} className="text-red-500 hover:text-red-700">
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                        <Button variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button onClick={handleSaveMenuItem} className="bg-amber-600 hover:bg-amber-700 text-white">
                            {editingItem ? "Update Item" : "Add Item"}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
