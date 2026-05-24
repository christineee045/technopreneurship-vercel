import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router";
import { format } from "date-fns";
import { toast } from "sonner";
import { Header } from "../components/Header";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { ArrowLeft, Shield, Star } from "lucide-react";
import {
  fetchUserProfile,
  fetchBorrowerFeedbackByBorrowerId,
  type BorrowerFeedback,
  type User,
} from "../services/api";

export default function UserReviewsAboutPage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [borrowerFeedback, setBorrowerFeedback] = useState<BorrowerFeedback[]>([]);
  const [ownerAvatars, setOwnerAvatars] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadReviews = async () => {
      if (!userId) return;
      try {
        setIsLoading(true);
        const [profileData, publicBorrowerFeedback] = await Promise.all([
          fetchUserProfile(userId),
          fetchBorrowerFeedbackByBorrowerId(userId),
        ]);
        setProfileUser(profileData.user);
        setBorrowerFeedback(publicBorrowerFeedback);
      } catch (error) {
        console.error("Failed to load reviews about user:", error);
        toast.error("Failed to load reviews");
        navigate(`/user/${userId}`);
      } finally {
        setIsLoading(false);
      }
    };

    loadReviews();
  }, [userId, navigate]);

  useEffect(() => {
    const loadAvatars = async () => {
      const missingOwnerIds = Array.from(
        new Set(
          borrowerFeedback
            .filter((feedback) => !feedback.ownerAvatar && !ownerAvatars[feedback.ownerId])
            .map((feedback) => feedback.ownerId)
        )
      );

      if (missingOwnerIds.length === 0) {
        return;
      }

      const resolvedAvatars = await Promise.all(
        missingOwnerIds.map(async (ownerId) => {
          const profile = await fetchUserProfile(ownerId).catch(() => null);
          return profile ? [ownerId, profile.user.avatar || ""] as const : null;
        })
      );

      setOwnerAvatars((current) => {
        const next = { ...current };
        resolvedAvatars.forEach((entry) => {
          if (entry) {
            next[entry[0]] = entry[1];
          }
        });
        return next;
      });
    };

    loadAvatars();
  }, [borrowerFeedback, ownerAvatars]);

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
              <Shield className="h-5 w-5" />
              Lender Reviews for {profileUser.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3 text-sm text-muted-foreground">
            <div className="rounded-lg border p-3">
              Lender reviews: <span className="font-semibold text-foreground">{borrowerFeedback.length}</span>
            </div>
            <div className="rounded-lg border p-3">
              Borrower trust: <span className="font-semibold text-foreground">{profileUser.rating.toFixed(1)}</span>
            </div>
            <div className="rounded-lg border p-3">
              Role: <span className="font-semibold text-foreground">Lender</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>All Lender Reviews</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {borrowerFeedback.length === 0 ? (
              <p className="text-sm text-muted-foreground">No lender reviews yet.</p>
            ) : (
              borrowerFeedback.map((feedback, index) => (
                <div key={feedback.id || `${feedback.itemId}-${index}`} className="relative rounded-lg border p-4 space-y-3 group">
                  <Link
                    to={`/item/${feedback.itemId}`}
                    className="absolute inset-0 z-0 rounded-lg"
                    aria-label={`Open ${feedback.itemTitle}`}
                  />
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={feedback.ownerAvatar || ownerAvatars[feedback.ownerId]} alt={feedback.ownerName} />
                        <AvatarFallback>{feedback.ownerName.split(" ").map((name) => name[0]).join("")}</AvatarFallback>
                      </Avatar>
                      <div>
                        <Link to={`/user/${feedback.ownerId}`} className="relative z-10 font-medium hover:text-primary hover:underline">
                          {feedback.ownerName}
                        </Link>
                        <p className="text-xs text-muted-foreground">{format(new Date(feedback.createdAt), "PPP")}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      {feedback.borrowerRating ?? "N/A"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{feedback.borrowerFeedback || "No written feedback."}</p>
                  <p className="text-xs text-muted-foreground">For "{feedback.itemTitle}"</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button asChild>
            <Link to={`/user/${userId}/reviews/borrower`}>See borrower reviews</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}