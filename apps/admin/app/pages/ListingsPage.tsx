import { useState, useMemo, useEffect } from "react";
import { Search, Eye, Trash2, Star, MoreVertical, BadgeCheck, Check, ChevronDown, ChevronRight } from "lucide-react";
import { AdminHeader } from "../components/AdminHeader";
import { AdminSidebar } from "../components/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  approveAdminListing,
  deleteItemReview,
  deleteAdminListing,
  fetchAdminBorrowRequests,
  fetchAdminListings,
  fetchItemReviews,
  rejectAdminListing,
  setAdminListingFeatured,
  type AdminBorrowRequest,
  type AdminItemReview,
  type AdminListing,
} from "../services/admin-api";
import { toast } from "sonner";

export default function ListingsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [listings, setListings] = useState<AdminListing[]>([]);
  const [requests, setRequests] = useState<AdminBorrowRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedListing, setSelectedListing] = useState<AdminListing | null>(null);
  const [selectedListingReviews, setSelectedListingReviews] = useState<AdminItemReview[]>([]);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isTransactionsOpen, setIsTransactionsOpen] = useState(false);
  const [isReviewsOpen, setIsReviewsOpen] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminListing | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    const loadListings = async () => {
      try {
        setIsLoading(true);
        const [listingsResult, requestsResult] = await Promise.allSettled([
          fetchAdminListings(),
          fetchAdminBorrowRequests(),
        ]);

        if (listingsResult.status === "rejected") {
          throw listingsResult.reason;
        }

        setListings([...listingsResult.value].sort((left, right) => new Date(right.createdDate).getTime() - new Date(left.createdDate).getTime()));

        if (requestsResult.status === "fulfilled") {
          setRequests(requestsResult.value);
        } else {
          console.error("Failed to load transaction history:", requestsResult.reason);
          toast.error("Loaded listings but failed to load transaction history");
        }
      } catch (error) {
        console.error("Failed to load listings:", error);
        toast.error("Failed to load listings");
      } finally {
        setIsLoading(false);
      }
    };
    loadListings();
  }, []);

  useEffect(() => {
    const loadItemReviews = async () => {
      if (!selectedListing || normalizeListingStatus(selectedListing.status) !== "approved") {
        setSelectedListingReviews([]);
        return;
      }

      try {
        setIsDetailLoading(true);
        const reviews = await fetchItemReviews(selectedListing.id);
        setSelectedListingReviews(reviews);
      } catch (error) {
        console.error("Failed to load item reviews:", error);
        toast.error("Failed to load item reviews");
        setSelectedListingReviews([]);
      } finally {
        setIsDetailLoading(false);
      }
    };

    loadItemReviews();
  }, [selectedListing]);

  useEffect(() => {
    setIsTransactionsOpen(false);
    setIsReviewsOpen(false);
    setShowAllReviews(false);
  }, [selectedListing?.id]);

  const filteredListings = useMemo(() => {
    return [...listings]
      .sort((left, right) => new Date(right.createdDate).getTime() - new Date(left.createdDate).getTime())
      .filter((listing) => {
        const matchesSearch =
          listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          listing.owner.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus =
          statusFilter === "all"
            ? true
            : statusFilter === "featured"
              ? listing.featured
              : listing.status === statusFilter;
        return matchesSearch && matchesStatus;
      });
  }, [listings, searchQuery, statusFilter]);

  const selectedListingTransactions = useMemo(() => {
    if (!selectedListing) return [];
    return requests
      .filter((request) => request.itemId === selectedListing.id)
      .sort((left, right) => {
        const leftDate = new Date(left.returnedAt || left.createdAt).getTime();
        const rightDate = new Date(right.returnedAt || right.createdAt).getTime();
        return rightDate - leftDate;
      });
  }, [requests, selectedListing]);

  const normalizeListingStatus = (status?: string) => {
    if (status === "approved" || status === "pending" || status === "rejected") {
      return status;
    }
    return "pending";
  };

  const formatListingStatusLabel = (status?: string) => {
    const normalizedStatus = normalizeListingStatus(status);
    return normalizedStatus === "pending"
      ? "Pending Review"
      : normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1);
  };

  const selectedListingIsApproved = selectedListing ? normalizeListingStatus(selectedListing.status) === "approved" : false;

  const updateListingInState = (listingId: string, updater: (listing: AdminListing) => AdminListing) => {
    setListings((currentListings) => currentListings.map((listing) => (listing.id === listingId ? updater(listing) : listing)));
  };

  const handleApprove = async (listingId: string, title: string) => {
    try {
      const updated = await approveAdminListing(listingId);
      updateListingInState(listingId, (listing) => ({ ...listing, status: updated.status }));
      setSelectedListing((current) => (current?.id === listingId ? { ...current, status: updated.status } : current));
      toast.success(`Listing "${title}" has been approved for publication`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to approve listing");
    }
  };

  const handleReject = async (listingId: string, title: string) => {
    try {
      const updated = await rejectAdminListing(listingId);
      updateListingInState(listingId, (listing) => ({ ...listing, status: updated.status }));
      setSelectedListing((current) => (current?.id === listingId ? { ...current, status: updated.status } : current));
      toast.info(`Listing "${title}" has been rejected`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to reject listing");
    }
  };

  const handleApproveAndFeature = async (listingId: string, title: string) => {
    try {
      const approved = await approveAdminListing(listingId);
      updateListingInState(listingId, (listing) => ({ ...listing, status: approved.status }));
      setSelectedListing((current) => (current?.id === listingId ? { ...current, status: approved.status } : current));

      const featured = await setAdminListingFeatured(listingId, true);
      updateListingInState(listingId, (listing) => ({ ...listing, featured: Boolean(featured.featured) }));
      setSelectedListing((current) => (current?.id === listingId ? { ...current, featured: Boolean(featured.featured) } : current));

      toast.success(`Listing "${title}" has been approved and featured`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to approve and feature listing");
    }
  };

  const handleMarkFeatured = async (listingId: string, title: string, isFeatured: boolean) => {
    const nextFeatured = !isFeatured;
    try {
      const updated = await setAdminListingFeatured(listingId, nextFeatured);
      updateListingInState(listingId, (listing) => ({ ...listing, featured: Boolean(updated.featured) }));
      setSelectedListing((current) => (current?.id === listingId ? { ...current, featured: Boolean(updated.featured) } : current));
      toast.success(`Listing "${title}" is now ${nextFeatured ? "featured" : "unfeatured"}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update featured status");
    }
  };

  const handleDeleteListing = async (listingId: string, title: string) => {
    try {
      await deleteAdminListing(listingId);
      setListings((currentListings) => currentListings.filter((listing) => listing.id !== listingId));
      if (selectedListing?.id === listingId) {
        setSelectedListing(null);
      }
      toast.error(`Listing "${title}" has been removed`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete listing");
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    try {
      await deleteItemReview(reviewId);
      setSelectedListingReviews((currentReviews) => currentReviews.filter((review) => review.id !== reviewId));
      toast.success("Review deleted successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete review");
    }
  };

  const getStatusColor = (status: string) => {
    switch (normalizeListingStatus(status)) {
      case "approved":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
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
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                <p className="text-muted-foreground">Loading listings...</p>
              </div>
            </div>
          ) : (
            <>
          {/* Header */}
          <div className="mb-8 animate-fade-in">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-orange-400 to-orange-500 bg-clip-text text-transparent">
              Listings Management
            </h1>
            <p className="text-muted-foreground mt-2">
              Review listings before they are published to the platform
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Total Listings", value: listings.length, color: "from-blue-500 to-blue-600" },
              { label: "Approved", value: listings.filter((l) => l.status === "approved").length, color: "from-green-500 to-green-600" },
              { label: "Pending Review", value: listings.filter((l) => l.status === "pending").length, color: "from-yellow-500 to-yellow-600" },
              { label: "Rejected", value: listings.filter((l) => l.status === "rejected").length, color: "from-red-500 to-red-600" },
            ].map((stat, idx) => (
              <div key={idx} className={`p-4 rounded-lg bg-gradient-to-r ${stat.color} text-white shadow-lg hover:shadow-xl transition-all hover:scale-105`}>
                <p className="text-sm opacity-90">{stat.label}</p>
                <p className="text-3xl font-bold mt-1">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Filter Section */}
          <Card className="border-2 mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Search & Filter</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by title or owner..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  {['all', 'approved', 'pending', 'rejected', 'featured'].map((status) => (
                    <Button
                      key={status}
                      variant={statusFilter === status ? "default" : "outline"}
                      onClick={() => {
                        setStatusFilter(status);
                      }}
                      className={statusFilter === status ? (status === 'featured' ? "bg-amber-500 hover:bg-amber-600" : "bg-primary hover:bg-primary/90") : ""}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Listings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {filteredListings.map((listing) => (
              <Card
                key={listing.id}
                className="border-2 overflow-hidden hover:shadow-xl transition-all hover:scale-105 group"
              >
                {/* Image */}
                <div className="relative h-48 overflow-hidden bg-muted">
                  <img
                    src={listing.image}
                    alt={listing.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  {listing.featured && (
                    <div className="absolute top-2 right-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
                      <Star className="h-4 w-4 fill-white" />
                      Featured
                    </div>
                  )}
                  <Badge className={`absolute top-2 left-2 ${getStatusColor(listing.status)}`}>
                    {formatListingStatusLabel(listing.status)}
                  </Badge>
                </div>

                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-2">{listing.title}</CardTitle>
                      <CardDescription className="mt-1">{listing.category}</CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Owner */}
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Owner</p>
                    <p className="font-semibold text-sm">{listing.owner}</p>
                  </div>

                  {/* Pricing */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                      <p className="text-xs text-muted-foreground">Deposit</p>
                      <p className="font-bold text-primary">₱{listing.deposit.toLocaleString()}</p>
                    </div>
                    <div className="p-3 bg-secondary/10 rounded-lg border border-secondary/20">
                      <p className="text-xs text-muted-foreground">Daily Rate</p>
                      <p className="font-bold text-secondary">₱{listing.dailyRate.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 text-center py-2 border-t border-b">
                    <div>
                      <p className="text-xs text-muted-foreground">Borrows</p>
                      <p className="font-bold text-lg">{listing.borrowCount}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Rating</p>
                      <p className="font-bold text-lg">{listing.rating > 0 ? `${listing.rating}⭐` : "N/A"}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setSelectedListing(listing)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    <DropdownMenu
                      open={openMenuId === listing.id}
                      onOpenChange={(open) => setOpenMenuId(open ? listing.id : null)}
                    >
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {listing.status === "pending" && (
                          <DropdownMenuItem onClick={() => handleApprove(listing.id, listing.title)} className="text-green-600">
                            ✓ Approve for Publication
                          </DropdownMenuItem>
                        )}
                        {listing.status === "pending" && (
                          <DropdownMenuItem onClick={() => handleReject(listing.id, listing.title)} className="text-destructive">
                            ✕ Reject Listing
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleMarkFeatured(listing.id, listing.title, listing.featured)}>
                          <Star className="h-4 w-4 mr-2" />
                          {listing.featured ? "Remove Featured" : "Mark Featured"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onSelect={(event) => {
                            event.preventDefault();
                            setOpenMenuId(null);
                            setDeleteTarget(listing);
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
            <AlertDialogContent>
              <AlertDialogTitle>Remove Listing?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove "{deleteTarget?.title}"? This action cannot be undone.
              </AlertDialogDescription>
              <div className="flex gap-3 justify-end">
                <AlertDialogCancel onClick={() => setDeleteTarget(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    if (!deleteTarget) return;
                    handleDeleteListing(deleteTarget.id, deleteTarget.title);
                    setDeleteTarget(null);
                  }}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </div>
            </AlertDialogContent>
          </AlertDialog>

          {/* Empty State */}
          {filteredListings.length === 0 && (
            <Card className="border-2 border-dashed text-center py-12">
              <CardContent>
                <p className="text-muted-foreground mb-4">No listings found matching your filters</p>
                <Button variant="outline" onClick={() => { setSearchQuery(""); setStatusFilter("all"); }}>
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          )}

          <Dialog open={Boolean(selectedListing)} onOpenChange={(open) => !open && setSelectedListing(null)}>
            <DialogContent className="max-w-7xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Listing Details</DialogTitle>
                <DialogDescription>Detailed listing preview for admin review.</DialogDescription>
              </DialogHeader>
              {selectedListing && (
                <div className="flex flex-row gap-6">
                  <div className="space-y-4 w-8/12">
                    <div className="w-full h-56 bg-muted rounded-lg overflow-hidden">
                      <img
                        src={selectedListing.image}
                        alt={selectedListing.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Listing</p>
                      <p className="text-lg font-semibold">{selectedListing.title}</p>
                      <p className="text-xs text-muted-foreground">ID: {selectedListing.id}</p>
                    </div>

                    {selectedListingIsApproved && (
                      <>
                        <div className="rounded-lg border p-3">
                          <button
                            type="button"
                            className="w-full flex items-center justify-between"
                            onClick={() => setIsTransactionsOpen((current) => !current)}
                          >
                            <p className="text-xs text-muted-foreground text-left">Transaction History</p>
                            {isTransactionsOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                          </button>
                          {isTransactionsOpen && (
                            <div className="mt-3 space-y-3">
                              {selectedListingTransactions.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No transactions found for this item.</p>
                              ) : (
                                (() => {
                                  const latestTransaction = selectedListingTransactions[0];
                                  if (!latestTransaction) return null;
                                  return (
                                    <div className="rounded-md border p-3 bg-muted/20 space-y-2">
                                      <div className="flex items-center justify-between gap-3">
                                        <div>
                                          <p className="font-semibold text-sm">{latestTransaction.borrower}</p>
                                          <p className="text-xs text-muted-foreground">
                                            {new Date(latestTransaction.startDate).toLocaleDateString()} to {new Date(latestTransaction.endDate).toLocaleDateString()}
                                          </p>
                                        </div>
                                        <Badge className={getStatusColor(latestTransaction.status)}>{latestTransaction.status}</Badge>
                                      </div>
                                      <p className="text-xs text-muted-foreground">
                                        Requested: {new Date(latestTransaction.createdAt).toLocaleDateString()}
                                        {latestTransaction.returnedAt ? ` · Returned: ${new Date(latestTransaction.returnedAt).toLocaleDateString()}` : ""}
                                      </p>
                                      {latestTransaction.reportReason && (
                                        <p className="text-xs text-rose-700">Report: {latestTransaction.reportReason}</p>
                                      )}
                                      {latestTransaction.borrowerFeedback && (
                                        <p className="text-xs text-muted-foreground">Feedback: {latestTransaction.borrowerFeedback}</p>
                                      )}
                                    </div>
                                  );
                                })()
                              )}
                            </div>
                          )}
                        </div>

                        <div className="rounded-lg border p-3">
                          <button
                            type="button"
                            className="w-full flex items-center justify-between"
                            onClick={() => setIsReviewsOpen((current) => !current)}
                          >
                            <p className="text-xs text-muted-foreground text-left">Reviews</p>
                            {isReviewsOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                          </button>
                          {isReviewsOpen && (
                            <div className="mt-3 space-y-3">
                              {isDetailLoading ? (
                                <p className="text-sm text-muted-foreground">Loading reviews...</p>
                              ) : selectedListingReviews.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No reviews found for this item.</p>
                              ) : (
                                selectedListingReviews.slice(0, showAllReviews ? selectedListingReviews.length : 3).map((review) => (
                                  <div key={review.id} className="rounded-md border p-3 bg-muted/20 space-y-2">
                                    <div className="flex items-center justify-between gap-3">
                                      <div>
                                        <p className="font-semibold text-sm">{review.reviewerName}</p>
                                        <p className="text-xs text-muted-foreground">{new Date(review.createdAt).toLocaleDateString()}</p>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Badge variant="outline">{review.rating}⭐</Badge>
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                              <MoreVertical className="h-4 w-4" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end">
                                            <DropdownMenuItem
                                              className="text-destructive"
                                              onClick={() => handleDeleteReview(review.id)}
                                            >
                                              <Trash2 className="h-4 w-4 mr-2" />
                                              Delete Review
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      </div>
                                    </div>
                                    <p className="text-sm text-muted-foreground">{review.comment}</p>
                                    {review.ownerReply && (
                                      <p className="text-xs text-green-700">Owner reply: {review.ownerReply}</p>
                                    )}
                                  </div>
                                ))
                              )}
                              {selectedListingReviews.length > 3 && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full"
                                  onClick={() => setShowAllReviews((current) => !current)}
                                >
                                  {showAllReviews ? "Show Less" : "Show More"}
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  <div className="space-y-4 w-4/12">
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">Owner</p>
                      <p className="font-semibold">{selectedListing.owner}</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">Category</p>
                      <p className="font-semibold">{selectedListing.category}</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">Pricing</p>
                      <p className="font-semibold">₱{selectedListing.dailyRate.toLocaleString()} / day</p>
                      <p className="text-sm text-muted-foreground">Deposit: ₱{selectedListing.deposit.toLocaleString()}</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">Status</p>
                      <Badge className={getStatusColor(selectedListing.status)}>
                        {formatListingStatusLabel(selectedListing.status)}
                      </Badge>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">Featured</p>
                      <p className="font-semibold">{selectedListing.featured ? "Yes" : "No"}</p>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                      {selectedListing.status === "pending" && (
                        <>
                          <Button onClick={() => handleApprove(selectedListing.id, selectedListing.title)}>
                            <Check className="h-4 w-4 mr-2" />
                            Approve
                          </Button>
                          <Button variant="outline" onClick={() => handleApproveAndFeature(selectedListing.id, selectedListing.title)}>
                            <BadgeCheck className="h-4 w-4 mr-2" />
                            Approve & Feature
                          </Button>
                          <Button variant="outline" onClick={() => handleReject(selectedListing.id, selectedListing.title)}>
                            Reject
                          </Button>
                        </>
                      )}

                      {selectedListing.status === "approved" && (
                        <Button variant="outline" onClick={() => handleMarkFeatured(selectedListing.id, selectedListing.title, selectedListing.featured)}>
                          <Star className="h-4 w-4 mr-2" />
                          {selectedListing.featured ? "Remove Featured" : "Mark Featured"}
                        </Button>
                      )}

                      <Button
                        variant="destructive"
                        onClick={() => {
                          setDeleteTarget(selectedListing);
                          setSelectedListing(null);
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>

                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
