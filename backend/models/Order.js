const mongoose = require("mongoose")

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      required: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    items: [
      {
        menuItem: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "MenuItem",
          required: true,
        },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true, min: 1 },
        customizations: [
          {
            name: String,
            selectedOptions: [
              {
                name: String,
                price: { type: Number, default: 0 },
              },
            ],
          },
        ],
        itemTotal: { type: Number, required: true },
        specialInstructions: String,
      },
    ],
    pricing: {
      subtotal: { type: Number, required: true },
      deliveryFee: { type: Number, default: 0 },
      serviceFee: { type: Number, default: 0 },
      tax: { type: Number, default: 0 },
      discount: { type: Number, default: 0 },
      total: { type: Number, required: true },
    },
    deliveryAddress: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
      coordinates: {
        lat: Number,
        lng: Number,
      },
      instructions: String,
    },
    contactInfo: {
      phone: { type: String, required: true },
      email: { type: String, required: true },
    },
    paymentInfo: {
      method: {
        type: String,
        enum: ["Cash", "Card", "Digital Wallet", "Online Payment"],
        required: true,
      },
      status: {
        type: String,
        enum: ["pending", "completed", "failed", "refunded"],
        default: "pending",
      },
      transactionId: String,
      paidAt: Date,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "preparing",
        "ready",
        "picked_up",
        "out_for_delivery",
        "delivered",
        "cancelled",
        "refunded",
      ],
      default: "pending",
    },
    orderType: {
      type: String,
      enum: ["delivery", "pickup"],
      default: "delivery",
    },
    estimatedDeliveryTime: {
      type: Date,
      required: true,
    },
    actualDeliveryTime: Date,
    specialInstructions: String,
    cancellationReason: String,
    rating: {
      food: { type: Number, min: 1, max: 5 },
      delivery: { type: Number, min: 1, max: 5 },
      overall: { type: Number, min: 1, max: 5 },
      comment: String,
      ratedAt: Date,
    },
    timeline: [
      {
        status: String,
        timestamp: { type: Date, default: Date.now },
        note: String,
      },
    ],
    assignedDriver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    refundAmount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
)

// Generate order number before saving
orderSchema.pre("save", async function (next) {
  if (!this.orderNumber) {
    const count = await mongoose.model("Order").countDocuments()
    this.orderNumber = `ORD${Date.now()}${String(count + 1).padStart(4, "0")}`
  }

  // Add initial timeline entry
  if (this.isNew) {
    this.timeline.push({
      status: this.status,
      timestamp: new Date(),
      note: "Order placed",
    })
  }

  next()
})

// Index for efficient queries
orderSchema.index({ customer: 1, createdAt: -1 })
orderSchema.index({ restaurant: 1, createdAt: -1 })
orderSchema.index({ orderNumber: 1 })
orderSchema.index({ status: 1 })

module.exports = mongoose.model("Order", orderSchema)
