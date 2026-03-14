import { useEffect, useState, useMemo, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import L from "leaflet"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bike, MapPin, Navigation, Phone, Clock, ArrowLeft, Loader2 } from "lucide-react"
import socketService from "@/services/socket"
import api from "@/services/api"
import "leaflet/dist/leaflet.css"

// Base fix for Leaflet icons in Vite
// We use CDN or local assets to be sure they load
const iconRetinaUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png';
const iconUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png';
const shadowUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconRetinaUrl,
    iconUrl,
    shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom Rider Icon
const RiderIcon = L.divIcon({
    html: `<div class="bg-blue-600 p-2 rounded-full border-2 border-white shadow-lg flex items-center justify-center" style="width: 36px; height: 36px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bike"><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/></svg>
           </div>`,
    className: "custom-rider-icon",
    iconSize: [36, 36],
    iconAnchor: [18, 18],
})

function MapRecenter({ position }: { position: [number, number] }) {
    const map = useMap()
    useEffect(() => {
        if (position) map.setView(position)
    }, [position, map])
    return null
}

export default function OrderTrackingPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [order, setOrder] = useState<any>(null)
    const [riderLocation, setRiderLocation] = useState<[number, number] | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const orderRef = useRef<any>(null)

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                setLoading(true)
                console.log(`🔍 Fetching tracking data for order: ${id}`)
                const res = await api.get(`/orders/${id}`)
                if (res.data.success && res.data.data) {
                    const orderData = res.data.data
                    setOrder(orderData)
                    orderRef.current = orderData
                    if (orderData.assignedDriver?.currentLocation) {
                        const { lat, lng } = orderData.assignedDriver.currentLocation
                        if (lat && lng) {
                            console.log(`📍 Initial rider location found: ${lat}, ${lng}`)
                            setRiderLocation([lat, lng])
                        }
                    }
                } else {
                    setError("Order not found")
                }
            } catch (err: any) {
                console.error("❌ Fetch order error:", err)
                setError(err.response?.data?.message || "Failed to load order tracking")
            } finally {
                setLoading(false)
            }
        }

        if (id) fetchOrder()

        const socket = socketService.connect()
        if (socket) {
            console.log("🔌 Socket connected for tracking")
            socket.on("riderLocationUpdate", (data: any) => {
                console.log("📡 Received riderLocationUpdate:", data)
                const currentOrder = orderRef.current
                const isMatch = data.orderId === id ||
                    (currentOrder?.assignedDriver?._id && data.riderId === currentOrder.assignedDriver._id)

                if (isMatch) {
                    if (data.lat && data.lng) {
                        console.log(`✅ Updating marker: ${data.lat}, ${data.lng}`)
                        setRiderLocation([data.lat, data.lng])
                    }
                } else {
                    console.log("⏭️ Location update ignored (not for this order/rider)")
                }
            })
        }

        return () => {
            console.log("🔌 Cleaning up tracking socket")
            socketService.getSocket()?.off("riderLocationUpdate")
        }
    }, [id]) // Only depend on id, use ref for dynamic order data

    // Memoize static positions to avoid unnecessary recalculations
    const positions = useMemo(() => {
        const restaurantPos: [number, number] = [
            order?.restaurant?.address?.coordinates?.lat || 34.0151,
            order?.restaurant?.address?.coordinates?.lng || 71.5249
        ]
        const customerPos: [number, number] = [
            order?.deliveryAddress?.coordinates?.lat || 34.0151,
            order?.deliveryAddress?.coordinates?.lng || 71.5805
        ]
        return { restaurant: restaurantPos, customer: customerPos }
    }, [order])

    if (loading) return (
        <div className="flex flex-col h-screen items-center justify-center bg-slate-900 text-white">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
            <p className="animate-pulse">Connecting to live tracking...</p>
        </div>
    )

    if (error || !order) return (
        <div className="flex flex-col h-screen items-center justify-center p-6 text-center bg-slate-50">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <MapPin className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold mb-2">Oops! Tracking Unavailable</h2>
            <p className="text-slate-500 max-w-xs mb-6">{error || "We couldn't find this order."}</p>
            <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
    )

    // Center on rider if out for delivery, otherwise on restaurant/customer
    const currentCenter = riderLocation || positions.customer

    return (
        <div className="fixed inset-0 flex flex-col bg-slate-50 overflow-hidden">
            <header className="bg-white/80 backdrop-blur-md border-b px-4 py-3 flex items-center gap-4 z-[1001]">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="font-bold text-base leading-none">Order Tracking</h1>
                    <p className="text-[10px] text-slate-500 font-mono mt-1 uppercase tracking-tighter">#{order.orderNumber}</p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Live</span>
                </div>
            </header>

            <div className="flex-1 relative">
                <MapContainer
                    center={currentCenter}
                    zoom={15}
                    style={{ height: "100%", width: "100%" }}
                    zoomControl={false}
                >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                    {/* Restaurant Marker */}
                    <Marker position={positions.restaurant}>
                        <Popup>Restaurant: {order.restaurant?.name || "The Lab"}</Popup>
                    </Marker>

                    {/* Customer Marker */}
                    <Marker position={positions.customer}>
                        <Popup>Your Location</Popup>
                    </Marker>

                    {/* Rider Marker */}
                    {riderLocation && (
                        <Marker position={riderLocation} icon={RiderIcon}>
                            <Popup>Rider is here</Popup>
                        </Marker>
                    )}

                    <MapRecenter position={currentCenter} />
                </MapContainer>

                {/* Floating Order Card */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-[1000]">
                    <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="text-xl font-black">Order #{order.orderNumber || "---"}</CardTitle>
                                    </div>
                                    <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mt-1">
                                        {(order.status || "Processing").replace(/_/g, " ")}
                                    </p>
                                </div>
                                <div className="bg-blue-600 p-2 rounded-2xl shadow-lg shadow-blue-500/30">
                                    <Bike className="w-6 h-6 text-white" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-4 p-3 bg-blue-50 border border-blue-100 rounded-2xl">
                                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
                                    <Navigation className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-blue-600/80 font-bold uppercase tracking-widest">Estimated Arrival</p>
                                    <p className="text-lg font-black text-slate-900 leading-none mt-1">15 - 20 mins</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center overflow-hidden">
                                        <Bike className="w-5 h-5 text-slate-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-slate-900">{order.assignedDriver?.name || "Rider Assigned"}</p>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Your Delivery Hero</p>
                                    </div>
                                </div>
                                {order.assignedDriver?.phone && (
                                    <Button size="icon" variant="secondary" className="rounded-full bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/20">
                                        <a href={`tel:${order.assignedDriver.phone}`}>
                                            <Phone className="w-4 h-4" />
                                        </a>
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
