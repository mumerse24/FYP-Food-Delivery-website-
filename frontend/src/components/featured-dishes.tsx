import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, Clock } from "lucide-react"

const featuredDishes = [
  {
    id: 1,
    name: "Margherita Pizza",
    description: "Fresh tomatoes, mozzarella, and basil on crispy crust",
    price: "$18.99",
    rating: 4.8,
    time: "25-30 min",
    image: "/margherita-pizza-with-fresh-basil.png",
    badge: "Popular",
  },
  {
    id: 2,
    name: "Chicken Burger",
    description: "Grilled chicken breast with lettuce, tomato, and special sauce",
    price: "$14.99",
    rating: 4.6,
    time: "20-25 min",
    image: "/gourmet-chicken-burger-with-fresh-ingredients.png",
    badge: "New",
  },
  {
    id: 3,
    name: "Caesar Salad",
    description: "Crisp romaine lettuce with parmesan, croutons, and caesar dressing",
    price: "$12.99",
    rating: 4.7,
    time: "15-20 min",
    image: "/fresh-caesar-salad-with-parmesan-and-croutons.png",
    badge: "Healthy",
  },
  {
    id: 4,
    name: "Beef Tacos",
    description: "Seasoned ground beef with fresh salsa and cheese",
    price: "$16.99",
    rating: 4.9,
    time: "20-25 min",
    image: "/delicious-beef-tacos-with-fresh-toppings.png",
    badge: "Spicy",
  },
]

export function FeaturedDishes() {
  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">Featured Dishes</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover our most popular dishes, carefully crafted by top chefs and loved by thousands of customers.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredDishes.map((dish) => (
            <Card key={dish.id} className="bg-card border-border hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className="relative">
                  <img
                    src={dish.image || "/placeholder.svg"}
                    alt={dish.name}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                  <Badge className="absolute top-3 left-3 bg-accent text-accent-foreground">{dish.badge}</Badge>
                </div>

                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-card-foreground">{dish.name}</h3>
                    <span className="font-bold text-primary">{dish.price}</span>
                  </div>

                  <p className="text-sm text-muted-foreground text-pretty">{dish.description}</p>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-secondary fill-current" />
                      <span className="text-muted-foreground">{dish.rating}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{dish.time}</span>
                    </div>
                  </div>

                  <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">Order Now</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
