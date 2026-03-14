import { io, Socket } from "socket.io-client"

// Use environment variable for API URL or fallback to localhost
const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:5000"

class SocketService {
    private socket: Socket | null = null

    connect() {
        if (!this.socket) {
            // We connect to the root URL since that's where socket.io is attached
            const baseUrl = SOCKET_URL.replace("/api", "")

            this.socket = io(baseUrl, {
                withCredentials: true,
                transports: ["websocket", "polling"],
            })

            this.socket.on("connect", () => {
                console.log("✅ Custom Socket connected:", this.socket?.id)
            })

            this.socket.on("connect_error", (error) => {
                console.error("❌ Socket connection error:", error.message)
            })

            this.socket.on("disconnect", (reason) => {
                console.log("🔌 Socket disconnected:", reason)
            })
        }
        return this.socket
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect()
            this.socket = null
        }
    }

    getSocket() {
        return this.socket
    }
}

export const socketService = new SocketService()
export default socketService
