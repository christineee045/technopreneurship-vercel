import { useState, useRef } from "react";
import { useNavigate } from "react-router";
import { Header } from "../components/Header";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Switch } from "../components/ui/switch";
import { ArrowLeft, Upload, ImagePlus, Sparkles, Loader2, X, CreditCard, Smartphone } from "lucide-react";
import { Link } from "react-router";
import { categories } from "../data/categories";
import { createItem, type Item } from "../services/api";
import { toast } from "sonner";
import { useNotifications } from "../context/useNotifications";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";

export default function AddListing() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingIsFeatured, setPendingIsFeatured] = useState(false);
  const { fetchNotifications } = useNotifications();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    condition: "",
    rentalFeePerDay: "",
    deposit: "",
    location: "",
    available: true,
    isFeatured: false,
    images: [] as string[],
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (formData.images.length >= 5) {
      toast.error("Maximum 5 images allowed");
      return;
    }

    const fileArray = Array.from(files);
    const remainingSlots = 5 - formData.images.length;
    const filesToProcess = fileArray.slice(0, remainingSlots);

    for (const file of filesToProcess) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 10MB limit`);
        continue;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, base64]
        }));
      };
      reader.readAsDataURL(file);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.category || 
        !formData.condition || !formData.rentalFeePerDay || !formData.deposit || !formData.location) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (formData.images.length === 0) {
      toast.error("Please upload at least one image");
      return;
    }

    setIsSubmitting(true);
    try {
      const itemData = {
        ...formData,
        rentalFeePerDay: parseInt(formData.rentalFeePerDay),
        deposit: parseInt(formData.deposit),
        ownerName: "", // Will be populated by backend from user context
        ownerAvatar: "", // Will be populated by backend from user context
        ownerRating: 0, // Will be populated by backend
      };

      await createItem(itemData as Partial<Item>);
      await fetchNotifications();

      toast.success("Listing created successfully!", {
        description: "Your listing has been submitted for review and will go public after approval.",
      });
      
      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create listing';
      toast.error(message);
      console.error('Failed to create item:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to Browse
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">List Your Item</h1>
          <p className="text-muted-foreground">
            Share your tools and equipment with your neighbors and earn extra income.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Provide the essential details about your item</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Item Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., DeWalt Cordless Drill"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your item, its features, and any important details..."
                  rows={5}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="condition">Condition *</Label>
                  <Select value={formData.condition} onValueChange={(value) => setFormData({...formData, condition: value})}>
                    <SelectTrigger id="condition">
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="New">New</SelectItem>
                      <SelectItem value="Excellent">Excellent</SelectItem>
                      <SelectItem value="Good">Good</SelectItem>
                      <SelectItem value="Fair">Fair</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing & Location */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing & Location</CardTitle>
              <CardDescription>Set your daily rental fee, deposit amount, and location</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="rentalFeePerDay">Rental Fee Per Day (₱) *</Label>
                <Input
                  id="rentalFeePerDay"
                  type="number"
                  placeholder="e.g., 50"
                  value={formData.rentalFeePerDay}
                  onChange={(e) => setFormData({...formData, rentalFeePerDay: e.target.value})}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  This is the charge a customer pays for each day they borrow the item.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deposit">Deposit Amount (₱) *</Label>
                <Input
                  id="deposit"
                  type="number"
                  placeholder="e.g., 500"
                  value={formData.deposit}
                  onChange={(e) => setFormData({...formData, deposit: e.target.value})}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Refundable deposit to protect your item. Payment handled offline or via GCash.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Select value={formData.location} onValueChange={(value) => setFormData({...formData, location: value})}>
                  <SelectTrigger id="location">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
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
              </div>
            </CardContent>
          </Card>

          {/* Photos */}
          <Card>
            <CardHeader>
              <CardTitle>Photos</CardTitle>
              <CardDescription>Upload clear photos of your item</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div 
                className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImagePlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm font-medium mb-1">Click to upload photos</p>
                <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB (Max 5 photos)</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/png,image/jpeg"
                onChange={handleImageUpload}
                className="hidden"
                title="Upload item photos"
              />

              {formData.images.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Uploaded Photos ({formData.images.length}/5)</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {formData.images.map((image, index) => (
                      <div key={index} className="relative">
                        <img 
                          src={image} 
                          alt={`Preview ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 hover:bg-destructive/90"
                          aria-label={`Remove photo ${index + 1}`}
                          title={`Remove photo ${index + 1}`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Availability & Features */}
          <Card>
            <CardHeader>
              <CardTitle>Availability & Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="available">Available for Borrowing</Label>
                  <p className="text-xs text-muted-foreground">
                    Toggle off if item is temporarily unavailable
                  </p>
                </div>
                <Switch
                  id="available"
                  checked={formData.available}
                  onCheckedChange={(checked) => setFormData({...formData, available: checked})}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5 flex-1">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="featured">Featured Listing</Label>
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Promote your item for ₱50/week (optional)
                  </p>
                </div>
                <Switch
                  id="featured"
                  checked={formData.isFeatured}
                  onCheckedChange={async (checked) => {
                    if (checked) {
                      setPendingIsFeatured(true);
                      setShowPaymentModal(true);
                    } else {
                      setFormData({ ...formData, isFeatured: false });
                    }
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <div className="flex gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate("/")} 
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Publish Listing
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <DialogTitle>Feature Your Listing</DialogTitle>
            </div>
            <DialogDescription>
              Boost your listing's visibility for ₱50/week. Featured items appear at the top of browse results.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm font-medium">Choose a payment method</p>
            <Button
              variant="outline"
              className="w-full h-auto py-4 flex flex-col items-start gap-2 relative"
              onClick={() => {
                setShowPaymentModal(false);
                setFormData(prev => ({ ...prev, isFeatured: true }));
                toast.success("Payment demo", { description: "GCash payment confirmation coming soon!" });
              }}
            >
              <Smartphone className="h-5 w-5 text-blue-600" />
              <span className="font-semibold">GCash</span>
              <span className="text-xs text-muted-foreground">Pay via GCash wallet (demo)</span>
            </Button>
            <Button
              variant="outline"
              className="w-full h-auto py-4 flex flex-col items-start gap-2 relative"
              onClick={() => {
                setShowPaymentModal(false);
                setFormData(prev => ({ ...prev, isFeatured: true }));
                toast.success("Payment demo", { description: "Card payment confirmation coming soon!" });
              }}
            >
              <CreditCard className="h-5 w-5 text-primary" />
              <span className="font-semibold">Credit / Debit Card</span>
              <span className="text-xs text-muted-foreground">Pay securely with your card (demo)</span>
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => {
                setShowPaymentModal(false);
                setPendingIsFeatured(false);
                setFormData(prev => ({ ...prev, isFeatured: false }));
              }}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
