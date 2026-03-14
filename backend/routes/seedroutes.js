const express = require("express")
const mongoose = require("mongoose")
const MenuItem = require("../models/MenuItem")
const Restaurant = require("../models/Restaurant")

const router = express.Router()

// @route   POST /api/seed/restaurant
// @desc    Create test restaurant with menu items
// @access  Public (for testing)
router.post("/restaurant", async (req, res) => {
    try {
        console.log("Seeding restaurant and menu items...")

        // Delete existing test restaurant if exists
        await Restaurant.deleteMany({ name: { $regex: /Test Restaurant|Delicious Food/i } })
        await MenuItem.deleteMany({
            name: {
                $in: [
                    "Chicken Burger",
                    "Pepperoni Pizza",
                    "French Fries",
                    "Caesar Salad",
                    "Mango Lassi",
                    "Chocolate Brownie"
                ]
            }
        })

        // Create restaurant with ALL required fields
        const restaurant = new Restaurant({
            name: "Delicious Food Restaurant",
            email: "contact@deliciousfood.com",
            phone: "03001234567",
            description: "Best restaurant in town with delicious food",
            openingHours: "9 AM - 11 PM",
            cuisines: ["Fast Food", "Italian", "Pakistani"],
            deliveryTime: "30-45 minutes",

            // Address with all required fields
            address: {
                street: "123 Food Street",
                city: "Karachi",
                state: "Sindh",
                zipCode: "75500",
                coordinates: {
                    lat: 24.8607,
                    lng: 67.0011
                }
            },

            // Business info with required fields
            businessInfo: {
                taxId: "TAX-123456789",
                licenseNumber: "LIC-987654321",
                businessType: "Restaurant",
                registrationDate: new Date("2023-01-01")
            },

            // Owner info (required field)
            owner: new mongoose.Types.ObjectId("65d5f8a9c1b8f4a1f8c7b6a2"),

            images: {
                logo: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4",
                banner: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5",
                gallery: [
                    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4",
                    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5"
                ]
            },

            // Social links (optional but good to have)
            socialLinks: {
                facebook: "https://facebook.com/deliciousfood",
                instagram: "https://instagram.com/deliciousfood"
            },

            // Settings
            settings: {
                isAcceptingOrders: true,
                autoAcceptOrders: true,
                notificationEnabled: true
            },

            isActive: true,
            isVerified: true,
            rating: 4.5,
            totalReviews: 120,
            minimumOrder: 500,
            deliveryFee: 100,
            preparationTime: 20,
            createdAt: new Date(),
            updatedAt: new Date()
        })

        await restaurant.save()
        console.log("✅ Restaurant created:", restaurant._id)

        // Create menu items
       const menuItems = [
  {
    name: "Chicken Burger",
    description: "Juicy chicken patty with fresh vegetables and special sauce",
    price: 550,
    image: "https://img.freepik.com/free-photo/big-sandwich-hamburger-with-juicy-beef-burger-cheese-tomato-red-onion-wooden-table_2829-19631.jpg?w=800&t=st=1703383299~exp=1703383899~hmac=abc123",
    category: "Burgers",
    restaurant: restaurant._id,
    isAvailable: true,
  },
  {
    name: "Pepperoni Pizza",
    description: "Classic pizza with pepperoni and extra cheese",
    price: 1200,
    image: "https://img.freepik.com/free-photo/top-view-pepperoni-pizza-with-mushroom-sausages-bell-pepper-olive-corn-black-wooden_141793-2158.jpg?w=800&t=st=1703383356~exp=1703383956~hmac=def456",
    category: "Pizza",
    restaurant: restaurant._id,
    isAvailable: true,
  },
  {
    name: "French Fries",
    description: "Crispy golden fries served with ketchup",
    price: 250,
    image: "https://img.freepik.com/free-photo/french-fries-ketchup_1205-113.jpg?w=800&t=st=1703383399~exp=1703383999~hmac=ghi789",
    category: "Sides",
    restaurant: restaurant._id,
    isAvailable: true,
  },
  {
    name: "Chicken Chow Mein",
    description: "Stir-fried noodles with chicken and vegetables",
    price: 750,
    image: "https://img.freepik.com/free-photo/chow-mein-noodles-with-chicken-vegetables_1203-3570.jpg?w=800&t=st=1703383456~exp=1703384056~hmac=jkl012",
    category: "Chinese",
    restaurant: restaurant._id,
    isAvailable: true,
  },
  {
    name: "Caesar Salad",
    description: "Fresh romaine lettuce with Caesar dressing and croutons",
    price: 450,
    image: "https://img.freepik.com/free-photo/top-view-vegetable-salad-with-fork-dark-desk_140725-101785.jpg?w=800&t=st=1703383500~exp=1703384100~hmac=mno345",
    category: "Salads",
    restaurant: restaurant._id,
    isAvailable: true,
  },
  {
    name: "Mango Lassi",
    description: "Refreshing yogurt-based mango drink",
    price: 200,
    image: "https://img.freepik.com/free-photo/glass-mango-lassi-with-mint-leaves_1150-23456.jpg?w=800&t=st=1703383550~exp=1703384150~hmac=pqr678",
    category: "Beverages",
    restaurant: restaurant._id,
    isAvailable: true,
  }
]

        const createdItems = await MenuItem.insertMany(menuItems)
        console.log("✅ Menu items created:", createdItems.length)

        res.json({
            success: true,
            message: "Test restaurant and menu items created successfully",
            data: {
                restaurantId: restaurant._id,
                restaurantName: restaurant.name,
                menuItemsCount: createdItems.length,
                restaurantEmail: restaurant.email,
                restaurantPhone: restaurant.phone
            }
        })

    } catch (error) {
        console.error("❌ Seed error:", error)
        res.status(500).json({
            success: false,
            message: "Server error during seeding",
            error: error.message,
            stack: process.env.NODE_ENV === "development" ? error.stack : undefined
        })
    }
})

// SIMPLE SEED - Without strict validation
// @route   POST /api/seed/simple
// @desc    Create simple test restaurant
// @access  Public
router.post("/simple", async (req, res) => {
    try {
        console.log("Creating simple restaurant...")

        // Create a simple restaurant without all required fields
        const restaurant = new Restaurant({
            name: "Quick Bites Restaurant",
            email: "quick@bites.com",
            phone: "03009876543",
            description: "Quick and delicious meals",

            // Minimal address
            address: {
                street: "456 Fast Lane",
                city: "Lahore",
                state: "Punjab",
                zipCode: "54000",
                coordinates: {
                    lat: 31.5204,
                    lng: 74.3587
                }
            },

            // Minimal business info
            businessInfo: {
                taxId: "TAX-SIMPLE-001",
                licenseNumber: "LIC-SIMPLE-001"
            },

            owner: new mongoose.Types.ObjectId(),

            images: {
                logo: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4"
            },

            isActive: true,
            isVerified: false
        })

        await restaurant.save()

        // Create 3 simple menu items
        const menuItems = [
            {
                name: "Cheese Burger",
                description: "Classic cheese burger",
                price: 450,
                image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd",
                category: "Burgers",
                restaurant: restaurant._id,
                isAvailable: true
            },
            {
                name: "French Fries",
                description: "Crispy fries",
                price: 180,
                image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877",
                category: "Sides",
                restaurant: restaurant._id,
                isAvailable: true
            },
            {
                name: "Soft Drink",
                description: "Cold beverage",
                price: 120,
                image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97",
                category: "Beverages",
                restaurant: restaurant._id,
                isAvailable: true
            }
        ]

        const createdItems = await MenuItem.insertMany(menuItems)

        res.json({
            success: true,
            message: "Simple restaurant created",
            restaurantId: restaurant._id,
            restaurantName: restaurant.name,
            itemsCount: createdItems.length
        })

    } catch (error) {
        console.error("Simple seed error:", error)
        res.status(500).json({
            success: false,
            message: "Simple seed failed",
            error: error.message
        })
    }
})

// @route   GET /api/seed/check
// @desc    Check if seeding is working
// @access  Public
router.get("/check", (req, res) => {
    res.json({
        success: true,
        message: "Seed routes are working",
        availableEndpoints: [
            "POST /api/seed/restaurant - Create full restaurant",
            "POST /api/seed/simple - Create simple restaurant",
            "GET  /api/seed/check - This endpoint"
        ],
        timestamp: new Date().toISOString()
    })
})

module.exports = router