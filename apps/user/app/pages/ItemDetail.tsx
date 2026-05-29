import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { Header } from "../components/Header";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Calendar } from "../components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import { 
  MapPin, 
  Star, 
  Calendar as CalendarIcon, 
  Shield, 
  AlertCircle, 
  ArrowLeft,
  Send,
  CheckCircle,
  Phone,
  Mail
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useAuth } from "../context/useAuth";
import { useNotifications } from "../context/useNotifications";
import {
  createBorrowRequest,
  createReview,
  fetchItemById,
  fetchReviewsByItemId,
  type Item,
  type Review,
} from "../services/api";

export default function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [item, setItem] = useState<Item | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isRequesting, setIsRequesting] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewRatingHover, setReviewRatingHover] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [message, setMessage] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const availabilityStartDate = useMemo(() => {
    if (item?.available) {
      return new Date();
    }

    const estimated = item?.estimatedAvailableAt ? new Date(item.estimatedAvailableAt) : new Date();
    return new Date(Math.max(Date.now(), estimated.getTime()));
  }, [item?.available, item?.estimatedAvailableAt]);

  useEffect(() => {
    const loadItem = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        const data = await fetchItemById(id);
        setItem(data);
        const itemReviews = await fetchReviewsByItemId(id);
        setReviews(itemReviews);
      } catch (error) {
        console.error("Failed to fetch item:", error);
        toast.error("Failed to load item");
      } finally {
        setIsLoading(false);
      }
    };
    loadItem();
  }, [id]);

  const handleBorrowClick = () => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (!item) return;
    if (user.id === item.ownerId || user._id === item.ownerId) {
      toast.error("You cannot borrow your own item");
      return;
    }
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="text-muted-foreground">Loading item...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-semibold mb-4">Item not found</h1>
          <p className="text-muted-foreground mb-4">This item may have been removed or does not exist.</p>
          <Link to="/">
            <Button>Back to Browse</Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmitRequest = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (user.id === item.ownerId || user._id === item.ownerId) {
      toast.error("You cannot borrow your own item");
      return;
    }

    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates");
      return;
    }

    setIsRequesting(true);
    try {
      await createBorrowRequest({
        itemId: item.id || item._id || "",
        itemTitle: item.title,
        itemImage: item.images[0],
        borrowerId: user.id || user._id || "",
        borrowerName: user.name,
        borrowerAvatar: user.avatar,
        ownerId: item.ownerId,
        ownerName: item.ownerName,
        ownerAvatar: item.ownerAvatar,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        status: "Pending",
        message,
      });

      toast.success("Borrow request sent successfully!", {
        description: `${item.ownerName} will review your request soon.`,
      });
      addNotification({
        title: "Borrow request sent",
        message: `Your request for ${item.title} is pending approval.`,
        read: false,
      });

      setIsDialogOpen(false);
      setStartDate(undefined);
      setEndDate(undefined);
      setMessage("");
    } catch (error) {
      const messageText = error instanceof Error ? error.message : "Failed to send borrow request";
      toast.error(messageText);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (!item) {
      return;
    }

    if (!reviewComment.trim()) {
      toast.error("Please write a review comment");
      return;
    }

    setIsSubmittingReview(true);
    try {
      const result = await createReview({
        itemId: item.id || item._id || "",
        rating: reviewRating,
        comment: reviewComment,
      });

      setReviews(prev => [result.review, ...prev]);
      setItem(prev => (prev ? { ...prev, ownerRating: result.ownerRating } : prev));
      setReviewComment("");
      setReviewRating(5);
      setReviewRatingHover(0);
      toast.success("Review submitted successfully");
      addNotification({
        title: "Review submitted",
        message: `You reviewed ${item.ownerName}.`,
        read: false,
      });
      navigate(`/item/${item.id || item._id || ""}/reviews#review-${result.review.id}`);
    } catch (error) {
      const messageText = error instanceof Error ? error.message : "Failed to submit review";
      toast.error(messageText);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const conditionColors = {
    'New': 'bg-green-100 text-green-800 border-green-200',
    'Excellent': 'bg-blue-100 text-blue-800 border-blue-200',
    'Good': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Fair': 'bg-orange-100 text-orange-800 border-orange-200',
  };

  const reviewPreview = reviews.slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to Browse
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Section */}
          <div>
            <div className="aspect-square rounded-lg overflow-hidden bg-muted mb-4">
              <img 
                src={item.images[0]} 
                alt={item.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Details Section */}
          <div className="space-y-6">
            <div>
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <h1 className="text-3xl font-bold mb-2">{item.title}</h1>
                  <Badge variant="outline" className={conditionColors[item.condition]}>
                    {item.condition} Condition
                  </Badge>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Rental Fee</div>
                  <div className="text-2xl font-bold text-primary">₱{item.rentalFeePerDay}/day</div>
                  <div className="text-xs text-muted-foreground mt-1">Deposit: ₱{item.deposit}</div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <MapPin className="h-4 w-4" />
                <span>{item.location}</span>
              </div>

              <Badge variant={item.available ? "secondary" : "destructive"} className="mb-4">
                {item.available ? "Available" : "Currently Unavailable"}
              </Badge>
              {!item.available && (
                <div className="mb-4 rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">Reserve for a future date</p>
                  <p>
                    {item.estimatedAvailableAt
                      ? `Estimated available from ${format(new Date(item.estimatedAvailableAt), "PPP")}${item.availabilityBufferDays ? ` with a ${item.availabilityBufferDays}-day buffer` : ""}.`
                      : "This item is currently reserved. You can still place a future reservation."}
                  </p>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground leading-relaxed">{item.description}</p>
            </div>

            {/* Category */}
            <div>
              <h3 className="font-semibold mb-2">Category</h3>
              <Badge variant="outline">{item.category}</Badge>
            </div>

             {/* Owner Info */}
               <Card>
                 <CardHeader>
                   <CardTitle className="text-base">Owner Information</CardTitle>
                 </CardHeader>
                 <CardContent>
                   <div className="flex items-center gap-4">
                     <Link
                       to={`/user/${item.ownerId}`}
                       className="flex items-center gap-4 hover:bg-muted/50 rounded-lg p-2 -mx-2 flex-1 transition-colors"
                     >
                       <Avatar className="h-12 w-12">
                         <AvatarImage src={item.ownerAvatar} alt={item.ownerName} />
                         <AvatarFallback>{item.ownerName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                       </Avatar>
                       <div className="flex-1">
                         <div className="font-semibold hover:text-primary transition-colors">{item.ownerName}</div>
                         <div className="flex items-center gap-1 text-sm text-muted-foreground">
                           <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                           <span>{item.ownerRating.toFixed(1)} rating</span>
                         </div>
                       </div>
                     </Link>
                     <div className="flex gap-2">
                       {item.ownerPhone && (
                         <a
                           href={`tel:${item.ownerPhone}`}
                           className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground h-10 w-10 hover:bg-primary/90 transition-colors"
                           aria-label={`Call ${item.ownerName}`}
                         >
                           <Phone className="h-4 w-4" />
                         </a>
                       )}
                       {item.ownerEmail && (
                         <a
                           href={`mailto:${item.ownerEmail}`}
                           className="inline-flex items-center justify-center rounded-md border bg-background h-10 w-10 hover:bg-accent transition-colors"
                           aria-label={`Email ${item.ownerName}`}
                         >
                           <Mail className="h-4 w-4" />
                         </a>
                       )}
                     </div>
                   </div>
                 </CardContent>
               </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">Reviews</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">{reviews.length} review{reviews.length === 1 ? "" : "s"}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/item/${item.id || item._id || ""}/reviews`)}
                  >
                    See all reviews
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">Owner rating</p>
                    <p className="text-sm text-muted-foreground">Based on community feedback</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 justify-end">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold">{item.ownerRating.toFixed(1)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{reviews.length} review{reviews.length === 1 ? "" : "s"}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="review-comment">Leave a review</Label>
                  <div className="grid gap-3 sm:grid-cols-[180px_1fr]">
                    <div className="space-y-2">
                      <div className="flex items-center gap-1" onMouseLeave={() => setReviewRatingHover(0)}>
                        {[1, 2, 3, 4, 5].map((rating) => {
                          const active = (reviewRatingHover || reviewRating) >= rating;
                          return (
                            <button
                              key={rating}
                              type="button"
                              className="rounded-sm p-1 transition-transform hover:scale-110"
                              onMouseEnter={() => setReviewRatingHover(rating)}
                              onFocus={() => setReviewRatingHover(rating)}
                              onClick={() => setReviewRating(rating)}
                              aria-label={`${rating} star${rating > 1 ? "s" : ""}`}
                            >
                              <Star className={`h-6 w-6 ${active ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-xs text-muted-foreground">{reviewRating}/5 stars</p>
                    </div>
                    <Textarea
                      id="review-comment"
                      placeholder="Share your experience with this owner..."
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <Button onClick={handleSubmitReview} disabled={isSubmittingReview || !user || user.id === item.ownerId}>
                    {isSubmittingReview ? "Submitting..." : "Submit Review"}
                  </Button>
                  {user?.id === item.ownerId && (
                    <p className="text-xs text-muted-foreground">You cannot review your own item.</p>
                  )}
                </div>

                <div className="space-y-3 border-t pt-4">
                  {reviews.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No reviews yet.</p>
                  ) : (
                    reviewPreview.map((review) => (
                      <div key={review.id || review._id} className="rounded-lg border p-3 space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <Link to={`/user/${review.reviewerId}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={review.reviewerAvatar} alt={review.reviewerName} />
                              <AvatarFallback>{review.reviewerName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium hover:text-primary transition-colors">{review.reviewerName}</p>
                              <p className="text-xs text-muted-foreground">{format(new Date(review.createdAt), "PPP")}</p>
                            </div>
                          </Link>
                          <div className="flex items-center gap-1 text-sm font-medium">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            {review.rating}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>
                      </div>
                    ))
                  )}
                  {reviews.length > reviewPreview.length && (
                    <Button variant="ghost" className="px-0" onClick={() => navigate(`/item/${item.id || item._id || ""}/reviews`)}>
                      View all {reviews.length} reviews
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Pricing Info */}
            <Card className="bg-accent/50 border-accent">
              <CardContent className="pt-6">
                <div className="flex gap-3">
                  <Shield className="h-5 w-5 text-accent-foreground flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold mb-1 text-accent-foreground">Pricing & Deposit</h4>
                    <p className="text-sm text-accent-foreground/80">
                      Rental fee is ₱{item.rentalFeePerDay} per day. A deposit of ₱{item.deposit} is required. Payment is handled offline or via GCash. 
                      The deposit will be returned upon safe return of the item.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Borrow Request Button / Manage Button */}
            {user?.id === item.ownerId || user?._id === item.ownerId ? (
              <Button asChild size="lg" className="w-full" variant="outline">
                <Link to="/dashboard">Manage Item</Link>
              </Button>
            ) : (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <Button
                  size="lg"
                  className="w-full"
                  disabled={isRequesting}
                  onClick={handleBorrowClick}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {isRequesting ? "Sending Request..." : item.available ? "Request to Borrow" : "Reserve Item"}
                </Button>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Request to Borrow</DialogTitle>
                    <DialogDescription>
                      Fill out the details below to send a borrow request to {item.ownerName}.
                    </DialogDescription>
                  </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? format(startDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={setStartDate}
                          disabled={(date) => date < availabilityStartDate}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? format(endDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                          disabled={(date) => !startDate || date < startDate}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message (Optional)</Label>
                    <Textarea
                      id="message"
                      placeholder="Let the owner know why you need this item..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={4}
                    />
                  </div>

                  {(item.ownerPhone || item.ownerEmail) && (
                    <div className="bg-muted p-4 rounded-lg space-y-2">
                      <p className="text-sm font-medium text-foreground">Contact the owner</p>
                      {item.ownerPhone && (
                        <a
                          href={`tel:${item.ownerPhone}`}
                          className="flex items-center gap-2 text-sm text-primary hover:underline"
                        >
                          <Phone className="h-4 w-4" />
                          {item.ownerPhone}
                        </a>
                      )}
                      {item.ownerEmail && (
                        <a
                          href={`mailto:${item.ownerEmail}`}
                          className="flex items-center gap-2 text-sm text-primary hover:underline"
                        >
                          <Mail className="h-4 w-4" />
                          {item.ownerEmail}
                        </a>
                      )}
                    </div>
                  )}

                  <div className="bg-muted p-4 rounded-lg">
                    <div className="flex gap-2 text-sm">
                      <AlertCircle className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <p className="text-muted-foreground">
                        The owner will review your request and respond within 24 hours. 
                        Deposit payment will be arranged after approval.
                      </p>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSubmitRequest}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Send Request
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
