import { motion } from "framer-motion"

// --- Data & Type Definitions ---

export type MenuItem = {
  id: number;
  name: string;
  description: string;
  price: number;
  cuisine: string;
  category: string; // NEW: Added category field
  rating: number;
  image: string;
};

export type Filters = {
  categories: string[]; // NEW: Filter by category
  cuisines: string[]; 
  rating: string;     
  price: string;      
};

// Updated Menu Items with Categories
export const menuItems: MenuItem[] = [
  {
    id: 1,
    name: "Margherita Pizza",
    description: "Classic delight with mozzarella cheese & tomato sauce.",
    price: 12.99,
    cuisine: "Italian",
    category: "Main Course",
    rating: 4.5,
    image: "/margherita-pizza.png",
  },
  {
    id: 2,
    name: "Chicken Tikka Masala",
    description: "Spicy and creamy chicken curry served with basmati rice.",
    price: 13.99,
    cuisine: "Indian",
    category: "Main Course",
    rating: 4.3,
    image: "/chicken-tikka-masala.png",
  },
  {
    id: 3,
    name: "Beef Burger with Fries",
    description: "Juicy grilled beef patty with crispy golden fries.",
    price: 11.50,
    cuisine: "American",
    category: "Main Course",
    rating: 4.0,
    image: "/beef-burger-with-fries.png",
  },
  {
    id: 4,
    name: "Caesar Salad",
    description: "Crisp lettuce, parmesan, croutons and Caesar dressing.",
    price: 9.50,
    cuisine: "French",
    category: "Salads",
    rating: 4.2,
    image: "/caesar-salad.png",
  },
  {
    id: 5,
    name: "Chocolate Lava Cake",
    description: "Warm molten chocolate cake with ice cream.",
    price: 8.99,
    cuisine: "French",
    category: "Desserts",
    rating: 4.1,
    image: "/chocolate-lava-cake.png",
  },
  {
    id: 6,
    name: "Ramen Noodles", 
    description: "Classic Japanese noodles served in a savory broth.",
    price: 12.99,
    cuisine: "Japanese",
    category: "Main Course",
    rating: 4.6,
    image: "/ramen.png",
  },
  {
    id: 7,
    name: "Chinese Dim Sum",
    description: "Steamed dumplings filled with flavorful goodness.",
    price: 10.99,
    cuisine: "Chinese",
    category: "Appetizers",
    rating: 4.4,
    image: "/chinese-dim-sum.png",
  },
  // --- NEW ITEMS TO COVER CATEGORIES ---
  {
    id: 8,
    name: "Miso Soup",
    description: "Traditional Japanese soup with tofu and seaweed.",
    price: 5.99,
    cuisine: "Japanese",
    category: "Soups",
    rating: 4.7,
    image: "/miso-soup.png",
  },
  {
    id: 9,
    name: "Garlic Butter Naan",
    description: "Soft Indian bread brushed with garlic butter.",
    price: 3.99,
    cuisine: "Indian",
    category: "Sides",
    rating: 4.8,
    image: "/garlic-naan.png",
  },
  {
    id: 10,
    name: "Iced Matcha Latte",
    description: "Refreshing green tea drink with milk and ice.",
    price: 4.50,
    cuisine: "Japanese",
    category: "Beverages",
    rating: 4.5,
    image: "/matcha-latte.png",
  },
];

const priceRanges: { [key: string]: { min: number; max: number | null } } = {
  "$": { min: 0, max: 14.99 },
  "$$": { min: 15.00, max: 29.99 },
  "$$$": { min: 30.00, max: 49.99 },
  "$$$$": { min: 50.00, max: null },
};

export default function RestaurantMenu({ filters }: { filters: Filters }) {

  const filteredItems = menuItems.filter((item) => {
    
    // 1. Category Filter (NEW)
    if (filters.categories.length > 0 && !filters.categories.includes(item.category)) {
      return false;
    }

    // 2. Cuisine filter
    if (filters.cuisines.length > 0 && !filters.cuisines.includes(item.cuisine)) {
      return false;
    }

    // 3. Rating filter
    if (filters.rating) {
      const minRating = parseFloat(filters.rating);
      if (item.rating < minRating) return false;
    }

    // 4. Price filter
    if (filters.price) {
      const range = priceRanges[filters.price];
      if (range) {
        if (item.price < range.min) return false;
        if (range.max !== null && item.price > range.max) return false;
      }
    }

    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

      <div className="text-center mb-12">
        <h2 className="text-4xl font-extrabold text-gray-900 mb-3 font-poppins">
          Explore Our <span className="text-amber-600">Menu</span>
        </h2>
        <p className="text-gray-500 max-w-xl mx-auto">
          Taste the freshness and flavors that define our kitchen.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-gradient-to-b from-white to-orange-50 rounded-3xl shadow-lg hover:shadow-2xl overflow-hidden border border-amber-100 transition-all duration-500 hover:-translate-y-2"
            >
              <div className="h-56 overflow-hidden bg-gray-100">
                <img
                  src={item.image}
                  alt={item.name}
                  onError={(e) => {e.currentTarget.src = "https://placehold.co/600x400/orange/white?text=" + item.name.replace(/ /g, "+")}}
                  className="w-full h-full object-cover rounded-t-3xl transition-transform duration-500 hover:scale-110"
                />
              </div>

              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-xl text-gray-800">{item.name}</h3>
                  <span className="text-xs font-medium bg-amber-100 text-amber-800 px-2 py-1 rounded-full whitespace-nowrap ml-2">
                    {item.category}
                  </span>
                </div>
                <p className="text-gray-500 text-sm mb-3 line-clamp-2">{item.description}</p>

                <div className="flex items-center justify-between mt-4">
                  <span className="font-semibold text-amber-600 text-lg">${item.price.toFixed(2)}</span>
                  <button className="bg-amber-600 text-white px-4 py-2 rounded-full text-sm hover:bg-amber-700 transition transform active:scale-95">
                    Add to Cart
                  </button>
                </div>
              </div>

            </motion.div>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
             <div className="text-6xl mb-4">🥗</div>
             <h3 className="text-xl font-semibold text-gray-900">No items found</h3>
             <p className="text-gray-500 mt-2">Try adjusting your filters to find what you're looking for.</p>
          </div>
        )}
      </div>
    </div>
  );
}