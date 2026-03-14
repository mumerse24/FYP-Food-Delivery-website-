const jwt = require("jsonwebtoken")
const User = require("../models/User")

const auth = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");

    // 🟠 No Authorization Header
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authorization header missing or invalid",
      });
    }

    const token = authHeader.replace("Bearer ", "").trim();

    // 🟠 Verify Token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message:
          err.name === "TokenExpiredError"
            ? "Token expired. Please log in again."
            : "Invalid token",
      });
    }

    // 🟢 Find User by ID
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found for this token",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error in authentication",
    });
  }
};
const adminAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => { })

    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required.",
      })
    }

    next()
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Authorization failed",
    })
  }
}

const restaurantAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => { })

    if (req.user.role !== "restaurant" && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Restaurant privileges required.",
      })
    }

    next()
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Authorization failed",
    })
  }
}

module.exports = { auth, adminAuth, restaurantAuth }
