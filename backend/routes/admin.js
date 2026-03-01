const express = require("express")
const { body, validationResult, query } = require("express-validator")
const User = require("../models/User")
const Restaurant = require("../models/Restaurant")
const Order = require("../models/Order")
const MenuItem = require("../models/MenuItem")
const { adminAuth } = require("../middleware/auth")

const router = express.Router()

// @route   POST /api/admin/login
// @desc    Admin login
// @access  Public
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body

    // ✅ Find admin
    const admin = await User.findOne({ email, role: "admin" })
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      })
    }

    // ✅ Compare password
    const isMatch = await admin.comparePassword(password)
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      })
    }

    // ✅ Create token
    const jwt = require("jsonwebtoken")
    const token = jwt.sign(
      { id: admin._id, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    )

    res.json({
      success: true,
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
      },
    })
  } catch (error) {
    console.error("Admin login error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard statistics
// @access  Private (Admin only)
router.get("/dashboard", adminAuth, async (req, res) => {
  try {
    const { period = "30" } = req.query // days
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - Number.parseInt(period))

    // Get overall statistics
    const [
      totalUsers,
      totalRestaurants,
      totalOrders,
      totalRevenue,
      pendingRestaurants,
      activeOrders,
      recentUsers,
      recentOrders,
      ordersByStatus,
      revenueByPeriod,
    ] = await Promise.all([
      // Total counts
      User.countDocuments({ role: "customer" }),
      Restaurant.countDocuments({ status: "approved" }),
      Order.countDocuments(),
      Order.aggregate([{ $group: { _id: null, total: { $sum: "$pricing.total" } } }]),

      // Pending items
      Restaurant.countDocuments({ status: "pending" }),
      Order.countDocuments({ status: { $in: ["confirmed", "preparing", "ready", "out_for_delivery"] } }),

      // Recent activity
      User.find({ role: "customer" })
        .sort({ createdAt: -1 })
        .limit(5)
        .select("name email createdAt"),
      Order.find()
        .populate("customer", "name")
        .populate("restaurant", "name")
        .sort({ createdAt: -1 })
        .limit(10)
        .select("orderNumber customer restaurant pricing.total status createdAt"),

      // Analytics
      Order.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      Order.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            revenue: { $sum: "$pricing.total" },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ])

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalRestaurants,
          totalOrders,
          totalRevenue: totalRevenue[0]?.total || 0,
          pendingRestaurants,
          activeOrders,
        },
        recentActivity: {
          users: recentUsers,
          orders: recentOrders,
        },
        analytics: {
          ordersByStatus,
          revenueByPeriod,
        },
      },
    })
  } catch (error) {
    console.error("Get admin dashboard error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @route   GET /api/admin/users
// @desc    Get all users with filtering and pagination
// @access  Private (Admin only)
router.get(
  "/users",
  adminAuth,
  [
    query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
    query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
    query("role").optional().isIn(["customer", "restaurant", "admin"]).withMessage("Invalid role"),
    query("search").optional().isString().withMessage("Search must be a string"),
    query("isActive").optional().isBoolean().withMessage("isActive must be a boolean"),
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

      const { page = 1, limit = 20, role, search, isActive, sortBy = "createdAt", sortOrder = "desc" } = req.query

      // Build query
      const query = {}
      if (role) query.role = role
      if (isActive !== undefined) query.isActive = isActive === "true"
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { phone: { $regex: search, $options: "i" } },
        ]
      }

      // Sort options
      const sortOptions = {}
      sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1

      const users = await User.find(query)
        .select("-password")
        .sort(sortOptions)
        .limit(Number.parseInt(limit))
        .skip((Number.parseInt(page) - 1) * Number.parseInt(limit))

      const total = await User.countDocuments(query)

      res.json({
        success: true,
        data: users,
        pagination: {
          current: Number.parseInt(page),
          pages: Math.ceil(total / Number.parseInt(limit)),
          total,
          limit: Number.parseInt(limit),
        },
      })
    } catch (error) {
      console.error("Get users error:", error)
      res.status(500).json({
        success: false,
        message: "Server error",
      })
    }
  },
)

// @route   PUT /api/admin/users/:id/status
// @desc    Update user status (activate/deactivate)
// @access  Private (Admin only)
router.put(
  "/users/:id/status",
  adminAuth,
  [body("isActive").isBoolean().withMessage("isActive must be a boolean")],
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

      const { isActive } = req.body

      const user = await User.findByIdAndUpdate(req.params.id, { isActive }, { new: true }).select("-password")

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        })
      }

      res.json({
        success: true,
        message: `User ${isActive ? "activated" : "deactivated"} successfully`,
        data: user,
      })
    } catch (error) {
      console.error("Update user status error:", error)
      res.status(500).json({
        success: false,
        message: "Server error",
      })
    }
  },
)

// @route   GET /api/admin/restaurants/pending
// @desc    Get pending restaurant applications
// @access  Private (Admin only)
router.get("/restaurants/pending", adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query

    const restaurants = await Restaurant.find({ status: "pending" })
      .populate("owner", "name email phone")
      .sort({ createdAt: -1 })
      .limit(Number.parseInt(limit))
      .skip((Number.parseInt(page) - 1) * Number.parseInt(limit))

    const total = await Restaurant.countDocuments({ status: "pending" })

    res.json({
      success: true,
      data: restaurants,
      pagination: {
        current: Number.parseInt(page),
        pages: Math.ceil(total / Number.parseInt(limit)),
        total,
        limit: Number.parseInt(limit),
      },
    })
  } catch (error) {
    console.error("Get pending restaurants error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @route   PUT /api/admin/restaurants/:id/approve
// @desc    Approve restaurant application
// @access  Private (Admin only)
router.put(
  "/restaurants/:id/approve",
  adminAuth,
  [body("message").optional().isString().withMessage("Message must be a string")],
  async (req, res) => {
    try {
      const { message } = req.body

      const restaurant = await Restaurant.findByIdAndUpdate(
        req.params.id,
        { status: "approved" },
        { new: true },
      ).populate("owner", "name email")

      if (!restaurant) {
        return res.status(404).json({
          success: false,
          message: "Restaurant not found",
        })
      }

      // TODO: Send approval email to restaurant owner
      // await sendApprovalEmail(restaurant.owner.email, restaurant.name, message)

      res.json({
        success: true,
        message: "Restaurant approved successfully",
        data: restaurant,
      })
    } catch (error) {
      console.error("Approve restaurant error:", error)
      res.status(500).json({
        success: false,
        message: "Server error",
      })
    }
  },
)

// @route   PUT /api/admin/restaurants/:id/reject
// @desc    Reject restaurant application
// @access  Private (Admin only)
router.put(
  "/restaurants/:id/reject",
  adminAuth,
  [body("reason").notEmpty().withMessage("Rejection reason is required")],
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

      const { reason } = req.body

      const restaurant = await Restaurant.findByIdAndUpdate(
        req.params.id,
        { status: "rejected", rejectionReason: reason },
        { new: true },
      ).populate("owner", "name email")

      if (!restaurant) {
        return res.status(404).json({
          success: false,
          message: "Restaurant not found",
        })
      }

      // TODO: Send rejection email to restaurant owner
      // await sendRejectionEmail(restaurant.owner.email, restaurant.name, reason)

      res.json({
        success: true,
        message: "Restaurant rejected successfully",
        data: restaurant,
      })
    } catch (error) {
      console.error("Reject restaurant error:", error)
      res.status(500).json({
        success: false,
        message: "Server error",
      })
    }
  },
)

// @route   GET /api/admin/orders
// @desc    Get all orders with filtering
// @access  Private (Admin only)
router.get(
  "/orders",
  adminAuth,
  [
    query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
    query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
    query("status").optional().isString().withMessage("Status must be a string"),
    query("restaurant").optional().isMongoId().withMessage("Restaurant must be a valid ID"),
    query("customer").optional().isMongoId().withMessage("Customer must be a valid ID"),
    query("dateFrom").optional().isISO8601().withMessage("dateFrom must be a valid date"),
    query("dateTo").optional().isISO8601().withMessage("dateTo must be a valid date"),
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
        page = 1,
        limit = 20,
        status,
        restaurant,
        customer,
        dateFrom,
        dateTo,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = req.query

      // Build query
      const query = {}
      if (status) query.status = status
      if (restaurant) query.restaurant = restaurant
      if (customer) query.customer = customer
      if (dateFrom || dateTo) {
        query.createdAt = {}
        if (dateFrom) query.createdAt.$gte = new Date(dateFrom)
        if (dateTo) query.createdAt.$lte = new Date(dateTo)
      }

      // Sort options
      const sortOptions = {}
      sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1

      const orders = await Order.find(query)
        .populate("customer", "name email phone")
        .populate("restaurant", "name phone")
        .sort(sortOptions)
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
      console.error("Get admin orders error:", error)
      res.status(500).json({
        success: false,
        message: "Server error",
      })
    }
  },
)

// @route   GET /api/admin/analytics/revenue
// @desc    Get revenue analytics
// @access  Private (Admin only)
router.get(
  "/analytics/revenue",
  adminAuth,
  [
    query("period").optional().isIn(["7", "30", "90", "365"]).withMessage("Invalid period"),
    query("groupBy").optional().isIn(["day", "week", "month"]).withMessage("Invalid groupBy"),
  ],
  async (req, res) => {
    try {
      const { period = "30", groupBy = "day" } = req.query

      const startDate = new Date()
      startDate.setDate(startDate.getDate() - Number.parseInt(period))

      let dateFormat
      switch (groupBy) {
        case "week":
          dateFormat = "%Y-W%U"
          break
        case "month":
          dateFormat = "%Y-%m"
          break
        default:
          dateFormat = "%Y-%m-%d"
      }

      const revenueData = await Order.aggregate([
        { $match: { createdAt: { $gte: startDate }, status: { $ne: "cancelled" } } },
        {
          $group: {
            _id: { $dateToString: { format: dateFormat, date: "$createdAt" } },
            revenue: { $sum: "$pricing.total" },
            orders: { $sum: 1 },
            averageOrder: { $avg: "$pricing.total" },
          },
        },
        { $sort: { _id: 1 } },
      ])

      // Get top restaurants by revenue
      const topRestaurants = await Order.aggregate([
        { $match: { createdAt: { $gte: startDate }, status: { $ne: "cancelled" } } },
        {
          $group: {
            _id: "$restaurant",
            revenue: { $sum: "$pricing.total" },
            orders: { $sum: 1 },
          },
        },
        { $sort: { revenue: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: "restaurants",
            localField: "_id",
            foreignField: "_id",
            as: "restaurant",
          },
        },
        { $unwind: "$restaurant" },
        {
          $project: {
            name: "$restaurant.name",
            revenue: 1,
            orders: 1,
          },
        },
      ])

      res.json({
        success: true,
        data: {
          revenueByPeriod: revenueData,
          topRestaurants,
          summary: {
            totalRevenue: revenueData.reduce((sum, item) => sum + item.revenue, 0),
            totalOrders: revenueData.reduce((sum, item) => sum + item.orders, 0),
            averageOrderValue: revenueData.reduce((sum, item) => sum + item.averageOrder, 0) / revenueData.length || 0,
          },
        },
      })
    } catch (error) {
      console.error("Get revenue analytics error:", error)
      res.status(500).json({
        success: false,
        message: "Server error",
      })
    }
  },
)

// @route   GET /api/admin/analytics/orders
// @desc    Get order analytics
// @access  Private (Admin only)
router.get("/analytics/orders", adminAuth, async (req, res) => {
  try {
    const { period = "30" } = req.query
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - Number.parseInt(period))

    const [ordersByStatus, ordersByHour, ordersByDay, popularItems] = await Promise.all([
      // Orders by status
      Order.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      // Orders by hour of day
      Order.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: { $hour: "$createdAt" },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // Orders by day of week
      Order.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: { $dayOfWeek: "$createdAt" },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // Most popular items
      Order.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.menuItem",
            name: { $first: "$items.name" },
            totalOrdered: { $sum: "$items.quantity" },
            revenue: { $sum: "$items.itemTotal" },
          },
        },
        { $sort: { totalOrdered: -1 } },
        { $limit: 10 },
      ]),
    ])

    res.json({
      success: true,
      data: {
        ordersByStatus,
        ordersByHour,
        ordersByDay,
        popularItems,
      },
    })
  } catch (error) {
    console.error("Get order analytics error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @route   POST /api/admin/broadcast
// @desc    Send broadcast notification to users
// @access  Private (Admin only)
router.post(
  "/broadcast",
  adminAuth,
  [
    body("title").notEmpty().withMessage("Title is required"),
    body("message").notEmpty().withMessage("Message is required"),
    body("userType").isIn(["all", "customers", "restaurants"]).withMessage("Invalid user type"),
    body("priority").optional().isIn(["low", "medium", "high"]).withMessage("Invalid priority"),
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

      const { title, message, userType, priority = "medium" } = req.body

      // Build user query based on type
      const userQuery = { isActive: true }
      if (userType === "customers") {
        userQuery.role = "customer"
      } else if (userType === "restaurants") {
        userQuery.role = "restaurant"
      }

      const users = await User.find(userQuery).select("email name")

      // TODO: Implement actual notification sending (email, push, etc.)
      // For now, just log the broadcast
      console.log(`Broadcasting to ${users.length} users:`, { title, message, priority })

      res.json({
        success: true,
        message: `Broadcast sent to ${users.length} users`,
        data: {
          recipientCount: users.length,
          title,
          message,
          userType,
          priority,
        },
      })
    } catch (error) {
      console.error("Broadcast error:", error)
      res.status(500).json({
        success: false,
        message: "Server error",
      })
    }
  },
)

// @route   GET /api/admin/system/health
// @desc    Get system health status
// @access  Private (Admin only)
router.get("/system/health", adminAuth, async (req, res) => {
  try {
    const [dbStatus, orderStats, userStats] = await Promise.all([
      // Database connection status
      new Promise((resolve) => {
        const mongoose = require("mongoose")
        resolve({
          connected: mongoose.connection.readyState === 1,
          state: mongoose.connection.readyState,
        })
      }),

      // Recent order statistics
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            completed: { $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] } },
            cancelled: { $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] } },
          },
        },
      ]),

      // Active users in last 24 hours
      User.countDocuments({
        lastLogin: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      }),
    ])

    res.json({
      success: true,
      data: {
        database: dbStatus,
        orders: orderStats[0] || { total: 0, completed: 0, cancelled: 0 },
        activeUsers: userStats,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("System health error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// ==========================================
// 📦 NEW: ORDER MANAGEMENT (Accept/Reject)
// ==========================================

// @route   PUT /api/admin/orders/:id/status
// @desc    Update order status (e.g., confirm, reject, preparing)
// @access  Private (Admin only)
router.put(
  "/orders/:id/status",
  adminAuth,
  [
    body("status").isIn(["confirmed", "preparing", "ready", "out_for_delivery", "delivered", "cancelled", "rejected"]).withMessage("Invalid status"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        })
      }

      const { status } = req.body;
      const order = await Order.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true }
      );

      if (!order) {
        return res.status(404).json({ success: false, message: "Order not found" });
      }

      res.json({
        success: true,
        message: `Order marked as ${status}`,
        data: order
      });
    } catch (error) {
      console.error("Update order status error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// ==========================================
// 🍔 NEW: MENU MANAGEMENT (Add/Update/Delete)
// ==========================================

// @route   POST /api/admin/menu
// @desc    Add a new menu item
// @access  Private (Admin only)
router.post(
  "/menu",
  adminAuth,
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("price").isNumeric().withMessage("Price must be a number"),
    body("category").notEmpty().withMessage("Category is required"),
    body("restaurant").notEmpty().withMessage("Restaurant ID is required"),
    body("description").optional(),
    body("image").optional(), // URL string
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

      const newItem = new MenuItem({
        ...req.body,
        isAvailable: true
      });

      await newItem.save();

      res.status(201).json({
        success: true,
        message: "Menu item added successfully",
        data: newItem
      });
    } catch (error) {
      console.error("Add menu item error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// @route   PUT /api/admin/menu/:id
// @desc    Update a menu item
// @access  Private (Admin only)
router.put("/menu/:id", adminAuth, async (req, res) => {
  try {
    const updatedItem = await MenuItem.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    if (!updatedItem) return res.status(404).json({ success: false, message: "Item not found" });

    res.json({
      success: true,
      message: "Menu item updated",
      data: updatedItem
    });
  } catch (error) {
    console.error("Update menu error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// @route   DELETE /api/admin/menu/:id
// @desc    Delete a menu item
// @access  Private (Admin only)
router.delete("/menu/:id", adminAuth, async (req, res) => {
  try {
    const deletedItem = await MenuItem.findByIdAndDelete(req.params.id);
    if (!deletedItem) return res.status(404).json({ success: false, message: "Item not found" });

    res.json({ success: true, message: "Menu item deleted" });
  } catch (error) {
    console.error("Delete menu error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router