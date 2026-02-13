const mongoose = require("mongoose")

const menuItemSchema = new mongoose.Schema(
  {
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    name: {
      type: String,
      required: [true, "Item name is required"],
      trim: true,
      maxlength: [100, "Item name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      maxlength: [300, "Description cannot exceed 300 characters"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: [
        "Burgers",
        "Pizza",
        "Sides",
        "Chinese",      // ← Add this
        "Salads",       // ← Add this  
        "Beverages",    // ← Add this
        "Desserts",     // ← Add this
        "Main Course",  // ← Add this
        "Appetizers",   // ← Add this
        "Fast Food",    // ← Add this
        "Indian",       // ← Add this
        "Italian",      // ← Add this
        "Other"         // ← Add this
      ],
      default: "Other"
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    originalPrice: {
      type: Number,
      min: [0, "Original price cannot be negative"],
    },
    images: {
      type: [String],
      required: [true, "At least one image is required"],
    },
    ingredients: [String],
    allergens: {
      type: [String],
      enum: ["Nuts", "Dairy", "Eggs", "Soy", "Wheat", "Fish", "Shellfish", "Sesame"],
    },
    nutritionalInfo: {
      calories: Number,
      protein: Number,
      carbs: Number,
      fat: Number,
      fiber: Number,
      sugar: Number,
      sodium: Number,
    },
    dietaryTags: {
      type: [String],
      enum: ["Vegetarian", "Vegan", "Gluten-free", "Dairy-free", "Nut-free", "Keto", "Low-carb", "Halal", "Kosher"],
    },
    spiceLevel: {
      type: String,
      enum: ["Mild", "Medium", "Hot", "Extra Hot"],
      default: "Mild",
    },
    preparationTime: {
      type: String,
      default: "15-20 mins",
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    isPopular: {
      type: Boolean,
      default: false,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    customizations: [
      {
        name: { type: String, required: true },
        options: [
          {
            name: { type: String, required: true },
            price: { type: Number, default: 0 },
          },
        ],
        required: { type: Boolean, default: false },
        multiSelect: { type: Boolean, default: false },
      },
    ],
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 },
    },
    orderCount: {
      type: Number,
      default: 0,
    },
    discountPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
)

// Index for restaurant-based queries
menuItemSchema.index({ restaurant: 1, category: 1 })

// Index for search functionality
menuItemSchema.index({ name: "text", description: "text", ingredients: "text" })

module.exports = mongoose.model("MenuItem", menuItemSchema)
