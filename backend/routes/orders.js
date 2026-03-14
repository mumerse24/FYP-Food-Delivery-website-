const express = require("express")
const { body, validationResult, query } = require("express-validator")
const Order = require("../models/Order")
const Cart = require("../models/Cart")
const Restaurant = require("../models/Restaurant")
const MenuItem = require("../models/MenuItem")
const { auth, restaurantAuth } = require("../middleware/auth")

const router = express.Router()

// @route   POST /api/orders
// @desc    Create new order
// @access  Private
router.post(
  "/",
  auth,
  [
    body("restaurant").isMongoId().withMessage("Valid restaurant ID is required"),
    body("items").isArray({ min: 1 }).withMessage("At least one item is required"),
    body("deliveryAddress.street").notEmpty().withMessage("Street address is required"),
    body("deliveryAddress.city").notEmpty().withMessage("City is required"),
    body("deliveryAddress.state").notEmpty().withMessage("State is required"),
    body("deliveryAddress.zipCode").notEmpty().withMessage("Zip code is required"),
    body("contactInfo.phone").isMobilePhone().withMessage("Valid phone number is required"),
    body("contactInfo.email").isEmail().withMessage("Valid email is required"),
    body("paymentInfo.method")
      .isIn(["Cash", "Card", "Digital Wallet", "Online Payment"])
      .withMessage("Invalid payment method"),
    body("orderType").optional().isIn(["delivery", "pickup"]).withMessage("Invalid order type"),
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

      const {
        restaurant: restaurantId,
        items,
        deliveryAddress,
        contactInfo,
        paymentInfo,
        orderType = "delivery",
        specialInstructions,
      } = req.body

      // Verify restaurant exists and is active
      const restaurant = await Restaurant.findById(restaurantId)
      if (!restaurant || !restaurant.isActive || restaurant.status !== "approved") {
        return res.status(400).json({
          success: false,
          message: "Restaurant is not available",
        })
      }

      // Verify and calculate items
      let subtotal = 0
      const orderItems = []

      for (const item of items) {
        const menuItem = await MenuItem.findById(item.menuItem)
        if (!menuItem || !menuItem.isAvailable) {
          return res.status(400).json({
            success: false,
            message: `Item ${item.menuItem} is not available`,
          })
        }

        let itemPrice = menuItem.price

        // Calculate customization costs
        if (item.customizations) {
          for (const customization of item.customizations) {
            for (const option of customization.selectedOptions) {
              itemPrice += option.price || 0
            }
          }
        }

        const itemTotal = itemPrice * item.quantity
        subtotal += itemTotal

        orderItems.push({
          menuItem: menuItem._id,
          name: menuItem.name,
          price: menuItem.price,
          quantity: item.quantity,
          customizations: item.customizations || [],
          itemTotal,
          specialInstructions: item.specialInstructions,
        })
      }

      // Calculate pricing
      const deliveryFee = orderType === "delivery" ? restaurant.deliveryInfo.deliveryFee : 0
      const serviceFee = Math.round(subtotal * 0.05) // 5% service fee
      const tax = Math.round(subtotal * 0.08) // 8% tax
      const total = subtotal + deliveryFee + serviceFee + tax

      // Check minimum order requirement
      if (orderType === "delivery" && subtotal < restaurant.deliveryInfo.minimumOrder) {
        return res.status(400).json({
          success: false,
          message: `Minimum order amount is $${restaurant.deliveryInfo.minimumOrder}`,
        })
      }

      // Calculate estimated delivery time
      const estimatedDeliveryTime = new Date()
      const deliveryMinutes = orderType === "delivery" ? 45 : 20 // 45 mins for delivery, 20 for pickup
      estimatedDeliveryTime.setMinutes(estimatedDeliveryTime.getMinutes() + deliveryMinutes)

      // Create order
      const order = new Order({
        customer: req.user.id,
        restaurant: restaurantId,
        items: orderItems,
        pricing: {
          subtotal,
          deliveryFee,
          serviceFee,
          tax,
          total,
        },
        deliveryAddress,
        contactInfo,
        paymentInfo,
        orderType,
        estimatedDeliveryTime,
        specialInstructions,
      })

      await order.save()

      // Clear user's cart after successful order
      await Cart.findOneAndDelete({ user: req.user.id })

      // Update restaurant stats
      await Restaurant.findByIdAndUpdate(restaurantId, {
        $inc: { totalOrders: 1, totalRevenue: total },
      })

      // Populate order details
      const populatedOrder = await Order.findById(order._id)
        .populate("customer", "name email phone")
        .populate("restaurant", "name phone address images.logo")
        .populate("items.menuItem", "name images")

      res.status(201).json({
        success: true,
        message: "Order placed successfully",
        data: populatedOrder,
      })
    } catch (error) {
      console.error("Create order error:", error)
      res.status(500).json({
        success: false,
        message: "Server error",
      })
    }
  },
)

// @route   GET /api/orders
// @desc    Get user's orders
// @access  Private
router.get(
  "/",
  auth,
  [
    query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
    query("limit").optional().isInt({ min: 1, max: 50 }).withMessage("Limit must be between 1 and 50"),
    query("status").optional().isString().withMessage("Status must be a string"),
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

      const { page = 1, limit = 10, status } = req.query

      // Build query
      const query = { customer: req.user.id }
      if (status) {
        query.status = status
      }

      const orders = await Order.find(query)
        .populate("restaurant", "name images.logo address phone")
        .populate("items.menuItem", "name images")
        .sort({ createdAt: -1 })
        .limit(Number.parseInt(limit))
        .skip((Number.parseInt(page) - 1) * Number.parseInt(limit))

      const total = await Order.countDocuments(query)

      res.json({
        success: true,
        data: orders,
        pagination: {
          current: Number.parseInt(page),
          pages: Math.ceil(total / Number.parseInt(limit)),
          total,
          limit: Number.parseInt(limit),
        },
      })
    } catch (error) {
      console.error("Get orders error:", error)
      res.status(500).json({
        success: false,
        message: "Server error",
      })
    }
  },
)

// @route   GET /api/orders/:id
// @desc    Get single order
// @access  Private
router.get("/:id", auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("customer", "name email phone")
      .populate("restaurant", "name phone address images.logo operatingHours")
      .populate("items.menuItem", "name images description")
      .populate("assignedDriver", "name phone")

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      })
    }

    // Check if user owns this order or is restaurant owner/admin
    const restaurant = await Restaurant.findById(order.restaurant._id)
    const isOwner = order.customer._id.toString() === req.user.id
    const isRestaurantOwner = restaurant && restaurant.owner.toString() === req.user.id
    const isAdmin = req.user.role === "admin"

    if (!isOwner && !isRestaurantOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this order",
      })
    }

    res.json({
      success: true,
      data: order,
    })
  } catch (error) {
    console.error("Get order error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @route   PUT /api/orders/:id/status
// @desc    Update order status
// @access  Private (Restaurant owners)
router.put(
  "/:id/status",
  restaurantAuth,
  [
    body("status")
      .isIn(["confirmed", "preparing", "ready", "picked_up", "out_for_delivery", "delivered", "cancelled"])
      .withMessage("Invalid status"),
    body("note").optional().isString().withMessage("Note must be a string"),
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

      const { status, note } = req.body

      const order = await Order.findById(req.params.id).populate("restaurant")

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        })
      }

      // Check ownership
      if (req.user.role !== "admin" && order.restaurant.owner.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to update this order",
        })
      }

      // Update order status
      order.status = status
      order.timeline.push({
        status,
        timestamp: new Date(),
        note: note || `Order ${status}`,
      })

      // Set delivery time if delivered
      if (status === "delivered") {
        order.actualDeliveryTime = new Date()
      }

      await order.save()

      res.json({
        success: true,
        message: "Order status updated successfully",
        data: order,
      })
    } catch (error) {
      console.error("Update order status error:", error)
      res.status(500).json({
        success: false,
        message: "Server error",
      })
    }
  },
)

// @route   POST /api/orders/:id/cancel
// @desc    Cancel order
// @access  Private
router.post(
  "/:id/cancel",
  auth,
  [body("reason").optional().isString().withMessage("Reason must be a string")],
  async (req, res) => {
    try {
      const { reason } = req.body

      const order = await Order.findById(req.params.id).populate("restaurant")

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        })
      }

      // Check if user can cancel (customer or restaurant owner)
      const isCustomer = order.customer.toString() === req.user.id
      const isRestaurantOwner = order.restaurant.owner.toString() === req.user.id
      const isAdmin = req.user.role === "admin"

      if (!isCustomer && !isRestaurantOwner && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to cancel this order",
        })
      }

      // Check if order can be cancelled
      if (["delivered", "cancelled", "refunded"].includes(order.status)) {
        return res.status(400).json({
          success: false,
          message: "Order cannot be cancelled",
        })
      }

      // Update order
      order.status = "cancelled"
      order.cancellationReason = reason || "Cancelled by user"
      order.timeline.push({
        status: "cancelled",
        timestamp: new Date(),
        note: reason || "Order cancelled",
      })

      await order.save()

      res.json({
        success: true,
        message: "Order cancelled successfully",
        data: order,
      })
    } catch (error) {
      console.error("Cancel order error:", error)
      res.status(500).json({
        success: false,
        message: "Server error",
      })
    }
  },
)

// @route   POST /api/orders/:id/rate
// @desc    Rate order
// @access  Private (Customers only)
router.post(
  "/:id/rate",
  auth,
  [
    body("food").isInt({ min: 1, max: 5 }).withMessage("Food rating must be between 1 and 5"),
    body("delivery").optional().isInt({ min: 1, max: 5 }).withMessage("Delivery rating must be between 1 and 5"),
    body("overall").isInt({ min: 1, max: 5 }).withMessage("Overall rating must be between 1 and 5"),
    body("comment").optional().isString().withMessage("Comment must be a string"),
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

      const { food, delivery, overall, comment } = req.body

      const order = await Order.findById(req.params.id)

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        })
      }

      // Check if customer owns this order
      if (order.customer.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to rate this order",
        })
      }

      // Check if order is delivered
      if (order.status !== "delivered") {
        return res.status(400).json({
          success: false,
          message: "Can only rate delivered orders",
        })
      }

      // Check if already rated
      if (order.rating.ratedAt) {
        return res.status(400).json({
          success: false,
          message: "Order already rated",
        })
      }

      // Update rating
      order.rating = {
        food,
        delivery: delivery || food,
        overall,
        comment: comment || "",
        ratedAt: new Date(),
      }

      await order.save()

      // Update restaurant rating
      const restaurant = await Restaurant.findById(order.restaurant)
      const orders = await Order.find({
        restaurant: order.restaurant,
        "rating.ratedAt": { $exists: true },
      })

      const totalRating = orders.reduce((sum, ord) => sum + ord.rating.overall, 0)
      const averageRating = totalRating / orders.length

      restaurant.rating.average = Math.round(averageRating * 10) / 10
      restaurant.rating.count = orders.length
      await restaurant.save()

      res.json({
        success: true,
        message: "Order rated successfully",
        data: order,
      })
    } catch (error) {
      console.error("Rate order error:", error)
      res.status(500).json({
        success: false,
        message: "Server error",
      })
    }
  },
)

// @route   GET /api/orders/restaurant/:restaurantId
// @desc    Get restaurant orders
// @access  Private (Restaurant owners)
router.get(
  "/restaurant/:restaurantId",
  restaurantAuth,
  [
    query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
    query("limit").optional().isInt({ min: 1, max: 50 }).withMessage("Limit must be between 1 and 50"),
    query("status").optional().isString().withMessage("Status must be a string"),
    query("date").optional().isISO8601().withMessage("Date must be in ISO format"),
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

      const { page = 1, limit = 20, status, date } = req.query

      // Verify restaurant ownership
      const restaurant = await Restaurant.findById(req.params.restaurantId)
      if (!restaurant) {
        return res.status(404).json({
          success: false,
          message: "Restaurant not found",
        })
      }

      if (req.user.role !== "admin" && restaurant.owner.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to view these orders",
        })
      }

      // Build query
      const query = { restaurant: req.params.restaurantId }
      if (status) {
        query.status = status
      }
      if (date) {
        const startDate = new Date(date)
        const endDate = new Date(date)
        endDate.setDate(endDate.getDate() + 1)
        query.createdAt = { $gte: startDate, $lt: endDate }
      }

      const orders = await Order.find(query)
        .populate("customer", "name phone")
        .populate("items.menuItem", "name")
        .sort({ createdAt: -1 })
        .limit(Number.parseInt(limit))
        .skip((Number.parseInt(page) - 1) * Number.parseInt(limit))

      const total = await Order.countDocuments(query)

      res.json({
        success: true,
        data: orders,
        pagination: {
          current: Number.parseInt(page),
          pages: Math.ceil(total / Number.parseInt(limit)),
          total,
          limit: Number.parseInt(limit),
        },
      })
    } catch (error) {
      console.error("Get restaurant orders error:", error)
      res.status(500).json({
        success: false,
        message: "Server error",
      })
    }
  },
)

module.exports = router
