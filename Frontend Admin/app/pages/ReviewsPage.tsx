import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { MessageSquare, Search, Star, EyeOff, Eye, MoreVertical, Trash2 } from "lucide-react";
import { AdminHeader } from "../components/AdminHeader";
import { AdminSidebar } from "../components/AdminSidebar";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Input } from "../components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import {
  fetchAdminReviews,
  deleteAdminReview,
  updateAdminReviewVisibility,
  type AdminItemReview,
} from "../services/admin-api";

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<AdminItemReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState<"all" | "visible" | "hidden">("all");
  const [deleteTarget, setDeleteTarget] = useState<AdminItemReview | null>(null);
  const [busyReviewId, setBusyReviewId] = useState<string | null>(null);

  useEffect(() => {
    const loadReviews = async () => {
      try {
        setIsLoading(true);
        const data = await fetchAdminReviews();
        setReviews(data);
      } catch (error) {
        console.error("Failed to load reviews:", error);
        toast.error("Failed to load reviews");
      } finally {
        setIsLoading(false);
      }
    };

    loadReviews();
  }, []);

  const filteredReviews = useMemo(() => {
    const query = searchQuery.toLowerCase();

    return reviews.filter((review) => {
      const matchesSearch =
        review.itemTitle.toLowerCase().includes(query) ||
        (review.category || "").toLowerCase().includes(query) ||
        review.reviewerName.toLowerCase().includes(query) ||
        review.ownerName.toLowerCase().includes(query) ||
        review.comment.toLowerCase().includes(query);

      const matchesVisibility =
        visibilityFilter === "all" ||
        (visibilityFilter === "visible" && !review.isHidden) ||
        (visibilityFilter === "hidden" && review.isHidden);

      return matchesSearch && matchesVisibility;
    });
  }, [reviews, searchQuery, visibilityFilter]);

  const visibleCount = reviews.filter((review) => !review.isHidden).length;
  const hiddenCount = reviews.filter((review) => review.isHidden).length;
  const averageRating = reviews.length === 0
    ? 0
    : Number((reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1));

  const handleToggleVisibility = async (review: AdminItemReview) => {
    const nextHidden = !review.isHidden;
    try {
      setBusyReviewId(review.id);
      const updated = await updateAdminReviewVisibility(review.id, nextHidden);
      setReviews((currentReviews) => currentReviews.map((currentReview) => (currentReview.id === review.id ? updated : currentReview)));
      toast.success(nextHidden ? "Review hidden" : "Review shown");
    } catch (error) {
      console.error("Failed to update review visibility:", error);
      toast.error("Failed to update review visibility");
    } finally {
      setBusyReviewId(null);
    }
  };

  const handleDeleteReview = async () => {
    if (!deleteTarget) {
      return;
    }

    try {
      setBusyReviewId(deleteTarget.id);
      await deleteAdminReview(deleteTarget.id);
      setReviews((currentReviews) => currentReviews.filter((review) => review.id !== deleteTarget.id));
      toast.success("Review deleted");
      setDeleteTarget(null);
    } catch (error) {
      console.error("Failed to delete review:", error);
      toast.error("Failed to delete review");
    } finally {
      setBusyReviewId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <AdminHeader />
      <AdminSidebar />

      <main className="pt-20 pb-8 pl-[var(--admin-sidebar-width)]">
        <div className="container mx-auto px-4 max-w-7xl">
          {isLoading ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4" />
                <p className="text-muted-foreground">Loading reviews...</p>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-8 animate-fade-in">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-orange-400 to-orange-500 bg-clip-text text-transparent">
                  Reviews Moderation
                </h1>
                <p className="text-muted-foreground mt-2">
                  Review all item feedback, hide harmful comments, and delete spam when needed.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                {[
                  { label: "Total Reviews", value: reviews.length, color: "from-blue-500 to-blue-600" },
                  { label: "Visible", value: visibleCount, color: "from-green-500 to-green-600" },
                  { label: "Hidden", value: hiddenCount, color: "from-orange-500 to-orange-600" },
                  { label: "Average Rating", value: averageRating.toFixed(1), color: "from-purple-500 to-purple-600" },
                ].map((stat) => (
                  <div key={stat.label} className={`p-4 rounded-lg bg-gradient-to-r ${stat.color} text-white shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]`}>
                    <p className="text-sm opacity-90">{stat.label}</p>
                    <p className="text-3xl font-bold mt-1">{stat.value}</p>
                  </div>
                ))}
              </div>

              <Card className="border-2 mb-6">
                <CardHeader>
                  <CardTitle className="text-lg">Search & Filter</CardTitle>
                  <CardDescription>Find reviews by item, reviewer, owner, category, or comment text.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col lg:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search reviews..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { key: "all", label: "All" },
                        { key: "visible", label: "Visible" },
                        { key: "hidden", label: "Hidden" },
                      ].map((filter) => (
                        <Button
                          key={filter.key}
                          variant={visibilityFilter === filter.key ? "default" : "outline"}
                          onClick={() => setVisibilityFilter(filter.key as typeof visibilityFilter)}
                          className={visibilityFilter === filter.key ? "bg-primary hover:bg-primary/90" : ""}
                        >
                          {filter.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 hover:shadow-lg transition-all">
                <CardHeader>
                  <CardTitle>All Reviews ({filteredReviews.length})</CardTitle>
                  <CardDescription>Item name, category, reviewer, owner, date, rating, and comment.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b-2 border-border">
                          <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Item</th>
                          <th className="text-left py-3 px-4 font-semibold text-muted-foreground">People</th>
                          <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Rating</th>
                          <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Comment</th>
                          <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Status</th>
                          <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredReviews.map((review) => (
                          <tr key={review.id} className={`border-b hover:bg-muted/50 transition-all group ${review.isHidden ? "bg-muted/30" : ""}`}>
                            <td className="py-4 px-4 align-top">
                              <div className="space-y-1">
                                <p className="font-semibold">{review.itemTitle}</p>
                                <Badge variant="outline" className="text-xs">
                                  {review.category || "Uncategorized"}
                                </Badge>
                              </div>
                            </td>
                            <td className="py-4 px-4 align-top">
                              <div className="space-y-3 text-sm">
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={review.reviewerAvatar} alt={review.reviewerName} />
                                    <AvatarFallback>{getInitials(review.reviewerName)}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium">Reviewer</p>
                                    <p className="text-muted-foreground">{review.reviewerName}</p>
                                  </div>
                                </div>
                                <div>
                                  <p className="font-medium">Owner</p>
                                  <p className="text-muted-foreground">{review.ownerName}</p>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(review.createdAt), "PPP")}
                                </p>
                              </div>
                            </td>
                            <td className="py-4 px-4 align-top">
                              <div className="flex items-center gap-1 font-semibold">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                {review.rating}
                              </div>
                            </td>
                            <td className="py-4 px-4 align-top max-w-xl">
                              <p className={`text-sm ${review.isHidden ? "text-muted-foreground italic" : "text-foreground"}`}>
                                {review.comment}
                              </p>
                            </td>
                            <td className="py-4 px-4 align-top">
                              <Badge
                                variant="outline"
                                className={review.isHidden ? "bg-orange-100 text-orange-800 border-orange-200" : "bg-green-100 text-green-800 border-green-200"}
                              >
                                {review.isHidden ? "Hidden" : "Visible"}
                              </Badge>
                            </td>
                            <td className="py-4 px-4 align-top">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => handleToggleVisibility(review)}
                                    disabled={busyReviewId === review.id}
                                  >
                                    {review.isHidden ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
                                    {review.isHidden ? "Show comment" : "Hide comment"}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => setDeleteTarget(review)}
                                    className="text-red-600"
                                    disabled={busyReviewId === review.id}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete comment
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {filteredReviews.length === 0 && (
                    <div className="py-16 text-center text-muted-foreground">
                      <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-40" />
                      <p>No reviews match the current filters.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this review?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the review from the platform. Hidden or visible, it cannot be restored.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteReview} className="bg-red-600 text-white hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
