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
  Phone,
  Mail,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useAuth } from "../context/useAuth";
import {
  fetchUserProfile,
  fetchBorrowerFeedbackByBorrowerId,
  fetchReviewsByOwnerId,
  type User,
  type Item,
  type BorrowerFeedback,
  type Review,
} from "../services/api";

export default function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [lenderReviews, setLenderReviews] = useState<Review[]>([]);
  const [borrowerReviews, setBorrowerReviews] = useState<BorrowerFeedback[]>([]);
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
        const publicLenderReviews = await fetchReviewsByOwnerId(userId);
        setProfileUser(data.user);
        setItems(data.items);
        setLenderReviews(publicLenderReviews);
        setBorrowerReviews(publicBorrowerFeedback);
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

  if (isLoading || !profileUser) {
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

  const isOwnProfile = currentUser?.id === profileUser.id || currentUser?._id === profileUser._id;
  const lenderReviewsAverage = lenderReviews.length === 0
    ? 0
    : Number((lenderReviews.reduce((sum, review) => sum + review.rating, 0) / lenderReviews.length).toFixed(1));
  const borrowerReviewsAverage = borrowerReviews.length === 0
    ? 0
    : Number((borrowerReviews.reduce((sum, feedback) => sum + (feedback.borrowerRating || 0), 0) / borrowerReviews.length).toFixed(1));

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
                    {profileUser.email && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Mail className="h-4 w-4" />
                        <a href={`mailto:${profileUser.email}`} className="hover:text-primary transition-colors">
                          {profileUser.email}
                        </a>
                      </div>
                    )}
                    {profileUser.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <Phone className="h-4 w-4" />
                        <a href={`tel:${profileUser.phone}`} className="hover:text-primary transition-colors">
                          {profileUser.phone}
                        </a>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="gap-1" title="Reviews received as a borrower">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {lenderReviewsAverage.toFixed(1)} borrower rating
                      </Badge>
                      <Badge variant="outline">{lenderReviews.length} borrower reviews</Badge>
                      <Badge variant="outline">{borrowerReviews.length} lender reviews</Badge>
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
                  Borrower Reviews ({lenderReviews.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {lenderReviews.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No borrower reviews yet.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {lenderReviews.map((review, index) => (
                      <div
                        key={review.id || review._id || `${review.itemId}-${index}`}
                        className="relative border-b pb-4 last:border-0 group"
                      >
                        <Link
                          to={`/item/${review.itemId}`}
                          className="absolute inset-0 z-0 rounded-md"
                          aria-label={`Open ${review.itemTitle}`}
                        />
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div>
                            <Link
                              to={`/user/${review.reviewerId}`}
                              className="relative z-10 font-semibold text-sm hover:text-primary hover:underline"
                            >
                              {review.reviewerName}
                            </Link>
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
                        <p className="text-xs text-muted-foreground mt-2">for "{review.itemTitle}"</p>
                      </div>
                    ))}
                  </div>
                )}
                <div className="pt-3 flex justify-end">
                  <Button variant="outline" asChild>
                    <Link to={`/user/${userId}/reviews/borrower`}>See all reviews</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Lender Reviews ({borrowerReviews.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {borrowerReviews.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No lender reviews yet.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {borrowerReviews.map((feedback, index) => (
                      <div
                        key={feedback.id || `${feedback.itemId}-${index}`}
                        className="relative border-b pb-4 last:border-0 group"
                      >
                        <Link
                          to={`/item/${feedback.itemId}`}
                          className="absolute inset-0 z-0 rounded-md"
                          aria-label={`Open ${feedback.itemTitle}`}
                        />
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div>
                            <Link
                              to={`/user/${feedback.ownerId}`}
                              className="relative z-10 font-semibold text-sm hover:text-primary hover:underline"
                            >
                              {feedback.ownerName}
                            </Link>
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
                        <p className="text-xs text-muted-foreground mt-2">for "{feedback.itemTitle}"</p>
                      </div>
                    ))}
                  </div>
                )}
                <div className="pt-3 flex justify-end">
                  <Button variant="outline" asChild>
                    <Link to={`/user/${userId}/reviews/lender`}>See all reviews</Link>
                  </Button>
                </div>
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
                  <span className="text-sm">Borrower Reviews</span>
                  <span className="text-sm font-semibold">
                    {lenderReviews.length > 0 ? `${lenderReviewsAverage.toFixed(1)}/5` : "N/A"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Lender Reviews</span>
                  <span className="text-sm font-semibold">
                    {borrowerReviews.length > 0 ? `${borrowerReviewsAverage.toFixed(1)}/5` : "N/A"}
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