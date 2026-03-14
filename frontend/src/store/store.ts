import { configureStore } from "@reduxjs/toolkit"
import authSlice from "./slices/authSlice"
import restaurantSlice from "./slices/restaurantSlice"
import menuSlice from "./slices/menuSlice"
import cartSlice from "./slices/cartSlice"
import orderSlice from "./slices/orderSlice"
import adminSlice from "./slices/adminSlice"

export const store = configureStore({
  reducer: {
    auth: authSlice,
    restaurants: restaurantSlice,
    menu: menuSlice,
    cart: cartSlice,
    orders: orderSlice,
    admin: adminSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST"],
      },
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
