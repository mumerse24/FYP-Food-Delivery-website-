import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Search, Menu as MenuIcon, LogIn, UserPlus, LogOut, User, UtensilsCrossed, History, ShoppingBag, Home } from "lucide-react"
import { CartSidebar } from "@/components/cart-sidebar"
import { AuthModal } from "@/components/auth-modal"
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { logout } from "@/store/slices/authSlice"

export function Header() {
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin")

  const dispatch = useDispatch()
  const navigate = useNavigate()

  const { isAuthenticated, user } = useSelector((state: any) => state.auth)

  const openSignIn = () => {
    setAuthMode("signin")
    setAuthModalOpen(true)
  }
  const handleAdminLogin = () => {
    navigate("/admin/login")
  }
  const openSignUp = () => {
    setAuthMode("signup")
    setAuthModalOpen(true)
  }
  const handleLogout = () => {
    dispatch(logout())
    navigate("/") // redirect to homepage after logout
  }

  // ✅ NEW: Handle Order History
  const handleOrderHistory = () => {
    if (isAuthenticated) {
      navigate("/order-history")
    } else {
      openSignIn() // If not logged in, show sign in modal
    }
  }

  return (
    <header className="bg-background/95 backdrop-blur-sm border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">D</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              DineFlow
            </span>
          </Link>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search for restaurants, cuisines, or dishes..."
                className="pl-10 bg-input/50 border-border rounded-full focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              to="/"
              className="flex items-center space-x-2 text-foreground hover:text-amber-600 transition-all font-medium group"
            >
              <Home className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
              <span>Home</span>
            </Link>
            
            <Link
              to="/menu"
              className="flex items-center space-x-2 text-foreground hover:text-amber-600 transition-all font-medium group"
            >
              <UtensilsCrossed className="w-4 h-4 group-hover:rotate-12 transition-transform duration-200" />
              <span>Menu</span>
            </Link>

            {/* ✅ ORDER HISTORY BUTTON */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleOrderHistory}
              className="flex items-center space-x-2 text-foreground hover:text-amber-600 hover:bg-amber-50 transition-all font-medium"
            >
              <History className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
              <span>Orders</span>
            </Button>

            <Link to="/about" className="text-foreground hover:text-amber-600 transition-colors font-medium">
              About
            </Link>
            <Link to="/contact" className="text-foreground hover:text-amber-600 transition-colors font-medium">
              Contact
            </Link>

            <CartSidebar />

            {/* Auth Buttons */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900">{user?.name || "User"}</span>
                    <button 
                      onClick={handleOrderHistory}
                      className="text-xs text-amber-600 hover:text-amber-700 text-left"
                    >
                      View Orders
                    </button>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleLogout} 
                  className="hover:bg-amber-50 border border-amber-200"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={openSignIn} className="hover:bg-amber-50">
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </Button>

                <Button
                  size="sm"
                  onClick={openSignUp}
                  className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Sign Up
                </Button>

                {/* ✅ ADMIN LOGIN BUTTON */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAdminLogin}
                  className="border-amber-500 text-amber-600 hover:bg-amber-50"
                >
                  Admin Login
                </Button>
              </>
            )}
          </nav>

          {/* Mobile Navigation */}
          <div className="flex md:hidden items-center space-x-2">
            <CartSidebar />
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-amber-50">
                  <MenuIcon className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 bg-background/95 backdrop-blur-sm">
                <div className="flex flex-col space-y-8 mt-8">
                  <nav className="flex flex-col space-y-6">
                    {/* Home */}
                    <Link
                      to="/"
                      className="flex items-center text-foreground hover:text-amber-600 text-lg font-medium py-2 border-b border-border/50"
                    >
                      <Home className="w-5 h-5 mr-2 text-amber-600" />
                      Home
                    </Link>

                    {/* Menu */}
                    <Link
                      to="/menu"
                      className="flex items-center text-foreground hover:text-amber-600 text-lg font-medium py-2 border-b border-border/50"
                    >
                      <UtensilsCrossed className="w-5 h-5 mr-2 text-amber-600" />
                      Menu
                    </Link>

                    {/* ✅ ORDER HISTORY (Mobile) */}
                    <button
                      onClick={handleOrderHistory}
                      className="flex items-center text-foreground hover:text-amber-600 text-lg font-medium py-2 border-b border-border/50 text-left"
                    >
                      <History className="w-5 h-5 mr-2 text-amber-600" />
                      My Orders
                    </button>

                    {/* About */}
                    <Link to="/about" className="text-foreground hover:text-amber-600 text-lg font-medium py-2 border-b border-border/50">
                      About
                    </Link>

                    {/* Contact */}
                    <Link to="/contact" className="text-foreground hover:text-amber-600 text-lg font-medium py-2 border-b border-border/50">
                      Contact
                    </Link>
                  </nav>

                  {/* Mobile Auth Buttons */}
                  {isAuthenticated ? (
                    <>
                      {/* User Info */}
                      <div className="flex items-center space-x-3 p-3 bg-amber-50 rounded-lg">
                        <div className="w-10 h-10 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-amber-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{user?.name || "User"}</p>
                          <button 
                            onClick={handleOrderHistory}
                            className="text-sm text-amber-600 hover:text-amber-700 mt-1"
                          >
                            View Order History
                          </button>
                        </div>
                      </div>

                      {/* Logout Button */}
                      <Button
                        variant="outline"
                        onClick={handleLogout}
                        className="justify-start bg-transparent hover:bg-amber-50 border-amber-200"
                      >
                        <LogOut className="w-5 h-5 mr-3" />
                        Logout
                      </Button>
                    </>
                  ) : (
                    <div className="flex flex-col space-y-3 pt-4">
                      {/* Sign In */}
                      <Button
                        variant="outline"
                        onClick={openSignIn}
                        className="justify-start bg-transparent hover:bg-amber-50 border-amber-200"
                      >
                        <LogIn className="w-5 h-5 mr-3" />
                        Sign In
                      </Button>

                      {/* Sign Up */}
                      <Button
                        onClick={openSignUp}
                        className="justify-start bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                      >
                        <UserPlus className="w-5 h-5 mr-3" />
                        Sign Up
                      </Button>

                      {/* ✅ Admin Login */}
                      <Button
                        variant="outline"
                        onClick={handleAdminLogin}
                        className="justify-start border-amber-500 text-amber-600 hover:bg-amber-50"
                      >
                        Admin Login
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        mode={authMode}
        onModeChange={setAuthMode}
      />
    </header>
  )
}