const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const helmet = require("helmet")
const rateLimit = require("express-rate-limit")
require("dotenv").config()

// ✅ 1. FIRST create app
const app = express()

// Validate required environment variables on startup
const requiredEnvVars = [
  "MONGODB_URI",
  "JWT_SECRET",
  "PORT"
]

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar])

if (missingEnvVars.length > 0) {
  console.error("❌ Missing required environment variables:", missingEnvVars)
  console.log("💡 Please check your .env file")
  process.exit(1)
}

console.log("✅ Environment variables loaded successfully")

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
    },
  },
}))

// Rate limiting for authentication routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 requests per windowMs for auth
  message: "Too many login attempts, please try again later.",
  skipSuccessfulRequests: true,
})

// General rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: "Too many requests from this IP, please try again later.",
})

// CORS configuration from .env
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["http://localhost:3000", "http://localhost:5173", "http://localhost:8080"]

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true)

    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes("*")) {
      callback(null, true)
    } else {
      console.warn(`⚠️ CORS blocked origin: ${origin}`)
      callback(new Error("Not allowed by CORS"))
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
  exposedHeaders: ["Authorization"],
  maxAge: 86400, // 24 hours
}

app.use(cors(corsOptions))

// Handle preflight requests
app.options("*", cors(corsOptions))

// Body parsing middleware
app.use(express.json({ limit: process.env.MAX_JSON_SIZE || "10mb" }))
app.use(express.urlencoded({
  extended: true,
  limit: process.env.MAX_URLENCODED_SIZE || "10mb"
}))

const { globalErrorHandler } = require("./middleware/errorHandler")
const logger = require("./utils/logger")

// Request logging middleware
app.use((req, res, next) => {
  const startTime = Date.now()
  res.on("finish", () => {
    const duration = Date.now() - startTime
    const logLevel = res.statusCode >= 400 ? "warn" : "info"
    console[logLevel]({
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.connection.remoteAddress,
    })
  })
  next()
})

// ✅ 2. THEN import and use routes (app is now defined)
// Routes with rate limiting
app.use("/api/auth", authLimiter, require("./routes/auth"))
app.use("/api/restaurants", apiLimiter, require("./routes/restaurants"))
app.use("/api/menu", apiLimiter, require("./routes/menu"))
app.use("/api/orders", apiLimiter, require("./routes/orders"))
app.use("/api/cart", apiLimiter, require("./routes/cart"))
app.use("/api/admin", authLimiter, require("./routes/admin"))
app.use("/api/contact", apiLimiter, require("./routes/contact"))

// ✅ Add seed routes AFTER app is defined
app.use("/api/seed", apiLimiter, require("./routes/seedroutes"))

// Add admin authentication routes
const adminAuthRoutes = require("./routes/admin/auth")
app.use("/api/admin/auth", authLimiter, adminAuthRoutes)
app.use("/api/upload", apiLimiter, require("./routes/upload"))

// server.js mein (app.use(cors()) ke baad):
app.use(express.static("public")) // ← This line stays here

// Phir aapke images available honge:
// http://localhost:5000/images/menu/Chicken%20Burger.jpg
// Health check endpoint
app.get("/api/health", (req, res) => {
  const healthStatus = {
    status: "OK",
    message: "Food Delivery API is running",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    environment: process.env.NODE_ENV || "development",
    version: process.env.npm_package_version || "1.0.0",
    node: process.version,
    platform: process.platform,
  }

  res.status(200).json(healthStatus)
})

// Admin initialization endpoint (for first-time setup)
app.post("/api/admin/init", async (req, res) => {
  try {
    const Admin = require("./models/Admin")
    const bcrypt = require("bcryptjs")

    // Check if any admin exists
    const adminCount = await Admin.countDocuments()

    if (adminCount > 0) {
      return res.status(400).json({
        success: false,
        message: "Admin already exists. Use login instead."
      })
    }

    const { email, password, name } = req.body

    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: "Email, password, and name are required"
      })
    }

    // Hash password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    // Create admin
    const admin = new Admin({
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      role: "superadmin",
      isActive: true
    })

    await admin.save()

    console.log(`✅ Initial admin created: ${email}`)

    res.status(201).json({
      success: true,
      message: "Initial admin created successfully",
      admin: {
        email: admin.email,
        name: admin.name,
        role: admin.role
      }
    })

  } catch (error) {
    console.error("Admin initialization error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to initialize admin",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    })
  }
})

// MongoDB connection with .env variable
const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is not defined in .env file")
  process.exit(1)
}

console.log(`🔗 Connecting to MongoDB: ${MONGODB_URI.replace(/:([^:@]+)@/, ':****@')}`) // Hide password in logs

mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    retryWrites: true,
    w: "majority"
  })
  .then(() => {
    console.log("✅ MongoDB connected successfully")
    console.log(`📊 Database: ${mongoose.connection.name}`)
    console.log(`🔌 Host: ${mongoose.connection.host}`)
    console.log(`📈 Port: ${mongoose.connection.port}`)
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message)
    console.log("💡 Please check:")
    console.log("   1. MongoDB is running")
    console.log("   2. MONGODB_URI in .env is correct")
    console.log("   3. Network connectivity")
    process.exit(1)
  })

// Connection events
mongoose.connection.on("disconnected", () => {
  console.warn("⚠️ MongoDB disconnected")
})

mongoose.connection.on("reconnected", () => {
  console.log("🔄 MongoDB reconnected")
})

mongoose.connection.on("error", (err) => {
  console.error("❌ MongoDB error:", err.message)
})

// 404 handler for API endpoints (MUST be after all routes)
app.use("/api/*", (req, res) => {
  console.log(`🔍 404: ${req.method} ${req.originalUrl} - No route matched`)
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
    requestedUrl: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  })
})

// Global error handler
app.use(globalErrorHandler)
// Serve static files in production
if (process.env.NODE_ENV === "production") {
  const path = require("path")
  app.use(express.static(path.join(__dirname, "../frontend/dist")))

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/dist/index.html"))
  })
}

// Graceful shutdown
const shutdown = async () => {
  console.log("🛑 Shutdown signal received")

  // Close server first
  server.close(async () => {
    console.log("✅ HTTP server closed")

    try {
      // Close MongoDB connection
      await mongoose.connection.close(false)
      console.log("✅ MongoDB connection closed")
      process.exit(0)
    } catch (err) {
      console.error("❌ Error closing MongoDB connection:", err)
      process.exit(1)
    }
  })

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error("❌ Could not close connections in time, forcefully shutting down")
    process.exit(1)
  }, 10000)
}
process.on("SIGTERM", shutdown)
process.on("SIGINT", shutdown)

const PORT = process.env.PORT || 5000
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`)
  console.log(`📡 API URL: http://localhost:${PORT}/api`)
  console.log(`🔧 Admin API: http://localhost:${PORT}/api/admin`)
  console.log(`🩺 Health check: http://localhost:${PORT}/api/health`)
  console.log(`🌱 Seed routes: http://localhost:${PORT}/api/seed`)
  console.log(`🔗 MongoDB: ${mongoose.connection.readyState === 1 ? "Connected" : "Disconnected"}`)
})

// Handle server errors
server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`❌ Port ${PORT} is already in use`)
    process.exit(1)
  } else {
    console.error("❌ Server error:", error)
    throw error
  }
})

module.exports = app