const express = require("express")
const router = express.Router()
const { body, validationResult } = require("express-validator")
const Order = require("../models/Order")
const User = require("../models/User")
const { auth } = require("../middleware/auth")
const { getIO } = require("../utils/socket")

// Middleware to ensure user is a rider
const riderAuth = (req, res, next) => {
    if (req.user && req.user.role === "rider") {
        next()
    } else {
        res.status(403).json({ success: false, message: "Access denied: Riders only" })
    }
}

// Valid statuses a rider can set, in order
const RIDER_STATUSES = ["accepted", "picked_up", "on_the_way", "delivered", "cancelled"]

// Apply protection to all rider routes
router.use(auth)
router.use(riderAuth)

// @route   PUT /api/rider/status
// @desc    Toggle rider availability (online/offline)
// @access  Private (Rider only)
router.put(
    "/status",
    [
        body("status").isIn(["available", "offline"]).withMessage("Status must be available or offline")
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req)
            if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() })

            const { status } = req.body
            const rider = await User.findByIdAndUpdate(
                req.user.id,
                { riderStatus: status },
                { new: true }
            ).select("-password")

            if (!rider) return res.status(404).json({ success: false, message: "Rider not found" })

            // Emit socket event for admin dashboard
            try {
                getIO().emit("riderStatusUpdated", {
                    riderId: req.user.id,
                    status
                })
            } catch (err) {
                console.error("Socket emit error on status update:", err.message)
            }

            res.json({
                success: true,
                message: `Status updated to ${status}`,
                data: rider
            })
        } catch (error) {
            console.error("Update rider status error:", error)
            res.status(500).json({ success: false, message: "Server error" })
        }
    }
)

// @route   GET /api/rider/profile
// @desc    Get logged-in rider's profile and stats
// @access  Private (Rider only)
router.get("/profile", async (req, res) => {
    try {
        const rider = await User.findById(req.user.id).select("-password")
        if (!rider) return res.status(404).json({ success: false, message: "Rider not found" })

        // Calculate stats from order history
        const deliveredOrders = await Order.find({
            assignedDriver: req.user.id,
            status: "delivered"
        })

        const totalDeliveries = deliveredOrders.length
        const totalEarnings = deliveredOrders.reduce((sum, o) => sum + (o.pricing?.deliveryFee || 0), 0)

        res.json({
            success: true,
            data: {
                ...rider.toObject(),
                stats: {
                    totalDeliveries,
                    totalEarnings
                }
            }
        })
    } catch (error) {
        console.error("Get rider profile error:", error)
        res.status(500).json({ success: false, message: "Server error" })
    }
})

// @route   GET /api/rider/orders
// @desc    Get orders assigned to the rider
// @access  Private (Rider only)
router.get("/orders", async (req, res) => {
    try {
        const { status } = req.query
        const query = { assignedDriver: req.user.id }

        if (status) {
            query.status = status
        } else {
            // By default return active orders only
            query.status = { $in: ["out_for_delivery", "accepted", "picked_up", "on_the_way"] }
        }

        const orders = await Order.find(query)
            .populate("customer", "name phone address")
            .populate("restaurant", "name address phone")
            .sort({ createdAt: -1 })

        res.json({
            success: true,
            data: orders
        })
    } catch (error) {
        console.error("Get rider orders error:", error)
        res.status(500).json({ success: false, message: "Server error" })
    }
})

// @route   GET /api/rider/history
// @desc    Get delivery history for the logged-in rider
// @access  Private (Rider only)
router.get("/history", async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query

        const orders = await Order.find({
            assignedDriver: req.user.id,
            status: { $in: ["delivered", "cancelled"] }
        })
            .populate("customer", "name phone")
            .sort({ updatedAt: -1 })
            .limit(Number.parseInt(limit))
            .skip((Number.parseInt(page) - 1) * Number.parseInt(limit))

        const total = await Order.countDocuments({
            assignedDriver: req.user.id,
            status: { $in: ["delivered", "cancelled"] }
        })

        res.json({
            success: true,
            data: orders,
            pagination: {
                current: Number.parseInt(page),
                pages: Math.ceil(total / Number.parseInt(limit)),
                total
            }
        })
    } catch (error) {
        console.error("Get rider history error:", error)
        res.status(500).json({ success: false, message: "Server error" })
    }
})

// @route   PUT /api/rider/orders/:id/status
// @desc    Update delivery status
// @access  Private (Rider only)
router.put(
    "/orders/:id/status",
    [
        body("status").isIn(RIDER_STATUSES).withMessage(`Status must be one of: ${RIDER_STATUSES.join(", ")}`),
        body("note").optional()
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req)
            if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() })

            const { status, note } = req.body
            const order = await Order.findOne({ _id: req.params.id, assignedDriver: req.user.id })

            if (!order) {
                return res.status(404).json({ success: false, message: "Order not found or not assigned to you" })
            }

            order.status = status
            if (status === "delivered") {
                order.actualDeliveryTime = new Date()
            }

            const statusLabels = {
                accepted: "Order accepted by rider",
                picked_up: "Order picked up from restaurant",
                on_the_way: "Rider is on the way",
                delivered: "Order delivered successfully",
                cancelled: "Delivery cancelled"
            }

            order.timeline.push({
                status,
                timestamp: new Date(),
                note: note || statusLabels[status] || `Order ${status} by rider`
            })

            await order.save()

            // Populating for socket notification
            const populatedOrder = await Order.findById(order._id)
                .populate("customer", "name phone email")
                .populate("restaurant", "name phone")
                .populate("assignedDriver", "name phone")
                .lean()

            // Broadcast the update via WebSockets
            try {
                getIO().emit("orderStatusUpdated", populatedOrder)
            } catch (err) {
                console.error("Socket emit error on order status update:", err.message)
            }

            // If delivered/cancelled, make rider available again
            if (["delivered", "cancelled"].includes(status)) {
                await User.findByIdAndUpdate(req.user.id, { riderStatus: "available" })

                // 🏆 Award Loyalty Points if delivered
                if (status === "delivered") {
                    try {
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

                // Emit availability change
                try {
                    getIO().emit("riderStatusUpdated", {
                        riderId: req.user.id,
                        status: "available"
                    })
                } catch (err) {
                    console.error("Socket emit error on auto-available:", err.message)
                }
            }

            res.json({
                success: true,
                message: `Order status updated to ${status}`,
                data: populatedOrder
            })
        } catch (error) {
            console.error("Update rider order status error:", error)
            res.status(500).json({ success: false, message: "Server error" })
        }
    }
)

// @route   PUT /api/rider/location
// @desc    Update rider's live location
// @access  Private (Rider only)
router.put(
    "/location",
    [
        body("lat").isFloat({ min: -90, max: 90 }).withMessage("Invalid latitude"),
        body("lng").isFloat({ min: -180, max: 180 }).withMessage("Invalid longitude"),
        body("orderId").optional().isMongoId().withMessage("Invalid order ID")
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req)
            if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() })

            const { lat, lng, orderId } = req.body
            const riderId = req.user.id

            await User.findByIdAndUpdate(riderId, {
                currentLocation: {
                    lat,
                    lng,
                    updatedAt: new Date()
                }
            })

            // Broadcast location to anyone tracking this rider/order
            try {
                const io = getIO()
                io.emit("riderLocationUpdate", {
                    riderId,
                    orderId,
                    lat,
                    lng,
                    timestamp: new Date()
                })
            } catch (socketErr) {
                console.error("Socket broadcast error:", socketErr.message)
            }

            res.json({ success: true, message: "Location updated" })
        } catch (error) {
            console.error("Update location error:", error)
            res.status(500).json({ success: false, message: "Server error" })
        }
    }
)

module.exports = router
