const socketIo = require("socket.io")

let io

const initSocket = (server) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(",")
        : ["http://localhost:3000", "http://localhost:5173", "http://localhost:8080"]

    io = socketIo(server, {
        cors: {
            origin: allowedOrigins,
            methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
            credentials: true,
        },
    })

    io.on("connection", (socket) => {
        console.log(`🔌 New client connected: ${socket.id}`)

        // Optional: add room joining logic here if needed later
        // socket.on("joinRestaurantRoom", (restaurantId) => {
        //   socket.join(restaurantId)
        // })

        socket.on("disconnect", () => {
            console.log(`🔌 Client disconnected: ${socket.id}`)
        })
    })

    return io
}

const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!")
    }
    return io
}

module.exports = { initSocket, getIO }
