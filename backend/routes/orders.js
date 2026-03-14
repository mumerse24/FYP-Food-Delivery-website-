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
    body("deliveryAddress.street")
      .if(body("orderType").equals("delivery"))
      .notEmpty()
      .withMessage("Street address is required for delivery"),
    body("deliveryAddress.city")
      .if(body("orderType").equals("delivery"))
      .notEmpty()
      .withMessage("City is required for delivery"),
    body("deliveryAddress.state")
      .if(body("orderType").equals("delivery"))
      .notEmpty()
      .withMessage("State is required for delivery"),
    body("deliveryAddress.zipCode")
      .if(body("orderType").equals("delivery"))
      .notEmpty()
      .withMessage("Zip code is required for delivery"),
    body("contactInfo.phone").isMobilePhone().withMessage("Valid phone number is required"),
    body("contactInfo.email").isEmail().withMessage("Valid email is required"),
    body("paymentInfo.method")
      .isIn(["Cash", "Card", "Digital Wallet", "Online Payment"])
      .withMessage("Invalid payment method"),
    body("orderType")
      .optional()
      .isIn(["delivery", "pickup", "dine-in"])
      .withMessage("Invalid order type"),
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
        tableNumber,
        paymentDetails,
      } = req.body

      console.log("Order body received for processing:", JSON.stringify(req.body, null, 2))

      // Verify restaurant exists and is active
      const restaurant = await Restaurant.findById(restaurantId)
      if (!restaurant) {
        return res.status(400).json({ success: false, message: "Restaurant not found" })
      }

      if (!restaurant.isActive || restaurant.status !== "approved") {
        return res.status(400).json({
          success: false,
          message: `Restaurant is currently ${restaurant.status || 'inactive'}`,
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
            message: `Item ${item.name || item.menuItem} is not available`,
          })
        }

        let itemPrice = menuItem.price

        // Calculate customization costs
        if (item.customizations && Array.isArray(item.customizations)) {
          for (const customization of item.customizations) {
            if (customization.selectedOptions && Array.isArray(customization.selectedOptions)) {
              for (const option of customization.selectedOptions) {
                itemPrice += Number(option.price) || 0
              }
            }
          }
        }

        const quantity = Number(item.quantity) || 1
        const itemTotal = itemPrice * quantity
        subtotal += itemTotal

        orderItems.push({
          menuItem: menuItem._id,
          name: menuItem.name || item.name,
          price: menuItem.price,
          quantity: quantity,
          customizations: item.customizations || [],
          itemTotal,
          specialInstructions: item.specialInstructions || "",
        })
      }

      // Calculate pricing
      const deliveryFee = orderType === "delivery" ? (Number(restaurant.deliveryInfo?.deliveryFee) || 0) : 0
      const serviceFee = Math.round(subtotal * 0.05) // 5% service fee
      const tax = Math.round(subtotal * 0.08) // 8% tax
      const total = subtotal + deliveryFee + serviceFee + tax

      console.log("Pricing details computed:", { subtotal, deliveryFee, serviceFee, tax, total })

      // Check minimum order requirement
      const minOrder = Number(restaurant.deliveryInfo?.minimumOrder) || 0
      if (orderType === "delivery" && subtotal < minOrder) {
        return res.status(400).json({
          success: false,
          message: `Minimum order amount is Rs. ${minOrder}. (Subtotal: Rs. ${subtotal})`,
        })
      }

      // Calculate estimated delivery time (Fallback to 45 mins if not available)
      const estimatedDeliveryTime = new Date()
      const deliveryMinutes = orderType === "delivery" ? 45 : 20
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
        deliveryAddress: {
          street: (deliveryAddress && deliveryAddress.street) || "N/A",
          city: (deliveryAddress && deliveryAddress.city) || "N/A",
          state: (deliveryAddress && deliveryAddress.state) || "N/A",
          zipCode: (deliveryAddress && deliveryAddress.zipCode) || "N/A",
        },
        contactInfo: {
          phone: contactInfo.phone,
          email: contactInfo.email || "N/A",
          fullName: contactInfo.fullName || "N/A" // Some schemas might use this
        },
        paymentInfo: {
          method: (paymentInfo && typeof paymentInfo === 'object' ? paymentInfo.method : paymentInfo) || "cash",
          status: "pending",
          mobileNumber: paymentDetails?.mobileNumber || "",
          cardLast4: paymentDetails?.cardNumber || "",
          cardName: paymentDetails?.cardName || ""
        },
        orderType,
        tableNumber: tableNumber || "",
        estimatedDeliveryTime,
        specialInstructions: specialInstructions || "",
      })

      await order.save()
      console.log("New order saved ID:", order._id)

      // ✅ 3. Send Notification to Admin
      try {
        const admin = require("firebase-admin")
        const User = require("../models/User")
        const Admin = require("../models/Admin")

        // Find admins from both collections
        const [usersAdmin, adminsCollection] = await Promise.all([
          User.find({ role: "admin", fcmTokens: { $exists: true, $not: { $size: 0 } } }),
          Admin.find({ fcmTokens: { $exists: true, $not: { $size: 0 } } })
        ])

        const allAdmins = [...usersAdmin, ...adminsCollection]
        const fcmTokens = Array.from(new Set(allAdmins.flatMap(adm => adm.fcmTokens)))

        console.log(`🔔 Found ${allAdmins.length} potential admins. Total unique tokens: ${fcmTokens.length}`)

        if (fcmTokens.length > 0) {
          const response = await admin.messaging().sendEachForMulticast({
            tokens: fcmTokens,
            notification: {
              title: "🚀 New Order Received!",
              body: `Order #${order.orderNumber || order._id.slice(-8)} for Rs. ${total}`,
            },
            data: {
              orderId: order._id.toString(),
              type: "NEW_ORDER"
            },
          })
          console.log(`✅ FCM Broadcast Result: ${response.successCount} success, ${response.failureCount} failure`)
        } else {
          console.warn("⚠️ No FCM tokens found for any admins")
        }
      } catch (notifyErr) {
        console.error("❌ Notification error:", notifyErr.message)
      }

      // Clear user's cart after successful order
      try {
        await Cart.findOneAndDelete({ user: req.user.id })
      } catch (cartErr) {
        console.warn("Failed to clear cart, but order was saved:", cartErr.message)
      }

      // Update restaurant stats
      try {
        await Restaurant.findByIdAndUpdate(restaurantId, {
          $inc: { totalOrders: 1, totalRevenue: total },
        })
      } catch (restErr) {
        console.warn("Failed to update restaurant stats:", restErr.message)
      }

      // Populate order details for response
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
      console.error("CRITICAL: Create order error:", error)
      res.status(500).json({
        success: false,
        message: "Server error: " + error.message,
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
      .isIn(["confirmed", "preparing", "ready", "picked_up", "out_for_delivery", "delivered", "cancelled", "rejected"])
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

      // 🏆 Award Loyalty Points if delivered
      if (status === "delivered") {
        try {
          const User = require("../models/User");
          const pointsToEarn = Math.floor((order.pricing?.total || 0) / 100);
          if (pointsToEarn > 0) {
            await User.findByIdAndUpdate(order.customer, {
              $inc: { loyaltyPoints: pointsToEarn }
            });
            console.log(`🏆 Awarded ${pointsToEarn} loyalty points to customer ${order.customer}`);
          }
        } catch (loyaltyErr) {
          console.error("Loyalty Points Award Error:", loyaltyErr.message);
        }
      }

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

// @route   PUT /api/orders/:id
// @desc    Modify order (pending only)
// @access  Private
router.put(
  "/:id",
  auth,
  [
    body("items").isArray({ min: 1 }).withMessage("At least one item is required"),
  ],
  async (req, res) => {
    try {
      const { items: newItems } = req.body

      const order = await Order.findById(req.params.id).populate("restaurant")

      if (!order) {
        return res.status(404).json({ success: false, message: "Order not found" })
      }

      // Check ownership
      if (order.customer.toString() !== req.user.id) {
        return res.status(403).json({ success: false, message: "Not authorized" })
      }

      // Check status
      if (order.status !== "pending") {
        return res.status(400).json({ success: false, message: "Only pending orders can be modified" })
      }

      // Verify and calculate new items
      let subtotal = 0
      const orderItems = []

      for (const item of newItems) {
        const menuItem = await MenuItem.findById(item.menuItem)
        if (!menuItem || !menuItem.isAvailable) {
          return res.status(400).json({
            success: false,
            message: `Item ${item.name || item.menuItem} is not available`,
          })
        }

        let itemPrice = menuItem.price

        // Calculate customization costs
        if (item.customizations && Array.isArray(item.customizations)) {
          for (const customization of item.customizations) {
            if (customization.selectedOptions && Array.isArray(customization.selectedOptions)) {
              for (const option of customization.selectedOptions) {
                itemPrice += Number(option.price) || 0
              }
            }
          }
        }

        const quantity = Number(item.quantity) || 1
        const itemTotal = itemPrice * quantity
        subtotal += itemTotal

        orderItems.push({
          menuItem: menuItem._id,
          name: menuItem.name || item.name,
          price: menuItem.price,
          quantity: quantity,
          customizations: item.customizations || [],
          itemTotal,
          specialInstructions: item.specialInstructions || "",
        })
      }

      // Recalculate pricing
      const restaurant = order.restaurant
      const deliveryFee = order.orderType === "delivery" ? (Number(restaurant.deliveryInfo?.deliveryFee) || 0) : 0
      const serviceFee = Math.round(subtotal * 0.05)
      const tax = Math.round(subtotal * 0.08)
      const total = subtotal + deliveryFee + serviceFee + tax

      // Update order
      order.items = orderItems
      order.pricing = {
        subtotal,
        deliveryFee,
        serviceFee,
        tax,
        total,
      }
      order.timeline.push({
        status: "modified",
        timestamp: new Date(),
        note: "Order modified by customer",
      })

      await order.save()

      // Notify Admin about modification
      try {
        const admin = require("firebase-admin")
        const User = require("../models/User")
        const Admin = require("../models/Admin")

        const [usersAdmin, adminsCollection] = await Promise.all([
          User.find({ role: "admin", fcmTokens: { $exists: true, $not: { $size: 0 } } }),
          Admin.find({ fcmTokens: { $exists: true, $not: { $size: 0 } } })
        ])

        const allAdmins = [...usersAdmin, ...adminsCollection]
        const fcmTokens = Array.from(new Set(allAdmins.flatMap(adm => adm.fcmTokens)))

        if (fcmTokens.length > 0) {
          await admin.messaging().sendEachForMulticast({
            tokens: fcmTokens,
            notification: {
              title: "📝 Order Modified",
              body: `Order #${order.orderNumber} has been updated by the customer.`,
            },
            data: {
              orderId: order._id.toString(),
              type: "ORDER_MODIFIED"
            },
          })
        }
      } catch (notifyErr) {
        console.error("❌ Notification error:", notifyErr.message)
      }

      res.json({
        success: true,
        message: "Order modified successfully",
        data: order,
      })
    } catch (error) {
      console.error("Modify order error:", error)
      res.status(500).json({ success: false, message: "Server error" })
    }
  },
)

module.exports = router
