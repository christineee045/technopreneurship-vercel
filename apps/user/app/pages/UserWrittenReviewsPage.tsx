import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router";
import { format } from "date-fns";
import { toast } from "sonner";
import { Header } from "../components/Header";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { ArrowLeft, Star } from "lucide-react";
import { fetchReviewsByReviewerId, fetchUserProfile, type Review, type User } from "../services/api";

export default function UserWrittenReviewsPage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadReviews = async () => {
      if (!userId) return;
      try {
        setIsLoading(true);
        const [profileData, writtenReviews] = await Promise.all([
          fetchUserProfile(userId),
          fetchReviewsByReviewerId(userId),
        ]);
        setProfileUser(profileData.user);
        setReviews(writtenReviews);
      } catch (error) {
        console.error("Failed to load written reviews:", error);
        toast.error("Failed to load reviews");
        navigate(`/user/${userId}`);
      } finally {
        setIsLoading(false);
      }
    };

    loadReviews();
  }, [userId, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center text-muted-foreground">Loading reviews...</div>
      </div>
    );
  }

  if (!profileUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
        <Link to={`/user/${userId}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to profile
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Reviews Written by {profileUser.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm text-muted-foreground">
            <div className="rounded-lg border p-3">
              Total reviews: <span className="font-semibold text-foreground">{reviews.length}</span>
            </div>
            <div className="rounded-lg border p-3">
              Profile rating: <span className="font-semibold text-foreground">{profileUser.rating.toFixed(1)}</span>
            </div>
            <div className="rounded-lg border p-3">
              Lender trust: <span className="font-semibold text-foreground">{profileUser.reviewCount} reviews</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>All Written Reviews</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {reviews.length === 0 ? (
              <p className="text-sm text-muted-foreground">No reviews written yet.</p>
            ) : (
              reviews.map((review) => (
                <div key={review.id || review._id} className="relative rounded-lg border p-4 space-y-3 group">
                  <Link
                    to={`/item/${review.itemId}`}
                    className="absolute inset-0 z-0 rounded-lg"
                    aria-label={`Open ${review.itemTitle}`}
                  />
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={review.reviewerAvatar || profileUser.avatar} alt={review.reviewerName} />
                        <AvatarFallback>{review.reviewerName.split(" ").map((name) => name[0]).join("")}</AvatarFallback>
                      </Avatar>
                      <div>
                        <Link to={`/user/${review.reviewerId}`} className="relative z-10 font-medium hover:text-primary hover:underline">
                          {review.reviewerName}
                        </Link>
                        <p className="text-xs text-muted-foreground">{format(new Date(review.createdAt), "PPP")}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      {review.rating}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{review.comment}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>For "{review.itemTitle}"</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}