const express = require("express")
const { body, validationResult } = require("express-validator")
const Cart = require("../models/Cart")
const MenuItem = require("../models/MenuItem")
const Restaurant = require("../models/Restaurant")
const { auth } = require("../middleware/auth")

const router = express.Router()

// @route   GET /api/cart
// @desc    Get user's cart
// @access  Private
router.get("/", auth, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id })
      .populate("restaurant", "name images.logo deliveryInfo")
      .populate("items.menuItem", "name price images isAvailable")

    if (!cart) {
      return res.json({
        success: true,
        data: {
          items: [],
          totals: { subtotal: 0, itemCount: 0 },
          restaurant: null,
        },
      })
    }

    // Calculate totals
    let subtotal = 0
    let itemCount = 0

    const validItems = cart.items.filter((item) => {
      if (!item.menuItem || !item.menuItem.isAvailable) {
        return false
      }

      let itemPrice = item.menuItem.price

      // Add customization costs
      if (item.customizations) {
        for (const customization of item.customizations) {
          for (const option of customization.selectedOptions) {
            itemPrice += option.price || 0
          }
        }
      }

      const itemTotal = itemPrice * item.quantity
      subtotal += itemTotal
      itemCount += item.quantity

      // Add calculated price to item
      item.calculatedPrice = itemPrice
      item.itemTotal = itemTotal

      return true
    })

    // Update cart if items were removed
    if (validItems.length !== cart.items.length) {
      cart.items = validItems
      cart.totals = { subtotal, itemCount }
      await cart.save()
    }

    res.json({
      success: true,
      data: {
        ...cart.toObject(),
        items: validItems,
        totals: { subtotal, itemCount },
      },
    })
  } catch (error) {
    console.error("Get cart error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @route   POST /api/cart/add
// @desc    Add item to cart
// @access  Private
router.post(
  "/add",
  auth,
  [
    body("menuItem").isMongoId().withMessage("Valid menu item ID is required"),
    body("quantity").isInt({ min: 1 }).withMessage("Quantity must be at least 1"),
    body("customizations").optional().isArray().withMessage("Customizations must be an array"),
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

      const { menuItem: menuItemId, quantity, customizations, specialInstructions } = req.body

      // Verify menu item exists and is available
      const menuItem = await MenuItem.findById(menuItemId).populate("restaurant")
      if (!menuItem || !menuItem.isAvailable) {
        return res.status(400).json({
          success: false,
          message: "Menu item is not available",
        })
      }

      // Verify restaurant is active
      if (!menuItem.restaurant.isActive || menuItem.restaurant.status !== "approved") {
        return res.status(400).json({
          success: false,
          message: "Restaurant is not available",
        })
      }

      let cart = await Cart.findOne({ user: req.user.id })

      // If cart doesn't exist, create new one
      if (!cart) {
        cart = new Cart({
          user: req.user.id,
          restaurant: menuItem.restaurant._id,
          items: [],
        })
      }

      // If cart has items from different restaurant, clear it
      if (cart.restaurant && cart.restaurant.toString() !== menuItem.restaurant._id.toString()) {
        cart.items = []
        cart.restaurant = menuItem.restaurant._id
      }

      // Check if item already exists in cart
      const existingItemIndex = cart.items.findIndex((item) => {
        return (
          item.menuItem.toString() === menuItemId &&
          JSON.stringify(item.customizations) === JSON.stringify(customizations || [])
        )
      })

      if (existingItemIndex > -1) {
        // Update quantity of existing item
        cart.items[existingItemIndex].quantity += quantity
        cart.items[existingItemIndex].specialInstructions =
          specialInstructions || cart.items[existingItemIndex].specialInstructions
      } else {
        // Add new item to cart
        cart.items.push({
          menuItem: menuItemId,
          quantity,
          customizations: customizations || [],
          specialInstructions: specialInstructions || "",
        })
      }

      await cart.save()

      // Populate and return updated cart
      const updatedCart = await Cart.findById(cart._id)
        .populate("restaurant", "name images.logo deliveryInfo")
        .populate("items.menuItem", "name price images")

      res.json({
        success: true,
        message: "Item added to cart",
        data: updatedCart,
      })
    } catch (error) {
      console.error("Add to cart error:", error)
      res.status(500).json({
        success: false,
        message: "Server error",
      })
    }
  },
)

// @route   PUT /api/cart/update/:itemId
// @desc    Update cart item quantity
// @access  Private
router.put(
  "/update/:itemId",
  auth,
  [body("quantity").isInt({ min: 0 }).withMessage("Quantity must be a non-negative integer")],
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

      const { quantity } = req.body

      const cart = await Cart.findOne({ user: req.user.id })
      if (!cart) {
        return res.status(404).json({
          success: false,
          message: "Cart not found",
        })
      }

      const itemIndex = cart.items.findIndex((item) => item._id.toString() === req.params.itemId)
      if (itemIndex === -1) {
        return res.status(404).json({
          success: false,
          message: "Item not found in cart",
        })
      }

      if (quantity === 0) {
        // Remove item from cart
        cart.items.splice(itemIndex, 1)
      } else {
        // Update quantity
        cart.items[itemIndex].quantity = quantity
      }

      await cart.save()

      // Populate and return updated cart
      const updatedCart = await Cart.findById(cart._id)
        .populate("restaurant", "name images.logo deliveryInfo")
        .populate("items.menuItem", "name price images")

      res.json({
        success: true,
        message: "Cart updated successfully",
        data: updatedCart,
      })
    } catch (error) {
      console.error("Update cart error:", error)
      res.status(500).json({
        success: false,
        message: "Server error",
      })
    }
  },
)

// @route   DELETE /api/cart/remove/:itemId
// @desc    Remove item from cart
// @access  Private
router.delete("/remove/:itemId", auth, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id })
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      })
    }

    const itemIndex = cart.items.findIndex((item) => item._id.toString() === req.params.itemId)
    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Item not found in cart",
      })
    }

    cart.items.splice(itemIndex, 1)
    await cart.save()

    // Populate and return updated cart
    const updatedCart = await Cart.findById(cart._id)
      .populate("restaurant", "name images.logo deliveryInfo")
      .populate("items.menuItem", "name price images")

    res.json({
      success: true,
      message: "Item removed from cart",
      data: updatedCart,
    })
  } catch (error) {
    console.error("Remove from cart error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @route   DELETE /api/cart/clear
// @desc    Clear entire cart
// @access  Private
router.delete("/clear", auth, async (req, res) => {
  try {
    await Cart.findOneAndDelete({ user: req.user.id })

    res.json({
      success: true,
      message: "Cart cleared successfully",
    })
  } catch (error) {
    console.error("Clear cart error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

module.exports = router
