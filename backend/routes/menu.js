const express = require("express")
const { body, validationResult, query } = require("express-validator")
const MenuItem = require("../models/MenuItem")
const Restaurant = require("../models/Restaurant")
const { auth, restaurantAuth } = require("../middleware/auth")

const router = express.Router()

// @route   GET /api/menu/restaurant/:restaurantId
// @desc    Get menu items for a specific restaurant
// @access  Public
// @route   GET /api/menu/restaurant/:restaurantId
// @desc    Get menu items for a specific restaurant
// @access  Public
router.get(
  "/restaurant/:restaurantId",
  [
    query("category").optional().isString().withMessage("Category must be a string"),
    query("search").optional().isString().withMessage("Search must be a string"),
    query("available").optional().isBoolean().withMessage("Available must be a boolean"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        })
      }

      const { category, search, available = true } = req.query

      // Build query
      const query = { restaurant: req.params.restaurantId }

      if (available === "true") {
        query.isAvailable = true
      }

      if (category) {
        query.category = category
      }

      if (search) {
        query.$text = { $search: search }
      }

      const menuItems = await MenuItem.find(query)
        .populate("restaurant", "name")
        .sort({ category: 1, name: 1 })

      // ✅ STEP 1 & 2: Remove grouping, send array directly
      res.json({
        success: true,
        data: menuItems,   // ✅ array
        total: menuItems.length,
      })
    } catch (error) {
      console.error("Get menu items error:", error)
      res.status(500).json({
        success: false,
        message: "Server error",
      })
    }
  },
)


// @route   GET /api/menu/:id
// @desc    Get single menu item
// @access  Public
router.get("/:id", async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id).populate("restaurant", "name images.logo")

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
})

// @route   POST /api/menu
// @desc    Add new menu item
// @access  Private (Restaurant owners)
router.post(
  "/",
  restaurantAuth,
  [
    body("restaurant").isMongoId().withMessage("Valid restaurant ID is required"),
    body("name").trim().isLength({ min: 2, max: 100 }).withMessage("Name must be between 2 and 100 characters"),
    body("description")
      .trim()
      .isLength({ min: 10, max: 300 })
      .withMessage("Description must be between 10 and 300 characters"),
    body("category").notEmpty().withMessage("Category is required"),
    body("price").isFloat({ min: 0 }).withMessage("Price must be a positive number"),
    body("images").isArray({ min: 1 }).withMessage("At least one image is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        })
      }

      // Verify restaurant ownership
      const restaurant = await Restaurant.findById(req.body.restaurant)
      if (!restaurant) {
        return res.status(404).json({
          success: false,
          message: "Restaurant not found",
        })
      }

      if (req.user.role !== "admin" && restaurant.owner.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to add items to this restaurant",
        })
      }

      const menuItem = new MenuItem(req.body)
      await menuItem.save()

      const populatedItem = await MenuItem.findById(menuItem._id).populate("restaurant", "name")

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
  },
)

// @route   PUT /api/menu/:id
// @desc    Update menu item
// @access  Private (Restaurant owners)
router.put("/:id", restaurantAuth, async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id).populate("restaurant")

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found",
      })
    }

    // Check ownership
    if (req.user.role !== "admin" && menuItem.restaurant.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this menu item",
      })
    }

    const updatedItem = await MenuItem.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("restaurant", "name")

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
})

// @route   DELETE /api/menu/:id
// @desc    Delete menu item
// @access  Private (Restaurant owners)
router.delete("/:id", restaurantAuth, async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id).populate("restaurant")

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found",
      })
    }

    // Check ownership
    if (req.user.role !== "admin" && menuItem.restaurant.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this menu item",
      })
    }

    await MenuItem.findByIdAndDelete(req.params.id)

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
})

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
