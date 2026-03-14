import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { riderLogin } from "../store/slices/riderSlice"
import type { AppDispatch, RootState } from "../store/store"
import {
    Lock,
    Mail,
    Eye,
    EyeOff,
    Bike,
    LogIn,
    AlertCircle,
    ShieldCheck,
    Sparkles,
} from "lucide-react"

const RiderLogin = () => {
    const [formData, setFormData] = useState({ email: "", password: "" })
    const [showPassword, setShowPassword] = useState(false)
    const [success, setSuccess] = useState(false)
    const navigate = useNavigate()
    const dispatch = useDispatch<AppDispatch>()
    const { isLoading, error } = useSelector((state: RootState) => state.rider)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        const result = await dispatch(riderLogin(formData))
        if (riderLogin.fulfilled.match(result)) {
            setSuccess(true)
            setTimeout(() => navigate("/rider/dashboard"), 1500)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 overflow-hidden relative">
            {/* Animated background particles */}
            <div className="absolute inset-0 overflow-hidden">
                {[...Array(6)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute rounded-full bg-blue-500/10 blur-2xl"
                        style={{
                            width: `${120 + i * 40}px`,
                            height: `${120 + i * 40}px`,
                            left: `${(i * 179) % 90}%`,
                            top: `${(i * 137) % 80}%`,
                        }}
                        animate={{
                            x: [0, 30, -20, 0],
                            y: [0, -25, 15, 0],
                            scale: [1, 1.1, 0.95, 1],
                        }}
                        transition={{ duration: 8 + i * 2, repeat: Infinity, ease: "easeInOut" }}
                    />
                ))}
            </div>

            <motion.div
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, type: "spring" }}
                className="relative z-10 w-full max-w-md mx-4"
            >
                <div className="bg-white/5 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 p-8 relative overflow-hidden">
                    {/* Glass sheen */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 rounded-3xl" />

                    {/* Success overlay */}
                    <AnimatePresence>
                        {success && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="absolute inset-0 bg-green-900/80 backdrop-blur-sm flex items-center justify-center z-20 rounded-3xl"
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
                                        className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mx-auto mb-4 shadow-lg"
                                    >
                                        <ShieldCheck className="w-10 h-10 text-white" />
                                    </motion.div>
                                    <h3 className="text-2xl font-bold text-white mb-1">Welcome, Rider!</h3>
                                    <p className="text-green-300">Loading your dashboard...</p>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Header */}
                    <div className="relative text-center mb-8">
                        <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ delay: 0.1, type: "spring" }}
                            className="inline-flex items-center justify-center w-20 h-20 mb-4 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 shadow-xl shadow-blue-500/30"
                        >
                            <Bike className="w-10 h-10 text-white" />
                        </motion.div>

                        <motion.h2
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-3xl font-bold text-white mb-1"
                        >
                            Rider Portal
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="text-blue-300/80 font-medium"
                        >
                            Delivery Staff Login
                        </motion.p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleLogin} className="space-y-5 relative">
                        {/* Error */}
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10, height: 0 }}
                                    animate={{ opacity: 1, y: 0, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-center gap-3"
                                >
                                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                                    <p className="text-red-300 text-sm">{error}</p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Email */}
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
                            <label className="block text-sm font-medium text-blue-200 mb-2">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400" />
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="your@email.com"
                                    required
                                    disabled={isLoading}
                                    className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-blue-400/50 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all"
                                />
                            </div>
                        </motion.div>

                        {/* Password */}
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
                            <label className="block text-sm font-medium text-blue-200 mb-2">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Enter your password"
                                    required
                                    disabled={isLoading}
                                    className="w-full pl-12 pr-12 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-blue-400/50 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-400 hover:text-white transition-colors"
                                    disabled={isLoading}
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </motion.div>

                        {/* Submit */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="relative w-full py-4 px-6 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-400/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                            >
                                <span className="relative flex items-center justify-center gap-3">
                                    {isLoading ? (
                                        <>
                                            <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                                className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                                            />
                                            Authenticating...
                                        </>
                                    ) : (
                                        <>
                                            <LogIn className="w-5 h-5" />
                                            Sign In to Dashboard
                                            <Sparkles className="w-5 h-5" />
                                        </>
                                    )}
                                </span>
                                {!isLoading && (
                                    <motion.div
                                        className="absolute top-0 left-0 w-12 h-full bg-white/20 skew-x-12"
                                        initial={{ x: "-100%" }}
                                        whileHover={{ x: "500%" }}
                                        transition={{ duration: 0.7 }}
                                    />
                                )}
                            </button>
                        </motion.div>

                        {/* Admin link */}
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8 }}
                            className="text-center text-sm text-blue-400/60"
                        >
                            Are you an admin?{" "}
                            <a href="/admin/login" className="text-blue-300 hover:text-white transition-colors font-medium">
                                Admin Login →
                            </a>
                        </motion.p>
                    </form>
                </div>
            </motion.div>
        </div>
    )
}

export default RiderLogin
