const express = require("express")
const { body, validationResult, query, param } = require("express-validator")
const mongoose = require("mongoose")
const MenuItem = require("../models/MenuItem")
const Restaurant = require("../models/Restaurant")
const { auth, restaurantAuth, adminAuth } = require("../middleware/auth")

const router = express.Router()

// ============ HELPER FUNCTION ============
// ✅ ObjectId Validation Helper
const validateObjectId = (id, field = "ID") => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error(`Invalid ${field} format`)
  }
}

// ============ PUBLIC ROUTES ============

// @route   GET /api/menu/restaurant/:restaurantId
// @desc    Get menu items for a specific restaurant
// @access  Public
router.get(
  "/restaurant/:restaurantId",
  [
    param("restaurantId").custom(value => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Invalid restaurant ID format")
      }
      return true
    }),
    query("category").optional().isString(),
    query("search").optional().isString(),
    query("available").optional().isBoolean(),
  ],
  async (req, res) => {
    try {
      // Check validation errors
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        })
      }

      const { restaurantId } = req.params
      const { category, search, available } = req.query

      // Build query with ObjectId
      const query = { restaurant: new mongoose.Types.ObjectId(restaurantId) }

      // Apply filters
      if (available === "true") {
        query.isAvailable = true
      }

      if (category) {
        query.category = category
      }

      if (search) {
        query.$text = { $search: search }
      }

      // Execute query with lean() for better performance
      const menuItems = await MenuItem.find(query)
        .populate("restaurant", "name")
        .sort({ category: 1, name: 1 })
        .lean() // ✅ lean() for faster queries

      res.json({
        success: true,
        data: menuItems,
        total: menuItems.length,
      })
    } catch (error) {
      console.error("Get menu items error:", error)
      res.status(500).json({
        success: false,
        message: "Server error",
      })
    }
  }
)

// @route   GET /api/menu/:id
// @desc    Get single menu item by ID
// @access  Public
router.get(
  "/:id",
  [
    param("id").custom(value => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Invalid menu item ID format")
      }
      return true
    })
  ],
  async (req, res) => {
    try {
      const { id } = req.params
      
      const menuItem = await MenuItem.findById(id)
        .populate("restaurant", "name")
        .lean()

      if (!menuItem) {
        return res.status(404).json({
          success: false,
          message: "Menu item not found",
        })
      }

      res.json({
        success: true,
        data: menuItem,
      })
    } catch (error) {
      console.error("Get menu item error:", error)
      res.status(500).json({
        success: false,
        message: "Server error",
      })
    }
  }
)

// ============ ADMIN CRUD ROUTES ============

// @route   POST /api/menu
// @desc    Add new menu item (Admin only)
// @access  Private (Admin)
router.post(
  "/",
  adminAuth, // ✅ Sirf admin access
  [
    body("restaurant").isMongoId().withMessage("Valid restaurant ID is required"),
    body("name").trim().isLength({ min: 2, max: 100 }),
    body("description").trim().isLength({ min: 10, max: 300 }),
    body("category").notEmpty(),
    body("price").isFloat({ min: 0 }),
    body("images").isArray({ min: 1 }),
  ],
  async (req, res) => {
    try {
      // Validation check
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        })
      }

      const { restaurant } = req.body

      // ✅ Verify restaurant exists
      const restaurantExists = await Restaurant.findById(restaurant)
      if (!restaurantExists) {
        return res.status(404).json({
          success: false,
          message: "Restaurant not found",
        })
      }

      // ✅ Create new menu item
      const menuItem = new MenuItem({
        ...req.body,
        restaurant: new mongoose.Types.ObjectId(restaurant) // Ensure ObjectId
      })
      
      await menuItem.save()

      // Get populated item
      const populatedItem = await MenuItem.findById(menuItem._id)
        .populate("restaurant", "name")
        .lean()

      res.status(201).json({
        success: true,
        message: "Menu item added successfully",
        data: populatedItem,
      })
    } catch (error) {
      console.error("Add menu item error:", error)
      res.status(500).json({
        success: false,
        message: "Server error",
      })
    }
  }
)

// @route   PUT /api/menu/:id
// @desc    Update menu item (Admin only)
// @access  Private (Admin)
router.put(
  "/:id",
  adminAuth,
  [
    param("id").custom(value => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Invalid menu item ID format")
      }
      return true
    })
  ],
  async (req, res) => {
    try {
      const { id } = req.params

      // ✅ Check if item exists
      const menuItem = await MenuItem.findById(id)
      if (!menuItem) {
        return res.status(404).json({
          success: false,
          message: "Menu item not found",
        })
      }

      // ✅ Update item
      const updatedItem = await MenuItem.findByIdAndUpdate(
        id,
        { ...req.body },
        {
          new: true,
          runValidators: true,
        }
      )
        .populate("restaurant", "name")
        .lean()

      res.json({
        success: true,
        message: "Menu item updated successfully",
        data: updatedItem,
      })
    } catch (error) {
      console.error("Update menu item error:", error)
      res.status(500).json({
        success: false,
        message: "Server error",
      })
    }
  }
)

// @route   DELETE /api/menu/:id
// @desc    Delete menu item (Admin only)
// @access  Private (Admin)
router.delete(
  "/:id",
  adminAuth,
  [
    param("id").custom(value => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Invalid menu item ID format")
      }
      return true
    })
  ],
  async (req, res) => {
    try {
      const { id } = req.params

      // ✅ Check if item exists
      const menuItem = await MenuItem.findById(id)
      if (!menuItem) {
        return res.status(404).json({
          success: false,
          message: "Menu item not found",
        })
      }

      // ✅ Delete item
      await MenuItem.findByIdAndDelete(id)

      res.json({
        success: true,
        message: "Menu item deleted successfully",
      })
    } catch (error) {
      console.error("Delete menu item error:", error)
      res.status(500).json({
        success: false,
        message: "Server error",
      })
    }
  }
)

// @route   PATCH /api/menu/:id/availability
// @desc    Toggle menu item availability (Admin only)
// @access  Private (Admin)
router.patch(
  "/:id/availability",
  adminAuth,
  [
    param("id").custom(value => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Invalid menu item ID format")
      }
      return true
    }),
    body("isAvailable").isBoolean().withMessage("isAvailable must be a boolean")
  ],
  async (req, res) => {
    try {
      const { id } = req.params
      const { isAvailable } = req.body

      const menuItem = await MenuItem.findByIdAndUpdate(
        id,
        { isAvailable },
        { new: true }
      ).lean()

      if (!menuItem) {
        return res.status(404).json({
          success: false,
          message: "Menu item not found",
        })
      }

      res.json({
        success: true,
        message: `Item ${isAvailable ? "available" : "unavailable"} successfully`,
        data: menuItem,
      })
    } catch (error) {
      console.error("Toggle availability error:", error)
      res.status(500).json({
        success: false,
        message: "Server error",
      })
    }
  }
)

// @route   POST /api/menu/bulk
// @desc    Add multiple menu items (Admin only)
// @access  Private (Admin)
router.post(
  "/bulk",
  adminAuth,
  [
    body("items").isArray({ min: 1 }).withMessage("At least one item is required"),
    body("items.*.restaurant").isMongoId(),
    body("items.*.name").notEmpty(),
    body("items.*.price").isFloat({ min: 0 }),
  ],
  async (req, res) => {
    try {
      const { items } = req.body

      // ✅ Add restaurant ID to each item
      const itemsWithRestaurant = items.map(item => ({
        ...item,
        restaurant: new mongoose.Types.ObjectId(item.restaurant)
      }))

      const savedItems = await MenuItem.insertMany(itemsWithRestaurant)

      res.status(201).json({
        success: true,
        message: `${savedItems.length} items added successfully`,
        data: savedItems,
      })
    } catch (error) {
      console.error("Bulk add error:", error)
      res.status(500).json({
        success: false,
        message: "Server error",
      })
    }
  }
)

// @route   GET /api/menu/categories/list
// @desc    Get all available categories
// @access  Public
router.get("/categories/list", async (req, res) => {
  try {
    const categories = await MenuItem.distinct("category")
    res.json({
      success: true,
      data: categories.sort(),
    })
  } catch (error) {
    console.error("Get categories error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

module.exports = router