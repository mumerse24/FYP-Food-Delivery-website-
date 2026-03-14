import { Routes, Route, Navigate } from "react-router-dom"
import { Provider } from "react-redux"
import { store } from "./store/store"
import { ThemeProvider } from "./components/theme-provider"
import { CartProvider } from "./lib/cart-context"

// Pages
import HomePage from "./pages/HomePage"
import MenuPage from "./pages/MenuPage"
import AboutPage from "./pages/AboutPage"
import ContactPage from "./pages/ContactPage"
import RestaurantPage from "./pages/RestaurantPage"
import RegisterRestaurantPage from "./pages/RegisterRestaurantPage"
import CheckoutPage from "./pages/Checkout" // ✅ Changed to CheckoutPage
import OrderConfirmationPage from "./pages/SuccessPage" // ✅ NEW
import SuccessPage from "./pages/SuccessPage" // ✅ NEW
import OrderHistoryPage from "./pages/OrderHistory" // ✅ NEW

// Admin - All admin files are in pages folder
import AdminPage from "./pages/AdminPage"
import AdminLogin from "./pages/admin-login"

// Rider
import RiderLogin from "./pages/rider-login"
import RiderDashboard from "./pages/rider-dashboard"

// ✅ Admin Protected Route Component
const AdminRoute = ({ children }: { children: JSX.Element }) => {
  const token = localStorage.getItem("adminToken")
  return token ? children : <Navigate to="/admin/login" replace />
}

// ✅ Rider Protected Route Component
const RiderRoute = ({ children }: { children: JSX.Element }) => {
  const token = localStorage.getItem("riderToken")
  return token ? children : <Navigate to="/rider/login" replace />
}

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <CartProvider>
          <div className="min-h-screen bg-background font-sans antialiased">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/menu" element={<MenuPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/restaurant/:id" element={<RestaurantPage />} />
              <Route path="/register-restaurant" element={<RegisterRestaurantPage />} />
              <Route path="/checkout" element={<CheckoutPage />} /> {/* ✅ Updated */}
              <Route path="/order-confirmation" element={<OrderConfirmationPage />} /> {/* ✅ NEW */}
              <Route path="/success" element={<SuccessPage />} /> {/* ✅ NEW */}
              <Route path="/order-history" element={<OrderHistoryPage />} /> {/* ✅ NEW */}

              {/* Admin Routes */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/adminpage" element={<AdminPage />} />

              {/* ✅ Protected Admin Dashboard */}
              <Route
                path="/admin/dashboard"
                element={
                  <AdminRoute>
                    <AdminPage />
                  </AdminRoute>
                }
              />

              {/* ✅ Redirect /admin to /admin/dashboard */}
              <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

              {/* ✅ Rider Routes */}
              <Route path="/rider/login" element={<RiderLogin />} />
              <Route
                path="/rider/dashboard"
                element={
                  <RiderRoute>
                    <RiderDashboard />
                  </RiderRoute>
                }
              />
              <Route path="/rider" element={<Navigate to="/rider/dashboard" replace />} />

              {/* ✅ Catch-all route - redirect to home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </CartProvider>
      </ThemeProvider>
    </Provider>
  )
}

export default App