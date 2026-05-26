import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Header } from "../components/Header";
import { ItemCard } from "../components/ItemCard";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { Search, Filter, Sparkles, TrendingUp, Users, Shield } from "lucide-react";
import { categories } from "../data/categories";
import { fetchItems, type Item } from "../services/api";
import { useAuth } from "../context/useAuth";
import { toast } from "sonner";

export default function Home() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    const loadItems = async () => {
      try {
        setIsLoading(true);
        const data = await fetchItems();
        setItems(data);
      } catch (error) {
        console.error("Failed to fetch items:", error);
        toast.error("Failed to load items");
      } finally {
        setIsLoading(false);
      }
    };
    loadItems();
  }, []);

  const handleGuestListItemClick = () => {
    toast.info("Please log in to list your item.");
    navigate("/login");
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    const matchesLocation = selectedLocation === "all" || item.location === selectedLocation;
    const min = minPrice ? Number(minPrice) : undefined;
    const max = maxPrice ? Number(maxPrice) : undefined;
    const matchesMinPrice = min === undefined || item.rentalFeePerDay >= min;
    const matchesMaxPrice = max === undefined || item.rentalFeePerDay <= max;
    return matchesSearch && matchesCategory && matchesLocation && matchesMinPrice && matchesMaxPrice;
  });

  const isSearching =
    searchQuery.trim() !== "" ||
    selectedCategory !== "all" ||
    selectedLocation !== "all" ||
    minPrice.trim() !== "" ||
    maxPrice.trim() !== "";

  const featuredItems = items.filter(item => item.isFeatured);

  const getItemKey = (item: Item, index: number) => item.id || item._id || `${item.title}-${item.ownerId}-${index}`;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="inline-flex items-center gap-3 rounded-full border bg-card px-5 py-3 shadow-sm">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="text-sm text-muted-foreground">Loading items...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-secondary/5 to-background border-b">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Borrow What You Need,<br />
              Share What You Have
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8">
              Your neighborhood lending platform for tools, equipment, and party supplies.
              Like Airbnb — but for drills, ladders, and party tents.
            </p>
            
            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search for tools, equipment, or items..."
                  className="pl-10 h-12 bg-muted/40 border-border/90 shadow-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-[180px] h-12 bg-muted/40 border-border/90 shadow-sm">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto">
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger className="h-12 w-full bg-muted/40 border-border/90 shadow-sm">
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  <SelectItem value="Manila">Manila</SelectItem>
                  <SelectItem value="Quezon City">Quezon City</SelectItem>
                  <SelectItem value="Angeles">Angeles</SelectItem>
                  <SelectItem value="Bacolod">Bacolod</SelectItem>
                  <SelectItem value="Baguio">Baguio</SelectItem>
                  <SelectItem value="Butuan">Butuan</SelectItem>
                  <SelectItem value="Cagayan de Oro">Cagayan de Oro</SelectItem>
                  <SelectItem value="Caloocan">Caloocan</SelectItem>
                  <SelectItem value="Cebu City">Cebu City</SelectItem>
                  <SelectItem value="Davao City">Davao City</SelectItem>
                  <SelectItem value="General Santos">General Santos</SelectItem>
                  <SelectItem value="Iligan">Iligan</SelectItem>
                  <SelectItem value="Iloilo City">Iloilo City</SelectItem>
                  <SelectItem value="Lapu-Lapu">Lapu-Lapu</SelectItem>
                  <SelectItem value="Las Piñas">Las Piñas</SelectItem>
                  <SelectItem value="Lucena">Lucena</SelectItem>
                  <SelectItem value="Makati">Makati</SelectItem>
                  <SelectItem value="Malabon">Malabon</SelectItem>
                  <SelectItem value="Mandaluyong">Mandaluyong</SelectItem>
                  <SelectItem value="Mandaue">Mandaue</SelectItem>
                  <SelectItem value="Marikina">Marikina</SelectItem>
                  <SelectItem value="Muntinlupa">Muntinlupa</SelectItem>
                  <SelectItem value="Navotas">Navotas</SelectItem>
                  <SelectItem value="Olongapo">Olongapo</SelectItem>
                  <SelectItem value="Parañaque">Parañaque</SelectItem>
                  <SelectItem value="Pasay">Pasay</SelectItem>
                  <SelectItem value="Pasig">Pasig</SelectItem>
                  <SelectItem value="Puerto Princesa">Puerto Princesa</SelectItem>
                  <SelectItem value="San Juan">San Juan</SelectItem>
                  <SelectItem value="Tacloban">Tacloban</SelectItem>
                  <SelectItem value="Taguig">Taguig</SelectItem>
                  <SelectItem value="Valenzuela">Valenzuela</SelectItem>
                  <SelectItem value="Zamboanga City">Zamboanga City</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="number"
                min="0"
                placeholder="Min price"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="h-12 bg-muted/40 border-border/90 shadow-sm"
              />
              <Input
                type="number"
                min="0"
                placeholder="Max price"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="h-12 bg-muted/40 border-border/90 shadow-sm"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 text-primary mb-4">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div className="text-3xl font-bold mb-1">500+</div>
              <p className="text-muted-foreground">Items Available</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-secondary/10 text-secondary mb-4">
                <Users className="h-6 w-6" />
              </div>
              <div className="text-3xl font-bold mb-1">1,200+</div>
              <p className="text-muted-foreground">Community Members</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-accent/50 text-accent-foreground mb-4">
                <Shield className="h-6 w-6" />
              </div>
              <div className="text-3xl font-bold mb-1">98%</div>
              <p className="text-muted-foreground">Successful Returns</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Items */}
      {featuredItems.length > 0 && !isSearching && (
        <section id="featured-items" className="py-12 bg-background">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-semibold">Featured Items</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {featuredItems.map((item, index) => (
                <ItemCard key={getItemKey(item, index)} item={item} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Items */}
      <section id="all-items" className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 id="categories" className="text-2xl font-semibold">
              {selectedCategory !== "all" ? selectedCategory : "All Items"}
            </h2>
            <Badge variant="secondary">
              {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
            </Badge>
          </div>
          
          {filteredItems.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-muted mb-4">
                <Filter className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No items found</h3>
              <p className="text-muted-foreground mb-6">
                Try adjusting your search or filters
              </p>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                      setSelectedLocation("all");
                  setMinPrice("");
                  setMaxPrice("");
                }}
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredItems.map((item, index) => (
                <ItemCard key={getItemKey(item, index)} item={item} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      {!user && (
        <section className="py-16 bg-gradient-to-r from-primary to-secondary">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Have Something to Share?
            </h2>
            <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
              List your tools and equipment to help your neighbors and earn some extra cash.
            </p>
            <Button size="lg" variant="secondary" onClick={handleGuestListItemClick}>
              List Your Item for Free
            </Button>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white" />
                    <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span className="font-semibold">Lendly</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Building stronger communities through sharing.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Browse</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/#all-items" className="hover:text-primary transition-colors">All Items</a></li>
                <li><a href="/#featured-items" className="hover:text-primary transition-colors">Featured</a></li>
                <li><a href="/#categories" className="hover:text-primary transition-colors">Categories</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Community</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/community" className="hover:text-primary transition-colors">Community</a></li>
                <li><a href="/how-it-works" className="hover:text-primary transition-colors">How It Works</a></li>
                <li><a href="/safety-guidelines" className="hover:text-primary transition-colors">Safety Guidelines</a></li>
                <li><a href="/faq" className="hover:text-primary transition-colors">FAQs</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/support" className="hover:text-primary transition-colors">Support</a></li>
                <li><a href="/contact-us" className="hover:text-primary transition-colors">Contact Us</a></li>
                <li><a href="/terms-of-service" className="hover:text-primary transition-colors">Terms of Service</a></li>
                <li><a href="/privacy-policy" className="hover:text-primary transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8 text-center text-sm text-muted-foreground">
            <p>© 2026 Lendly. All rights reserved. Building communities, one borrow at a time.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
