import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
    Bike,
    Package,
    Clock,
    CheckCircle2,
    XCircle,
    MapPin,
    Phone,
    User,
    DollarSign,
    CreditCard,
    ChevronRight,
    LogOut,
    History,
    UserCircle,
    AlertCircle,
    Loader2,
    Star,
    TrendingUp,
    RefreshCw,
} from "lucide-react"
import {
    fetchRiderOrders,
    fetchRiderHistory,
    fetchRiderProfile,
    updateRiderOrderStatus,
    riderLogout,
    toggleRiderStatus,
    addAssignedOrder,
} from "../store/slices/riderSlice"
import type { AppDispatch, RootState } from "../store/store"
import socketService from "../services/socket"
import api from "../services/api"

type Tab = "orders" | "history" | "profile"

// Status flow config
const STATUS_FLOW: Record<string, { next: string; label: string; color: string; bgColor: string; icon: any }> = {
    out_for_delivery: {
        next: "accepted",
        label: "Accept Order",
        color: "text-yellow-400",
        bgColor: "bg-yellow-500",
        icon: CheckCircle2,
    },
    accepted: {
        next: "picked_up",
        label: "Mark Picked Up",
        color: "text-blue-400",
        bgColor: "bg-blue-500",
        icon: Package,
    },
    picked_up: {
        next: "on_the_way",
        label: "On The Way",
        color: "text-indigo-400",
        bgColor: "bg-indigo-500",
        icon: Bike,
    },
    on_the_way: {
        next: "delivered",
        label: "Mark Delivered ✓",
        color: "text-green-400",
        bgColor: "bg-green-500",
        icon: CheckCircle2,
    },
}

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
    out_for_delivery: { label: "Assigned", className: "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30" },
    accepted: { label: "Accepted", className: "bg-blue-500/20 text-blue-300 border border-blue-500/30" },
    picked_up: { label: "Picked Up", className: "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30" },
    on_the_way: { label: "On The Way", className: "bg-purple-500/20 text-purple-300 border border-purple-500/30" },
    delivered: { label: "Delivered", className: "bg-green-500/20 text-green-300 border border-green-500/30" },
    cancelled: { label: "Cancelled", className: "bg-red-500/20 text-red-300 border border-red-500/30" },
}

// ──────────────────────── Order Card ────────────────────────
const OrderCard = ({ order, onStatusUpdate, isUpdating }: any) => {
    const flowConfig = STATUS_FLOW[order.status]
    const badge = STATUS_BADGES[order.status]

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 space-y-4"
        >
            {/* Top row */}
            <div className="flex items-start justify-between gap-3">
                <div>
                    <span className="text-xs text-blue-400/60 font-mono">#{order.orderNumber}</span>
                    <p className="text-white font-semibold mt-0.5 text-lg">{order.customer?.name || "Customer"}</p>
                </div>
                <span className={`px-3 py-1 text-xs font-medium rounded-full ${badge?.className}`}>
                    {badge?.label || order.status}
                </span>
            </div>

            {/* Address */}
            <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl">
                <MapPin className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                    <p className="text-sm text-white/80">
                        {order.deliveryAddress?.street}, {order.deliveryAddress?.city}
                    </p>
                    {order.deliveryAddress?.instructions && (
                        <p className="text-xs text-blue-400/60 mt-1">📝 {order.deliveryAddress.instructions}</p>
                    )}
                </div>
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="flex items-center gap-2 text-white/70">
                    <DollarSign className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span className="font-semibold text-white">Rs. {order.pricing?.total?.toFixed(0)}</span>
                </div>
                <div className="flex items-center gap-2 text-white/70">
                    <CreditCard className="w-4 h-4 text-purple-400 flex-shrink-0" />
                    <span className="text-xs">{order.paymentInfo?.method}</span>
                </div>
                <div className="flex items-center gap-2 text-white/70">
                    <Phone className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    <a
                        href={`tel:${order.contactInfo?.phone}`}
                        className="text-xs text-blue-300 hover:text-white transition-colors"
                    >
                        {order.contactInfo?.phone}
                    </a>
                </div>
            </div>

            {/* Restaurant */}
            {order.restaurant && (
                <div className="text-xs text-white/40 flex items-center gap-2">
                    <span>🍽️</span>
                    <span>{order.restaurant.name}</span>
                </div>
            )}

            {/* Action button */}
            {flowConfig && (
                <button
                    onClick={() => onStatusUpdate(order._id, flowConfig.next)}
                    disabled={isUpdating === order._id}
                    className={`w-full py-3 ${flowConfig.bgColor} hover:opacity-90 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                    {isUpdating === order._id ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <>
                            <flowConfig.icon className="w-5 h-5" />
                            {flowConfig.label}
                            <ChevronRight className="w-4 h-4" />
                        </>
                    )}
                </button>
            )}

            {/* Cancel button for accepted+ orders */}
            {["accepted", "picked_up", "on_the_way"].includes(order.status) && (
                <button
                    onClick={() => onStatusUpdate(order._id, "cancelled")}
                    disabled={isUpdating === order._id}
                    className="w-full py-2 border border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-xl text-sm transition-all flex items-center justify-center gap-2"
                >
                    <XCircle className="w-4 h-4" />
                    Cancel Delivery
                </button>
            )}
        </motion.div>
    )
}

// ──────────────────────── Main Dashboard ────────────────────────
const RiderDashboard = () => {
    const [activeTab, setActiveTab] = useState<Tab>("orders")
    const [updatingId, setUpdatingId] = useState<string | null>(null)
    const [isTrackingEnabled, setIsTrackingEnabled] = useState(false)
    const dispatch = useDispatch<AppDispatch>()
    const navigate = useNavigate()
    const { orders, profile, isLoading, error } = useSelector((state: RootState) => state.rider)
    const [history, setHistory] = useState<any[]>([])
    const riderData = JSON.parse(localStorage.getItem("riderData") || "{}")

    // 1. Initial data fetch - only on mount
    useEffect(() => {
        if (!localStorage.getItem("riderToken")) {
            navigate("/rider/login", { replace: true })
            return
        }
        dispatch(fetchRiderOrders())
        dispatch(fetchRiderProfile())
    }, [dispatch, navigate])

    // 2. Geolocation reporting - depends on tracking toggle and active order
    useEffect(() => {
        let watchId: number | null = null;
        const activeOrder = orders.find(o => ["accepted", "picked_up", "on_the_way", "out_for_delivery"].includes(o.status));

        console.log("🚲 Tracking Status Check:", {
            hasGeolocation: !!navigator.geolocation,
            isSecureContext: window.isSecureContext,
            riderStatus: profile?.riderStatus,
            hasActiveOrder: !!activeOrder,
            activeOrderId: activeOrder?._id,
            isTrackingEnabled
        });

        if (!window.isSecureContext && window.location.hostname !== 'localhost') {
            console.warn("⚠️ WARNING: This site is not running in a Secure Context (HTTPS). Geolocation WILL NOT work on most mobile browsers.");
        }

        if (navigator.geolocation && activeOrder && isTrackingEnabled) {
            console.log(`📍 Starting track for Order: ${activeOrder.orderNumber}`);
            watchId = navigator.geolocation.watchPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    console.log(`🛰️ GPS raw: ${latitude}, ${longitude}`);
                    try {
                        const res = await api.put("/rider/location", {
                            lat: latitude,
                            lng: longitude,
                            orderId: activeOrder._id
                        });
                        if (res.data.success) {
                            console.log("✅ Location reported successfully");
                        }
                    } catch (err: any) {
                        console.error("❌ Failed to report location to backend:", err.response?.data || err.message);
                    }
                },
                (err) => {
                    console.error("❌ Geolocation error:", err.code, err.message);
                    if (err.code === 1) console.error("PERMISSION_DENIED: Please enable location access.");
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        }

        return () => {
            if (watchId !== null) {
                console.log("📍 Stopping track...");
                navigator.geolocation.clearWatch(watchId);
            }
        }
    }, [profile?.riderStatus, orders, isTrackingEnabled])

    // 3. Socket connections
    useEffect(() => {
        const socket = socketService.connect()
        if (socket) {
            socket.on("orderAssignedToRider", (data: { riderId: string; order: any }) => {
                if (data.riderId === riderData?._id || data.riderId === profile?._id) {
                    dispatch(addAssignedOrder(data.order))
                }
            })
        }
        return () => {
            socketService.getSocket()?.off("orderAssignedToRider")
        }
    }, [profile?._id, riderData?._id, dispatch])

    // 4. History fetching
    useEffect(() => {
        if (activeTab === "history") {
            dispatch(fetchRiderHistory()).then((res: any) => {
                if (res.payload) setHistory(res.payload)
            })
        }
    }, [activeTab, dispatch])

    const handleStatusUpdate = async (orderId: string, status: string) => {
        setUpdatingId(orderId)
        await dispatch(updateRiderOrderStatus({ orderId, status }))
        setUpdatingId(null)
    }

    const handleStatusToggle = async () => {
        if (!profile) return
        const newStatus = profile.riderStatus === "available" ? "offline" : "available"
        await dispatch(toggleRiderStatus(newStatus))
    }

    const handleLogout = () => {
        dispatch(riderLogout())
        navigate("/rider/login", { replace: true })
    }

    const tabs: { id: Tab; label: string; icon: any; count?: number }[] = [
        { id: "orders", label: "Active Orders", icon: Package, count: orders.length },
        { id: "history", label: "History", icon: History },
        { id: "profile", label: "Profile", icon: UserCircle },
    ]

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-xl border-b border-white/10">
                <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                            <Bike className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-white font-bold text-lg leading-tight">Rider Dashboard</p>
                            <p className="text-blue-400/70 text-xs">
                                {profile?.name || riderData?.name || "Delivery Staff"}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Availability Toggle */}
                        {profile && (
                            <button
                                onClick={handleStatusToggle}
                                disabled={isLoading}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 border ${profile.riderStatus === "available"
                                    ? "bg-green-500/10 border-green-500/30 text-green-400"
                                    : "bg-red-500/10 border-red-500/30 text-red-400"
                                    }`}
                            >
                                <div className={`w-1.5 h-1.5 rounded-full ${profile.riderStatus === "available" ? "bg-green-400 animate-pulse" : "bg-red-500"}`} />
                                {profile.riderStatus === "available" ? "Online" : "Offline"}
                            </button>
                        )}
                        <button
                            onClick={() => dispatch(fetchRiderOrders())}
                            className="p-2 text-blue-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                            title="Refresh orders"
                        >
                            <RefreshCw className="w-5 h-5" />
                        </button>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all text-sm"
                        >
                            <LogOut className="w-4 h-4" />
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
                {/* Status badge */}
                {profile && (
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl">
                            <div
                                className={`w-3 h-3 rounded-full ${profile.riderStatus === "available" ? "bg-green-400 animate-pulse" : "bg-yellow-400"
                                    }`}
                            />
                            <span className="text-sm text-white/80 capitalize">
                                Status:{" "}
                                <span className={profile.riderStatus === "available" ? "text-green-400" : "text-yellow-400"}>
                                    {profile.riderStatus}
                                </span>
                            </span>
                            {profile.stats && (
                                <span className="ml-auto text-xs text-blue-400/60">
                                    {profile.stats.totalDeliveries} deliveries completed
                                </span>
                            )}
                        </div>

                        {/* Tracking Toggle - ONLY SHOW IF ONLINE AND HAS ACTIVE ORDER */}
                        {profile.riderStatus === "available" && orders.some(o => ["accepted", "picked_up", "on_the_way"].includes(o.status)) && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center justify-between p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl shadow-lg"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${isTrackingEnabled ? "bg-blue-500 text-white" : "bg-slate-700 text-slate-400"}`}>
                                        <MapPin className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white">Live Location Sharing</p>
                                        <p className="text-xs text-blue-300/70">
                                            {isTrackingEnabled ? "Customers can see you on map" : "Currently hidden from customers"}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsTrackingEnabled(!isTrackingEnabled)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isTrackingEnabled ? "bg-blue-600" : "bg-slate-700"
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isTrackingEnabled ? "translate-x-6" : "translate-x-1"
                                            }`}
                                    />
                                </button>
                            </motion.div>
                        )}
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                        <p className="text-red-300 text-sm">{error}</p>
                    </div>
                )}

                {/* Tabs */}
                <div className="flex bg-white/5 rounded-xl p-1 gap-1">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                                ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg"
                                : "text-white/50 hover:text-white"
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            <span className="hidden sm:inline">{tab.label}</span>
                            {tab.count !== undefined && tab.count > 0 && (
                                <span className="bg-white/20 rounded-full px-1.5 py-0.5 text-xs">{tab.count}</span>
                            )}
                        </button>
                    ))}
                </div>

                {/* ─── Tab: Active Orders ─── */}
                {activeTab === "orders" && (
                    <div className="space-y-4">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-16 gap-4">
                                <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
                                <p className="text-white/50">Loading your orders...</p>
                            </div>
                        ) : orders.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-col items-center justify-center py-20 gap-4 text-center"
                            >
                                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center">
                                    <Package className="w-10 h-10 text-white/20" />
                                </div>
                                <p className="text-white/40 font-medium">No active orders assigned</p>
                                <p className="text-white/25 text-sm">The admin will assign orders to you soon</p>
                            </motion.div>
                        ) : (
                            <AnimatePresence mode="popLayout">
                                {orders.map((order: any) => (
                                    <OrderCard
                                        key={order._id}
                                        order={order}
                                        onStatusUpdate={handleStatusUpdate}
                                        isUpdating={updatingId}
                                    />
                                ))}
                            </AnimatePresence>
                        )}
                    </div>
                )}

                {/* ─── Tab: Delivery History ─── */}
                {activeTab === "history" && (
                    <div className="space-y-4">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-16">
                                <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
                            </div>
                        ) : history.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                                <History className="w-12 h-12 text-white/20" />
                                <p className="text-white/40">No delivery history yet</p>
                            </div>
                        ) : (
                            <>
                                {/* Summary bar */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                                        <p className="text-2xl font-bold text-green-400">
                                            {history.filter((o: any) => o.status === "delivered").length}
                                        </p>
                                        <p className="text-xs text-white/40 mt-1">Delivered</p>
                                    </div>
                                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                                        <p className="text-2xl font-bold text-white">
                                            Rs.{" "}
                                            {history
                                                .filter((o: any) => o.status === "delivered")
                                                .reduce((s: number, o: any) => s + (o.pricing?.deliveryFee || 0), 0)
                                                .toFixed(0)}
                                        </p>
                                        <p className="text-xs text-white/40 mt-1">Total Earnings</p>
                                    </div>
                                </div>

                                {/* History table */}
                                <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                                    <div className="grid grid-cols-4 gap-3 px-4 py-3 border-b border-white/10 text-xs text-white/40 font-medium uppercase tracking-wider">
                                        <span>Order ID</span>
                                        <span>Date</span>
                                        <span>Earnings</span>
                                        <span>Status</span>
                                    </div>
                                    <div className="divide-y divide-white/5">
                                        {history.map((order: any) => (
                                            <div key={order._id} className="grid grid-cols-4 gap-3 px-4 py-3 items-center text-sm">
                                                <span className="text-blue-300 font-mono text-xs truncate">
                                                    #{order.orderNumber?.slice(-6) || "------"}
                                                </span>
                                                <span className="text-white/60 text-xs">
                                                    {new Date(order.updatedAt).toLocaleDateString("en-PK", {
                                                        day: "2-digit",
                                                        month: "short",
                                                    })}
                                                </span>
                                                <span className="text-green-400 font-semibold">
                                                    Rs. {order.pricing?.deliveryFee?.toFixed(0) || "0"}
                                                </span>
                                                <span
                                                    className={`px-2 py-0.5 rounded-full text-xs font-medium inline-block ${STATUS_BADGES[order.status]?.className || ""
                                                        }`}
                                                >
                                                    {STATUS_BADGES[order.status]?.label || order.status}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* ─── Tab: Profile ─── */}
                {activeTab === "profile" && (
                    <div className="space-y-4">
                        {/* Profile card */}
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center gap-5">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                                <User className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">{profile?.name || riderData?.name}</h3>
                                <p className="text-blue-300/70 text-sm">{profile?.email || riderData?.email}</p>
                                <p className="text-white/50 text-sm mt-1">{profile?.phone || riderData?.phone}</p>
                            </div>
                        </div>

                        {/* Stats grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                                    </div>
                                    <p className="text-white/60 text-sm">Total Deliveries</p>
                                </div>
                                <p className="text-3xl font-bold text-white">{profile?.stats?.totalDeliveries ?? 0}</p>
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                        <TrendingUp className="w-4 h-4 text-blue-400" />
                                    </div>
                                    <p className="text-white/60 text-sm">Total Earnings</p>
                                </div>
                                <p className="text-3xl font-bold text-white">
                                    Rs. {profile?.stats?.totalEarnings?.toFixed(0) ?? 0}
                                </p>
                            </div>
                        </div>

                        {/* Account status */}
                        <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                            <h4 className="text-white/80 font-medium text-sm">Account Info</h4>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-white/50">Rider Status</span>
                                <span
                                    className={`font-semibold capitalize ${profile?.riderStatus === "available" ? "text-green-400" : "text-yellow-400"
                                        }`}
                                >
                                    {profile?.riderStatus || "—"}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-white/50">Account Active</span>
                                <span className={profile?.isActive ? "text-green-400" : "text-red-400"}>
                                    {profile?.isActive ? "✓ Active" : "✗ Inactive"}
                                </span>
                            </div>
                        </div>

                        {/* Logout button */}
                        <button
                            onClick={handleLogout}
                            className="w-full py-3 border border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-xl font-medium transition-all flex items-center justify-center gap-3"
                        >
                            <LogOut className="w-5 h-5" />
                            Sign Out
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default RiderDashboard
