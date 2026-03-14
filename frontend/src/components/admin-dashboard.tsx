import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, Store, DollarSign, Clock, CheckCircle, XCircle, Eye } from "lucide-react"

export function AdminDashboard() {
  const stats = [
    {
      title: "Total Restaurants",
      value: "1,234",
      change: "+12%",
      icon: Store,
      color: "text-blue-600",
    },
    {
      title: "Active Orders",
      value: "856",
      change: "+8%",
      icon: Clock,
      color: "text-orange-600",
    },
    {
      title: "Total Revenue",
      value: "$45,678",
      change: "+15%",
      icon: DollarSign,
      color: "text-green-600",
    },
    {
      title: "New Users",
      value: "2,345",
      change: "+23%",
      icon: Users,
      color: "text-purple-600",
    },
  ]

  const recentOrders = [
    {
      id: "#12345",
      restaurant: "Mario's Pizza",
      customer: "John Doe",
      amount: "$24.99",
      status: "delivered",
      time: "2 mins ago",
    },
    {
      id: "#12346",
      restaurant: "Spice Garden",
      customer: "Jane Smith",
      amount: "$18.50",
      status: "preparing",
      time: "5 mins ago",
    },
    {
      id: "#12347",
      restaurant: "Burger Palace",
      customer: "Mike Johnson",
      amount: "$32.75",
      status: "cancelled",
      time: "8 mins ago",
    },
  ]

  const pendingRestaurants = [
    {
      name: "Golden Dragon",
      owner: "Chen Wei",
      cuisine: "Chinese",
      submitted: "2 days ago",
      status: "pending",
    },
    {
      name: "Taco Fiesta",
      owner: "Maria Garcia",
      cuisine: "Mexican",
      submitted: "1 day ago",
      status: "pending",
    },
  ]

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-green-600">{stat.change} from last month</p>
                </div>
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{order.id}</span>
                      <Badge
                        variant={
                          order.status === "delivered"
                            ? "default"
                            : order.status === "preparing"
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {order.status === "delivered" && <CheckCircle className="w-3 h-3 mr-1" />}
                        {order.status === "preparing" && <Clock className="w-3 h-3 mr-1" />}
                        {order.status === "cancelled" && <XCircle className="w-3 h-3 mr-1" />}
                        {order.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{order.restaurant}</p>
                    <p className="text-sm">{order.customer}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{order.amount}</p>
                    <p className="text-xs text-muted-foreground">{order.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pending Restaurant Applications */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Restaurant Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingRestaurants.map((restaurant, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">{restaurant.name}</h4>
                    <Badge variant="outline">Pending Review</Badge>
                  </div>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>Owner: {restaurant.owner}</p>
                    <p>Cuisine: {restaurant.cuisine}</p>
                    <p>Submitted: {restaurant.submitted}</p>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" variant="outline">
                      <Eye className="w-4 h-4 mr-1" />
                      Review
                    </Button>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                    <Button size="sm" variant="destructive">
                      <XCircle className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
