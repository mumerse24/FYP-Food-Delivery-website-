import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, Clock, TrendingUp } from "lucide-react"

import { useState, useEffect } from "react"
import api from "@/services/api"

export interface FeaturedDish {
  _id: string;
  name: string;
  description: string;
  price: number;
  rating: { average: number; count: number };
  preparationTime: string;
  images: string[];
  isPopular: boolean;
  category: string;
  orderCount: number;
}

export function FeaturedDishes() {
  const [dishes, setDishes] = useState<FeaturedDish[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPopularDishes = async () => {
      try {
        const response = await api.get('/menu/popular/all?limit=4');
        if (response.data.success) {
          setDishes(response.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch popular dishes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPopularDishes();
  }, []);

  if (loading) {
    return (
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <p>Loading popular dishes...</p>
        </div>
      </section>
    );
  }

  if (dishes.length === 0) {
    return null; // Don't show the section if no dishes found
  }

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
          {dishes.map((dish) => (
            <Card key={dish._id} className="bg-card border-border hover:shadow-lg transition-shadow">
              <CardContent className="p-0 flex flex-col h-full">
                <div className="relative">
                  <img
                    src={(dish.images && dish.images.length > 0) ? dish.images[0] : "/placeholder.svg"}
                    alt={dish.name}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                  {dish.isPopular && <Badge className="absolute top-3 left-3 bg-accent text-accent-foreground">Popular</Badge>}
                </div>

                <div className="flex-1 p-4 space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-card-foreground line-clamp-1" title={dish.name}>{dish.name}</h3>
                      <span className="font-bold text-primary whitespace-nowrap">Rs. {dish.price}</span>
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2 mt-2" title={dish.description}>{dish.description}</p>
                  </div>

                  <div className="space-y-4 mt-auto">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-secondary fill-current" />
                        <span className="text-muted-foreground truncate max-w-[50%]">{dish.rating?.average?.toFixed(1) || "New"} ({dish.rating?.count || 0})</span>
                      </div>
                      <div className="flex items-center space-x-1 shrink-0">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{dish.preparationTime}</span>
                      </div>
                    </div>

                    {dish.orderCount > 0 && (
                      <div className="flex items-center space-x-2 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-md w-fit mt-2">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>Ordered {dish.orderCount}+ times</span>
                      </div>
                    )}

                    <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground mt-3">Order Now</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
