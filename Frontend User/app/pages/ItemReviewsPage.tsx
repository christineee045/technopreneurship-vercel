import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useLocation } from "react-router";
import { format } from "date-fns";
import { toast } from "sonner";
import { ArrowLeft, MessageCircle, Send, Star } from "lucide-react";
import { Header } from "../components/Header";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { useAuth } from "../context/AuthContext";
import {
  fetchItemById,
  fetchReviewThreadByItemId,
  replyToReview,
  type Item,
  type Review,
} from "../services/api";

export default function ItemReviewsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [item, setItem] = useState<Item | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [replyingReviewId, setReplyingReviewId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const [itemData, reviewData] = await Promise.all([
          fetchItemById(id),
          fetchReviewThreadByItemId(id),
        ]);
        setItem(itemData);
        setReviews(reviewData);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load reviews");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  useEffect(() => {
    if (!location.hash) return;

    const timer = window.setTimeout(() => {
      const target = document.getElementById(location.hash.slice(1));
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);

    return () => window.clearTimeout(timer);
  }, [location.hash, reviews.length]);

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return item?.ownerRating || 0;
    return Number((reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1));
  }, [item?.ownerRating, reviews]);

  const handleReply = async (review: Review) => {
    const reviewId = review.id || review._id;
    if (!reviewId) return;

    const draft = replyDrafts[reviewId] || "";
    if (!draft.trim()) {
      toast.error("Please write a reply");
      return;
    }

    if (!user) {
      navigate("/login");
      return;
    }

    setReplyingReviewId(reviewId);
    try {
      const updated = await replyToReview(reviewId, draft.trim());
      setReviews(prev => prev.map(current => ((current.id || current._id) === reviewId ? updated : current)));
      setReplyDrafts(prev => ({ ...prev, [reviewId]: "" }));
      toast.success("Reply posted");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to post reply";
      toast.error(message);
    } finally {
      setReplyingReviewId(null);
    }
  };

  const reviewCount = reviews.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center text-muted-foreground">Loading reviews...</div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-semibold mb-4">Item not found</h1>
          <Button asChild>
            <Link to="/">Back to Browse</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        <Button variant="ghost" className="px-0" onClick={() => navigate(`/item/${item.id || item._id || ""}`)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to item
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{item.title} reviews</CardTitle>
            <p className="text-sm text-muted-foreground">A full comment thread for this listing.</p>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MessageCircle className="h-4 w-4" />
                {reviewCount} review{reviewCount === 1 ? "" : "s"}
              </div>
            </div>
            <div className="flex items-center gap-1 text-lg font-semibold justify-start md:justify-end">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              {averageRating.toFixed(1)}
            </div>
          </CardContent>
        </Card>

        {reviews.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">No reviews yet.</CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => {
              const reviewId = review.id || review._id || "";
              const replies = review.replies || [];
              const hasLegacyOwnerReply = Boolean(review.ownerReply) && !replies.some(reply => reply.content === review.ownerReply);
              return (
                <Card id={`review-${reviewId}`} key={reviewId} className="scroll-mt-24">
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <Link to={`/user/${review.reviewerId}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={review.reviewerAvatar} alt={review.reviewerName} />
                          <AvatarFallback>{review.reviewerName.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium hover:text-primary transition-colors">{review.reviewerName}</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(review.createdAt), "PPP")}</p>
                        </div>
                      </Link>
                      <Badge variant="outline" className="gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {review.rating}
                      </Badge>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground mb-2">{review.comment}</p>
                      <p className="text-xs text-muted-foreground">For {review.itemTitle}</p>
                    </div>

                    <div className="space-y-3 border-t pt-4">
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Replies</p>
                        {replies.length === 0 && !hasLegacyOwnerReply ? (
                          <p className="text-sm text-muted-foreground">No replies yet.</p>
                        ) : (
                          <div className="space-y-3">
                            {replies.map((reply, replyIndex) => (
                              <div key={`${reviewId}-reply-${replyIndex}`} className="rounded-lg border bg-muted/30 p-3">
                                <div className="flex items-center gap-3 mb-2">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={reply.authorAvatar} alt={reply.authorName} />
                                    <AvatarFallback>{reply.authorName.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="text-sm font-medium">{reply.authorName}</p>
                                    <p className="text-xs text-muted-foreground">{format(new Date(reply.createdAt), "PPP")}</p>
                                  </div>
                                </div>
                                <p className="text-sm text-muted-foreground">{reply.content}</p>
                              </div>
                            ))}
                            {hasLegacyOwnerReply && (
                              <div className="rounded-lg border bg-muted/30 p-3">
                                <p className="text-sm font-medium mb-1">{item.ownerName}</p>
                                <p className="text-sm text-muted-foreground">{review.ownerReply}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`reply-${reviewId}`}>Reply to this review</Label>
                        <Textarea
                          id={`reply-${reviewId}`}
                          placeholder={review.reviewerId === user?.id ? "You cannot reply to your own review" : "Write a reply..."}
                          value={replyDrafts[reviewId] || ""}
                          onChange={(e) => setReplyDrafts(prev => ({ ...prev, [reviewId]: e.target.value }))}
                          rows={3}
                          disabled={review.reviewerId === user?.id}
                        />
                        <div className="flex justify-end">
                          <Button
                            onClick={() => handleReply(review)}
                            disabled={replyingReviewId === reviewId || review.reviewerId === user?.id}
                          >
                            <Send className="h-4 w-4 mr-2" />
                            {replyingReviewId === reviewId ? "Posting..." : "Post Reply"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
