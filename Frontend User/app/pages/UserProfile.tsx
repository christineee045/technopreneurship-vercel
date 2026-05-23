import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { Header } from "../components/Header";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import {
  Star,
  MapPin,
  Package,
  Calendar,
  ArrowLeft,
  Shield,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import {
  fetchUserProfile,
  fetchBorrowerFeedbackByBorrowerId,
  type User,
  type Item,
  type Review,
  type BorrowerFeedback,
} from "../services/api";

export default function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [lenderReviews, setLenderReviews] = useState<Review[]>([]);
  const [borrowerFeedback, setBorrowerFeedback] = useState<BorrowerFeedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      if (!userId) return;
      try {
        setIsLoading(true);
        const [data, publicBorrowerFeedback] = await Promise.all([
          fetchUserProfile(userId),
          fetchBorrowerFeedbackByBorrowerId(userId),
        ]);
        setProfileUser(data.user);
        setItems(data.items);
        setLenderReviews(data.reviews);
        setBorrowerFeedback(publicBorrowerFeedback);
      } catch (error) {
        console.error("Failed to load profile:", error);
        toast.error("Failed to load profile");
        navigate("/");
      } finally {
        setIsLoading(false);
      }
    };
    loadProfile();
  }, [userId, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="text-muted-foreground">Loading profile...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-semibold mb-4">User not found</h1>
          <Link to="/">
            <Button>Back to Browse</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === profileUser.id || currentUser?._id === profileUser._id;
  const borrowerFeedbackAverage = borrowerFeedback.length === 0
    ? 0
    : Number((borrowerFeedback.reduce((sum, feedback) => sum + (feedback.borrowerRating || 0), 0) / borrowerFeedback.length).toFixed(1));

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Browse
        </Link>

        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profileUser.avatar} alt={profileUser.name} />
                <AvatarFallback className="text-3xl">
                  {profileUser.name.split(" ").map(n => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">{profileUser.name}</h1>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>Joined {format(new Date(profileUser.joinDate), "MMMM yyyy")}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>Philippines</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="gap-1" title="Lender rating from item reviews">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {profileUser.rating.toFixed(1)} lender rating
                      </Badge>
                      <Badge variant="outline">{profileUser.reviewCount} lender reviews</Badge>
                      <Badge variant="outline">{borrowerFeedback.length} borrower feedback</Badge>
                    </div>
                  </div>
                  {isOwnProfile && (
                    <Button variant="outline" asChild>
                      <Link to="/account">Edit Profile</Link>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Listings */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Listings ({items.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {items.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No items listed yet.
                  </p>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {items.map((item) => (
                      <Card
                        key={item.id || item._id}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => navigate(`/item/${item.id || item._id}`)}
                      >
                        <CardContent className="p-4">
                          <div className="aspect-square rounded-lg overflow-hidden bg-muted mb-3">
                            <img
                              src={item.images[0]}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <h3 className="font-semibold line-clamp-1 mb-1">{item.title}</h3>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-primary font-semibold">
                              ₱{item.rentalFeePerDay}/day
                            </span>
                            <Badge variant={item.available ? "secondary" : "destructive"} className="text-xs">
                              {item.available ? "Available" : "Unavailable"}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Reviews */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Lender Reviews ({lenderReviews.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {lenderReviews.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No reviews yet.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {lenderReviews.map((review) => (
                      <div key={review.id || review._id} className="border-b pb-4 last:border-0">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div>
                            <p className="font-semibold text-sm">{review.reviewerName}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(review.createdAt), "PPP")}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 text-sm font-medium">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            {review.rating}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {review.comment}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          for "{review.itemTitle}"
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Borrower Feedback ({borrowerFeedback.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {borrowerFeedback.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No borrower feedback yet.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {borrowerFeedback.map((feedback, index) => (
                      <div key={feedback.id || `${feedback.itemId}-${index}`} className="border-b pb-4 last:border-0">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div>
                            <p className="font-semibold text-sm">{feedback.ownerName}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(feedback.createdAt), "PPP")}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 text-sm font-medium">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            {feedback.borrowerRating ?? "N/A"}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {feedback.borrowerFeedback || "No written feedback."}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          for "{feedback.itemTitle}" · {feedback.status}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Trust Indicators */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Trust Indicators
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Borrower Trust</span>
                  <span className="text-sm font-semibold">
                    {borrowerFeedback.length > 0 ? `${borrowerFeedbackAverage.toFixed(1)}/5` : "N/A"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Lender Trust</span>
                  <span className="text-sm font-semibold">
                    {profileUser.rating >= 4.5 ? "Excellent" : profileUser.rating >= 3.5 ? "Good" : "Needs Improvement"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Member Since</span>
                  <span className="text-sm font-semibold">
                    {format(new Date(profileUser.joinDate), "MMM yyyy")}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Verified Email</span>
                  <Badge variant="secondary" className="text-xs">Yes</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
