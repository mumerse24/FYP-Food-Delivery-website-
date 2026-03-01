import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import AuthAdmin from "../services/alogin"
import { 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ChefHat, 
  LogIn, 
  Sparkles,
  AlertCircle,
  ShieldCheck,
  Key,
  User
} from "lucide-react"
import { useNavigate } from "react-router-dom"

const AdminLogin = () => {
  const [formData, setFormData] = useState({ 
    email: "admin@foodexpress.com", 
    password: "admin123" 
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ 
      ...formData, 
      [e.target.name]: e.target.value 
    })
    if (error) setError("")
  }

  const validateForm = () => {
    // Clear previous errors
    setError("")
    
    if (!formData.email.trim()) {
      setError("Email address is required")
      return false
    }
    
    if (!formData.password.trim()) {
      setError("Password is required")
      return false
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address (e.g., admin@example.com)")
      return false
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long")
      return false
    }

    return true
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log("🔐 Login attempt started...")
    console.log("📧 Email:", formData.email)
    
    // if (!validateForm()) {
    //   console.log("❌ Form validation failed")
    //   return
    // }

    setLoading(true)
    setError("")

    try {
      console.log("🔄 Calling AuthAdmin.login()...")
      
      const response = await AuthAdmin.login(formData.email, formData.password)
      
      console.log("✅ Login response received:", response)
      
      if (response.success && response.token) {
        console.log("🎯 Login successful!")
        console.log("🔑 Token:", response.token.substring(0, 20) + "...")
        console.log("👤 Admin data:", response.admin)
        
        // Store token in localStorage
        localStorage.setItem("adminToken", response.token)
        localStorage.setItem("adminData", JSON.stringify(response.admin))
        localStorage.setItem("loginTime", Date.now().toString())
        
        console.log("💾 Data stored in localStorage")
        console.log("   Token stored:", !!localStorage.getItem("adminToken"))
        console.log("   Admin data stored:", !!localStorage.getItem("adminData"))
        
        setSuccess(true)

        // Redirect after success animation
        setTimeout(() => {
          console.log("🔄 Redirecting to dashboard...")
          navigate("/admin/dashboard")
        }, 1500)
        
      } else {
        console.log("❌ Login failed - no success or token")
        setError(response.message || "Invalid credentials. Please try again.")
      }
    } catch (err: any) {
      console.error("🔥 Login error caught:", err)
      
      let errorMessage = "Login failed. Please check your credentials."
      
      if (err.response?.status === 401) {
        errorMessage = "Invalid email or password"
      } else if (err.response?.status === 403) {
        errorMessage = "Account is deactivated"
      } else if (err.response?.status === 500) {
        errorMessage = "Server error. Please try again later."
      } else if (err.message) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
      console.log("🏁 Login process completed")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-red-50 overflow-hidden relative">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-32 h-32 rounded-full bg-gradient-to-r from-orange-200/20 to-amber-200/20 blur-xl"
            initial={{ 
              x: Math.random() * 100 + 'vw',
              y: Math.random() * 100 + 'vh'
            }}
            animate={{
              x: [null, Math.random() * 100 + 'vw'],
              y: [null, Math.random() * 100 + 'vh']
            }}
            transition={{
              duration: 15 + i * 3,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, type: "spring" }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div className="bg-white rounded-3xl shadow-2xl border border-orange-200/50 p-8 relative overflow-hidden backdrop-blur-sm bg-white/95">
          
          {/* Animated Border Glow */}
          <motion.div
            className="absolute inset-0 rounded-3xl"
            style={{
              background: "linear-gradient(45deg, transparent 40%, rgba(249, 115, 22, 0.1) 50%, transparent 60%)",
              backgroundSize: "300% 300%"
            }}
            animate={{
              backgroundPosition: ["0% 0%", "300% 300%"]
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "linear"
            }}
          />

          {/* Success Animation */}
          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-sm flex items-center justify-center z-20 rounded-3xl"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className="text-center p-8"
                >
                  <motion.div
                    initial={{ rotate: -180, scale: 0 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                    className="w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mx-auto mb-6 shadow-lg"
                  >
                    <ShieldCheck className="w-12 h-12 text-white" />
                  </motion.div>
                  <h3 className="text-3xl font-bold text-green-800 mb-2">Welcome Back!</h3>
                  <p className="text-green-600">Redirecting to dashboard...</p>
                  <motion.div
                    className="w-48 h-1 bg-green-200 rounded-full mt-6 mx-auto overflow-hidden"
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ delay: 0.5, duration: 1 }}
                  >
                    <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500" />
                  </motion.div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Header */}
          <div className="text-center mb-10 relative">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.1, type: "spring" }}
              className="inline-flex items-center justify-center w-24 h-24 mb-6 rounded-3xl bg-gradient-to-br from-orange-500 via-red-500 to-amber-500 shadow-xl shadow-orange-200/50"
            >
              <ChefHat className="w-12 h-12 text-white" />
            </motion.div>
            
            <motion.h2
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-4xl font-bold bg-gradient-to-r from-orange-600 via-red-500 to-amber-600 bg-clip-text text-transparent mb-2"
            >
              Admin Portal
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-orange-600/70 text-lg font-medium"
            >
              Secure Restaurant Management
            </motion.p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200/50 rounded-xl p-4"
                >
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-red-600 font-medium">Authentication Error</p>
                      <p className="text-red-500 text-sm mt-1">{error}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email Input */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-2"
            >
              <label className="block text-sm font-semibold text-gray-700">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Email Address
                </div>
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  <Mail className={`w-5 h-5 transition-colors ${
                    formData.email ? 'text-orange-500' : 'text-orange-400'
                  } group-focus-within:text-orange-600`} />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="admin@foodexpress.com"
                  className="w-full pl-12 pr-4 py-3.5 bg-white/50 border-2 border-orange-100 rounded-xl text-gray-800 placeholder-orange-300 focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100/30 transition-all duration-300 backdrop-blur-sm"
                  disabled={loading}
                  autoComplete="username"
                />
              </div>
            </motion.div>
            {/* Password Input */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-2"
            >
              <label className="block text-sm font-semibold text-gray-700">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  Password
                </div>
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  <Lock className={`w-5 h-5 transition-colors ${
                    formData.password ? 'text-amber-500' : 'text-amber-400'
                  } group-focus-within:text-amber-600`} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className="w-full pl-12 pr-12 py-3.5 bg-white/50 border-2 border-amber-100 rounded-xl text-gray-800 placeholder-amber-300 focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-100/30 transition-all duration-300 backdrop-blur-sm"
                  disabled={loading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-amber-400 hover:text-orange-600 transition-colors p-1"
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </motion.div>

            {/* Login Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <button
                type="submit"
                disabled={loading}
                className="relative w-full py-4 px-6 bg-gradient-to-r from-orange-500 via-red-500 to-amber-500 text-white font-bold rounded-xl shadow-lg shadow-orange-200 hover:shadow-xl hover:shadow-orange-300 transition-all duration-300 group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg"
              >
                <div className="flex items-center justify-center gap-3">
                  {loading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full"
                      />
                      <span className="text-lg">Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <motion.div
                        whileHover={{ rotate: 90 }}
                        transition={{ duration: 0.3 }}
                      >
                        <LogIn className="w-6 h-6" />
                      </motion.div>
                      <span className="text-lg">Secure Login</span>
                      <motion.div
                        animate={{ 
                          scale: [1, 1.2, 1],
                          opacity: [0.7, 1, 0.7]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        <Sparkles className="w-6 h-6" />
                      </motion.div>
                    </>
                  )}
                </div>
                
                {/* Button Shine Effect */}
                {!loading && (
                  <motion.div
                    className="absolute top-0 left-0 w-16 h-full bg-white/30 skew-x-12"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: "400%" }}
                    transition={{ duration: 0.8 }}
                  />
                )}
              </button>
            </motion.div>

            {/* Help Links */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="flex justify-between items-center pt-2"
            >
              <button
                type="button"
                className="text-sm text-orange-600 hover:text-orange-800 font-medium transition-colors"
                onClick={() => setError("Please contact the system administrator at support@foodexpress.com")}
                disabled={loading}
              >
                Forgot Password?
              </button>
              
              <button
                type="button"
                className="text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors"
                onClick={() => {
                  setFormData({ 
                    email: "admin@foodexpress.com", 
                    password: "admin123" 
                  })
                }}
                disabled={loading}
              >
                Use Demo Credentials
              </button>
            </motion.div>
          </form>

          {/* Security Note */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-8 pt-6 border-t border-orange-100"
          >
            <div className="flex items-center gap-3 text-sm text-orange-600/60">
              <ShieldCheck className="w-4 h-4 flex-shrink-0" />
              <p className="font-medium">Your credentials are encrypted and securely stored.</p>
            </div>
            <p className="text-xs text-orange-400/50 mt-2 pl-7">
              Access is monitored and logged for security purposes.
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* Keyboard Shortcut Hint */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <div className="flex items-center gap-2 text-orange-600/60 text-sm bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow">
          <span className="px-2 py-1 bg-gradient-to-r from-orange-100 to-amber-100 rounded border border-orange-200 font-mono">↵ Enter</span>
          <span className="font-medium">Press Enter to login</span>
        </div>
      </motion.div>
    </div>
  )
}

export default AdminLogin