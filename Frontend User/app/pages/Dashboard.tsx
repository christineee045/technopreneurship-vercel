import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { Header } from "../components/Header";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { CardDescription } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Switch } from "../components/ui/switch";
import { 
  Package, 
  Send, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Calendar,
  Edit,
  Trash2,
  Eye,
  AlertCircle,
  Star
} from "lucide-react";
import { categories } from "../data/categories";
import { createReview, fetchUserItems, fetchBorrowRequestsByBorrowerId, fetchBorrowRequestsByOwnerId, fetchReviewsByReviewerId, fetchReviewsByOwnerId, deleteItem, updateBorrowRequest as updateBorrowRequestAPI, type BorrowRequest, type Item, type Review } from "../services/api";
import { Link, useNavigate, useSearchParams } from "react-router";
import { format } from "date-fns";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  type DashboardTab = "my-items" | "my-requests" | "incoming" | "reviews" | "rated-users";
  const ITEMS_PER_PAGE = 4;

  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState<Item[]>([]);
  const [requests, setRequests] = useState<BorrowRequest[]>([]);
  const [writtenReviews, setWrittenReviews] = useState<Review[]>([]);
  const [receivedReviews, setReceivedReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DashboardTab>("my-items");
  const [tabPages, setTabPages] = useState<Record<DashboardTab, number>>({
    "my-items": 1,
    "my-requests": 1,
    incoming: 1,
    reviews: 1,
    "rated-users": 1,
  });
  const [reviewPages, setReviewPages] = useState({
    written: 1,
    received: 1,
  });
  const [selectedRequest, setSelectedRequest] = useState<BorrowRequest | null>(null);
  const [requestReviewRating, setRequestReviewRating] = useState(5);
  const [requestReviewHover, setRequestReviewHover] = useState(0);
  const [requestReviewComment, setRequestReviewComment] = useState("");
  const [ownerRating, setOwnerRating] = useState(5);
  const [ownerRatingHover, setOwnerRatingHover] = useState(0);
  const [ownerFeedback, setOwnerFeedback] = useState("");
  const [reportReason, setReportReason] = useState("");
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    category: "",
    condition: "",
    images: [] as string[],
    rentalFeePerDay: "",
    deposit: "",
    location: "",
    available: true,
  });

    useEffect(() => {
      const loadData = async () => {
        if (!user) return;
        try {
          setIsLoading(true);
          const userId = user.id || user._id || "";
          if (!userId) {
            throw new Error("User ID not found");
          }
          const [myItemsData, myRequestsData, incomingRequestsData, writtenReviewsData, receivedReviewsData] = await Promise.all([
            fetchUserItems(),
            fetchBorrowRequestsByBorrowerId(userId),
            fetchBorrowRequestsByOwnerId(userId),
            fetchReviewsByReviewerId(userId),
            fetchReviewsByOwnerId(userId),
          ]);
          setItems(myItemsData);
          setRequests([...myRequestsData, ...incomingRequestsData]);
          setWrittenReviews(writtenReviewsData);
          setReceivedReviews(receivedReviewsData);
        } catch (error) {
          console.error("Failed to fetch dashboard data:", error);
          toast.error(error instanceof Error ? error.message : "Failed to load dashboard data");
        } finally {
          setIsLoading(false);
          // Refresh user data to ensure we have latest reviewCount, rating, etc.
          refreshUser();
        }
      };
      loadData();
    }, [user, refreshUser]);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "my-items" || tab === "my-requests" || tab === "incoming" || tab === "reviews" || tab === "rated-users") {
      setActiveTab(tab as DashboardTab);
    }
  }, [searchParams]);

  if (!user) {
    navigate('/login');
    return null;
  }

  const myItems = items.filter(item => item.ownerId === user.id);
  const myRequests = requests.filter(req => req.borrowerId === user.id);
  const incomingRequests = requests.filter(req => req.ownerId === user.id);
  const pendingIncomingRequests = incomingRequests.filter(req => req.borrowerRating === undefined);
  const ratedBorrowerRequests = useMemo(() => {
    const ratedByBorrower = new Map<string, BorrowRequest>();
    const sortedRequests = [...incomingRequests].sort((left, right) => {
      const leftTime = new Date(left.returnedAt || left.createdAt).getTime();
      const rightTime = new Date(right.returnedAt || right.createdAt).getTime();
      return rightTime - leftTime;
    });

    sortedRequests.forEach((request) => {
      if (request.borrowerRating === undefined) return;
      if (!ratedByBorrower.has(request.borrowerId)) {
        ratedByBorrower.set(request.borrowerId, request);
      }
    });

    return Array.from(ratedByBorrower.values());
  }, [incomingRequests]);
  const approvedMyItems = myItems.filter((item) => (item.approvalStatus ?? "approved") === "approved");
  const pendingMyItems = myItems.filter((item) => item.approvalStatus === "pending");

  const getPageData = <T,>(itemsToPage: T[], tab: DashboardTab) => {
    const totalPages = Math.max(1, Math.ceil(itemsToPage.length / ITEMS_PER_PAGE));
    const currentPage = Math.min(tabPages[tab], totalPages);
    const start = (currentPage - 1) * ITEMS_PER_PAGE;

    return {
      currentPage,
      totalPages,
      pageItems: itemsToPage.slice(start, start + ITEMS_PER_PAGE),
    };
  };

  const updateTabPage = (tab: DashboardTab, nextPage: number) => {
    setTabPages(prev => ({
      ...prev,
      [tab]: nextPage,
    }));
  };

  const updateReviewPage = (section: "written" | "received", nextPage: number) => {
    setReviewPages(prev => ({
      ...prev,
      [section]: nextPage,
    }));
  };

  const getPagedList = <T,>(itemsToPage: T[], currentPage: number) => {
    const totalPages = Math.max(1, Math.ceil(itemsToPage.length / ITEMS_PER_PAGE));
    const safePage = Math.min(currentPage, totalPages);
    const start = (safePage - 1) * ITEMS_PER_PAGE;

    return {
      currentPage: safePage,
      totalPages,
      pageItems: itemsToPage.slice(start, start + ITEMS_PER_PAGE),
    };
  };

  const myItemsPage = getPageData(myItems, "my-items");
  const myRequestsPage = getPageData(myRequests, "my-requests");
  const incomingRequestsPage = getPageData(pendingIncomingRequests, "incoming");
  const writtenReviewsPage = getPagedList(writtenReviews, reviewPages.written);
  const receivedReviewsPage = getPagedList(receivedReviews, reviewPages.received);
  const ratedUsersPage = getPageData(ratedBorrowerRequests, "rated-users");

  const canOpenItem = (item: Item) => (item.approvalStatus ?? "approved") === "approved";

  const handleEditItem = (item: Item) => {
    setEditingItemId(item.id || item._id || null);
    setEditForm({
      title: item.title,
      description: item.description,
      category: item.category,
      condition: item.condition,
      images: item.images,
      rentalFeePerDay: item.rentalFeePerDay.toString(),
      deposit: item.deposit.toString(),
      location: item.location,
      available: item.available,
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!window.confirm("Are you sure you want to delete this item? This action cannot be undone.")) {
      return;
    }
    try {
      await deleteItem(itemId);
      setItems(prev => prev.filter(item => (item.id || item._id) !== itemId));
      toast.success("Item deleted successfully");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete item";
      toast.error(message);
    }
  };

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const fileReaders = Array.from(files).map(
      (file) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error("Failed to read file"));
          reader.readAsDataURL(file);
        }),
    );

    try {
      const uploadedImages = await Promise.all(fileReaders);
      setEditForm((prev) => ({
        ...prev,
        images: [...prev.images, ...uploadedImages].slice(0, 5),
      }));
      if (uploadedImages.length + editForm.images.length > 5) {
        toast.info("Maximum of 5 images allowed.");
      } else {
        toast.success("Images updated. Save changes to apply.");
      }
    } catch {
      toast.error("Failed to process one or more images.");
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setEditForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, index) => index !== indexToRemove),
    }));
  };

  const handleSaveItemChanges = () => {
    if (!editingItemId) return;

    if (
      !editForm.title ||
      !editForm.description ||
      !editForm.category ||
      !editForm.condition ||
      !editForm.rentalFeePerDay ||
      !editForm.deposit ||
      !editForm.location
    ) {
      toast.error("Please fill in all required item fields.");
      return;
    }

    if (editForm.images.length === 0) {
      toast.error("Please upload at least one image.");
      return;
    }

    setItems(prev =>
      prev.map(item =>
        item.id === editingItemId
          ? {
              ...item,
              title: editForm.title,
              description: editForm.description,
              category: editForm.category,
              condition: editForm.condition as Item['condition'],
              images: editForm.images,
              rentalFeePerDay: Number(editForm.rentalFeePerDay),
              deposit: Number(editForm.deposit),
              location: editForm.location,
              available: editForm.available,
            }
          : item,
      ),
    );

    setIsEditDialogOpen(false);
    setEditingItemId(null);
    toast.success("Item details updated successfully.");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'Rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'Active': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Returned': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'Reported': return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'Overdue': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending': return <Clock className="h-4 w-4" />;
      case 'Approved': return <CheckCircle className="h-4 w-4" />;
      case 'Rejected': return <XCircle className="h-4 w-4" />;
      case 'Active': return <Package className="h-4 w-4" />;
      case 'Returned': return <CheckCircle className="h-4 w-4" />;
      case 'Reported': return <AlertCircle className="h-4 w-4" />;
      case 'Overdue': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    try {
      await updateBorrowRequestAPI(requestId, { status: "Approved" });
      setRequests(prev => prev.map(req => req.id === requestId ? { ...req, status: 'Approved' } : req));
      toast.success("Request approved!", {
        description: "The borrower has been notified.",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to approve request";
      toast.error(message);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await updateBorrowRequestAPI(requestId, { status: "Rejected" });
      setRequests(prev => prev.map(req => req.id === requestId ? { ...req, status: 'Rejected' } : req));
      toast.info("Request rejected", {
        description: "The borrower has been notified.",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to reject request";
      toast.error(message);
    }
  };

  const handleMarkReturned = async (request: BorrowRequest) => {
    try {
      const requestId = request.id || request._id;
      if (!requestId) throw new Error("Request ID not found");

      const updated = await updateBorrowRequestAPI(requestId, { status: "Returned" });
      setRequests(prev => prev.map(req => (req.id === requestId ? { ...req, ...updated } : req)));
      setSelectedRequest(prev => (prev && (prev.id === requestId || prev._id === requestId) ? { ...prev, ...updated } : prev));
      setActiveTab("my-requests");
      toast.success("Item marked as returned", {
        description: "You can now leave a review in your requests tab.",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to mark as returned";
      toast.error(message);
    }
  };

  const handleLeaveReview = async () => {
    if (!selectedRequest) return;
    if (!requestReviewComment.trim()) {
      toast.error("Please write a review comment");
      return;
    }

    try {
      await createReview({
        itemId: selectedRequest.itemId,
        rating: requestReviewRating,
        comment: requestReviewComment.trim(),
      });
      setRequestReviewComment("");
      setRequestReviewRating(5);
      setRequestReviewHover(0);
      toast.success("Review submitted successfully");
      navigate(`/item/${selectedRequest.itemId}/reviews`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to submit review";
      toast.error(message);
    }
  };

  const handleOwnerFeedback = async () => {
    if (!selectedRequest) return;

    try {
      const requestId = selectedRequest.id || selectedRequest._id;
      if (!requestId) throw new Error("Request ID not found");

      const payload: Partial<BorrowRequest> = {
        borrowerRating: ownerRating,
        borrowerFeedback: ownerFeedback.trim(),
      };

      if (reportReason.trim()) {
        payload.status = "Reported";
        payload.reportReason = reportReason.trim();
      }

      const updated = await updateBorrowRequestAPI(requestId, payload);

      setRequests(prev => prev.map(req => (req.id === requestId ? { ...req, ...updated } : req)));
      setSelectedRequest(prev => (prev && (prev.id === requestId || prev._id === requestId) ? { ...prev, ...updated } : prev));
      setOwnerFeedback("");
      setReportReason("");
      setOwnerRating(5);
      setOwnerRatingHover(0);
      toast.success(reportReason.trim() ? "Report sent for admin review" : "Feedback saved");
      if (!reportReason.trim()) {
        navigate(`/user/${selectedRequest.borrowerId}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save feedback";
      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Profile Header */}
        <div className="mb-8">
          <div className="flex items-start gap-6 mb-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="text-2xl">
                {user.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-1">{user.name}</h1>
              <p className="text-muted-foreground mb-3">{user.email}</p>
              <div className="flex items-center gap-6 text-sm">
                <div>
                  <span className="text-muted-foreground">Member since:</span>
                  <span className="ml-2 font-medium">{format(new Date(user.joinDate), 'MMMM yyyy')}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Rating:</span>
                  <span className="ml-2 font-medium">{user.rating} ⭐</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Reviews:</span>
                  <span className="ml-2 font-medium">{user.reviewCount}</span>
                </div>
              </div>
            </div>
            <Link to="/add-listing">
              <Button>List New Item</Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">My Listings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{myItems.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {approvedMyItems.filter(i => i.available).length} live · {pendingMyItems.length} under review
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">My Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{myRequests.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {myRequests.filter(r => r.status === 'Pending').length} pending
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Incoming Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{pendingIncomingRequests.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {pendingIncomingRequests.filter(r => r.status === 'Pending').length} need review
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Rated Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{ratedBorrowerRequests.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  borrowers with saved feedback
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as DashboardTab)} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5 max-w-4xl">
            <TabsTrigger value="my-items">My Items</TabsTrigger>
            <TabsTrigger value="my-requests">My Requests</TabsTrigger>
            <TabsTrigger value="incoming">Incoming</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
              <TabsTrigger value="rated-users">Rated Users</TabsTrigger>
          </TabsList>

          {/* My Items Tab */}
          <TabsContent value="my-items" className="space-y-4">
            {myItems.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium mb-2">No items listed yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Start earning by listing your tools and equipment
                  </p>
                  <Link to="/add-listing">
                    <Button>List Your First Item</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <>
              {myItemsPage.pageItems.map(item => (
                <Card
                  key={item.id || item._id || item.title}
                  className={`${canOpenItem(item) ? "cursor-pointer hover:bg-muted/50" : "cursor-default"} transition-colors`}
                  onClick={() => {
                    if (canOpenItem(item)) {
                      navigate(`/item/${item.id || item._id}`);
                    }
                  }}
                >
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      <img 
                        src={item.images[0]} 
                        alt={item.title}
                        className="w-24 h-24 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold mb-1">{item.title}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-1">{item.description}</p>
                          </div>
                          <div className="flex gap-2">
                            {(() => {
                              const itemId = item.id || item._id;
                              return itemId ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditItem(item);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              ) : null;
                            })()}
                            {(() => {
                              const itemId = item.id || item._id;
                              return itemId ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteItem(itemId);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              ) : null;
                            })()}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          {item.approvalStatus === "pending" || item.approvalStatus === "rejected" ? (
                            <Badge variant={item.approvalStatus === "rejected" ? "destructive" : "outline"}>
                              {item.approvalStatus === "pending" ? "Under Review" : "Rejected"}
                            </Badge>
                          ) : (
                            <Badge variant={item.available ? "secondary" : "destructive"}>
                              {item.available ? "Available" : "Unavailable"}
                            </Badge>
                          )}
                          <span className="text-muted-foreground">Deposit: ₱{item.deposit}</span>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-muted-foreground">{item.category}</span>
                        </div>
                        {item.approvalStatus === "pending" && (
                          <p className="mt-2 text-xs text-amber-700">
                            This listing is waiting for admin approval before it can appear publicly.
                          </p>
                        )}
                        {item.approvalStatus === "rejected" && (
                          <p className="mt-2 text-xs text-red-700">
                            This listing was not approved for publication. Edit it and submit again for review.
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {myItemsPage.totalPages > 1 && (
                <div className="flex items-center justify-between gap-3 pt-2">
                  <p className="text-sm text-muted-foreground">
                    Page {myItemsPage.currentPage} of {myItemsPage.totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" disabled={myItemsPage.currentPage === 1} onClick={() => updateTabPage("my-items", myItemsPage.currentPage - 1)}>
                      Previous
                    </Button>
                    <Button variant="outline" size="sm" disabled={myItemsPage.currentPage === myItemsPage.totalPages} onClick={() => updateTabPage("my-items", myItemsPage.currentPage + 1)}>
                      Next
                    </Button>
                  </div>
                </div>
              )}
              </>
            )}
          </TabsContent>

          {/* My Requests Tab */}
          <TabsContent value="my-requests" className="space-y-4">
            {myRequests.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Send className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium mb-2">No borrow requests yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Browse items and send your first borrow request
                  </p>
                  <Link to="/">
                    <Button>Browse Items</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <>
              {myRequestsPage.pageItems.map(request => (
                <Card
                  key={request.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setSelectedRequest(request)}
                >
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      <img 
                        src={request.itemImage} 
                        alt={request.itemTitle}
                        className="w-24 h-24 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold mb-1">{request.itemTitle}</h3>
                            <p className="text-sm text-muted-foreground">
                              Owner: {request.ownerName}
                            </p>
                          </div>
                          <Badge variant="outline" className={getStatusColor(request.status)}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(request.status)}
                              {request.status}
                            </div>
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(request.startDate), 'MMM d')} - {format(new Date(request.endDate), 'MMM d, yyyy')}
                          </div>
                        </div>
                        {request.message && (
                          <p className="text-sm text-muted-foreground italic">"{request.message}"</p>
                        )}
                        <p className="text-sm text-muted-foreground mt-2">
                          Request status: {request.status}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {myRequestsPage.totalPages > 1 && (
                <div className="flex items-center justify-between gap-3 pt-2">
                  <p className="text-sm text-muted-foreground">
                    Page {myRequestsPage.currentPage} of {myRequestsPage.totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" disabled={myRequestsPage.currentPage === 1} onClick={() => updateTabPage("my-requests", myRequestsPage.currentPage - 1)}>
                      Previous
                    </Button>
                    <Button variant="outline" size="sm" disabled={myRequestsPage.currentPage === myRequestsPage.totalPages} onClick={() => updateTabPage("my-requests", myRequestsPage.currentPage + 1)}>
                      Next
                    </Button>
                  </div>
                </div>
              )}
              </>
            )}
          </TabsContent>

          {/* Incoming Requests Tab */}
          <TabsContent value="incoming" className="space-y-4">
            {pendingIncomingRequests.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium mb-2">No incoming requests</h3>
                  <p className="text-sm text-muted-foreground">
                    Requests from borrowers will appear here
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
              {incomingRequestsPage.pageItems.map(request => (
                <Card
                  key={request.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setSelectedRequest(request)}
                >
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      <img 
                        src={request.itemImage} 
                        alt={request.itemTitle}
                        className="w-24 h-24 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold mb-1">{request.itemTitle}</h3>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-5 w-5">
                                <AvatarImage src={request.borrowerAvatar} />
                                <AvatarFallback className="text-xs">
                                  {request.borrowerName.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <p className="text-sm text-muted-foreground">
                                {request.borrowerName}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline" className={getStatusColor(request.status)}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(request.status)}
                              {request.status}
                            </div>
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(request.startDate), 'MMM d')} - {format(new Date(request.endDate), 'MMM d, yyyy')}
                          </div>
                        </div>
                        {request.message && (
                          <p className="text-sm mb-3 p-3 bg-muted rounded-lg">"{request.message}"</p>
                        )}
                        {request.status === 'Pending' && (
                          <div className="flex gap-2">
                            {(() => {
                              const requestId = request.id || request._id;
                              if (!requestId) return null;
                              return (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleApproveRequest(requestId);
                                    }}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRejectRequest(requestId);
                                    }}
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Reject
                                  </Button>
                                </>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {incomingRequestsPage.totalPages > 1 && (
                <div className="flex items-center justify-between gap-3 pt-2">
                  <p className="text-sm text-muted-foreground">
                    Page {incomingRequestsPage.currentPage} of {incomingRequestsPage.totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" disabled={incomingRequestsPage.currentPage === 1} onClick={() => updateTabPage("incoming", incomingRequestsPage.currentPage - 1)}>
                      Previous
                    </Button>
                    <Button variant="outline" size="sm" disabled={incomingRequestsPage.currentPage === incomingRequestsPage.totalPages} onClick={() => updateTabPage("incoming", incomingRequestsPage.currentPage + 1)}>
                      Next
                    </Button>
                  </div>
                </div>
              )}
              </>
            )}
          </TabsContent>

          <TabsContent value="reviews" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Reviews I Wrote</CardTitle>
                <CardDescription>These are the reviews you left on items you borrowed.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {writtenReviews.length === 0 ? (
                  <div className="py-10 text-center">
                    <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-medium mb-2">No reviews written yet</h3>
                    <p className="text-sm text-muted-foreground">
                      Your reviews will appear here and can take you back to the item page.
                    </p>
                  </div>
                ) : (
                  <>
                    {writtenReviewsPage.pageItems.map((review) => {
                    const reviewId = review.id || review._id;
                    return (
                      <Card
                        key={reviewId}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => navigate(`/item/${review.itemId}/reviews`)}
                      >
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-xs text-muted-foreground">Reviewed item</p>
                              <h3 className="font-semibold">{review.itemTitle}</h3>
                              <p className="text-xs text-muted-foreground">Owner: {review.ownerName}</p>
                            </div>
                            <Badge variant="outline">
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                {review.rating}
                              </div>
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{review.comment}</p>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{format(new Date(review.createdAt), 'PPP')}</span>
                            <Button variant="ghost" size="sm" className="px-0" onClick={(e) => { e.stopPropagation(); navigate(`/item/${review.itemId}/reviews`); }}>
                              View thread
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                    })}
                    {writtenReviewsPage.totalPages > 1 && (
                      <div className="flex items-center justify-between gap-3 pt-2">
                        <p className="text-sm text-muted-foreground">
                          Page {writtenReviewsPage.currentPage} of {writtenReviewsPage.totalPages}
                        </p>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" disabled={writtenReviewsPage.currentPage === 1} onClick={() => updateReviewPage("written", writtenReviewsPage.currentPage - 1)}>
                            Previous
                          </Button>
                          <Button variant="outline" size="sm" disabled={writtenReviewsPage.currentPage === writtenReviewsPage.totalPages} onClick={() => updateReviewPage("written", writtenReviewsPage.currentPage + 1)}>
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Reviews on My Items</CardTitle>
                <CardDescription>Feedback left by borrowers on items you own.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {receivedReviews.length === 0 ? (
                  <div className="py-10 text-center">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-medium mb-2">No item reviews yet</h3>
                    <p className="text-sm text-muted-foreground">
                      Reviews from borrowers will show here once they complete a borrow.
                    </p>
                  </div>
                ) : (
                  <>
                    {receivedReviewsPage.pageItems.map((review) => {
                    const reviewId = review.id || review._id;
                    return (
                      <Card
                        key={reviewId}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => navigate(`/item/${review.itemId}/reviews`)}
                      >
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-start justify-between gap-4">
                            <Link
                              to={`/user/${review.reviewerId}`}
                              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Avatar className="h-9 w-9">
                                <AvatarImage src={review.reviewerAvatar} alt={review.reviewerName} />
                                <AvatarFallback>{review.reviewerName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium hover:text-primary transition-colors">{review.reviewerName}</p>
                                <p className="text-xs text-muted-foreground">For {review.itemTitle}</p>
                              </div>
                            </Link>
                            <Badge variant="outline">
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                {review.rating}
                              </div>
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{review.comment}</p>
                          {review.ownerReply && (
                            <div className="rounded-md border bg-muted/40 p-3">
                              <p className="text-xs font-medium mb-1">Your reply</p>
                              <p className="text-sm text-muted-foreground">{review.ownerReply}</p>
                            </div>
                          )}
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{format(new Date(review.createdAt), 'PPP')}</span>
                            <Button variant="ghost" size="sm" className="px-0" onClick={(e) => { e.stopPropagation(); navigate(`/item/${review.itemId}/reviews`); }}>
                              Open thread
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                    })}
                    {receivedReviewsPage.totalPages > 1 && (
                      <div className="flex items-center justify-between gap-3 pt-2">
                        <p className="text-sm text-muted-foreground">
                          Page {receivedReviewsPage.currentPage} of {receivedReviewsPage.totalPages}
                        </p>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" disabled={receivedReviewsPage.currentPage === 1} onClick={() => updateReviewPage("received", receivedReviewsPage.currentPage - 1)}>
                            Previous
                          </Button>
                          <Button variant="outline" size="sm" disabled={receivedReviewsPage.currentPage === receivedReviewsPage.totalPages} onClick={() => updateReviewPage("received", receivedReviewsPage.currentPage + 1)}>
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rated-users" className="space-y-4">
            {ratedBorrowerRequests.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium mb-2">No rated users yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Saved borrower feedback will appear here after you rate someone.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {ratedUsersPage.pageItems.map((request) => {
                  const requestId = request.id || request._id;
                  return (
                    <Card
                      key={requestId}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => navigate(`/user/${request.borrowerId}`)}
                    >
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={request.borrowerAvatar} alt={request.borrowerName} />
                              <AvatarFallback>{request.borrowerName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-semibold">{request.borrowerName}</h3>
                              <p className="text-xs text-muted-foreground">{request.itemTitle}</p>
                            </div>
                          </div>
                          <Badge variant="outline">
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              {request.borrowerRating ?? "N/A"}
                            </div>
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {request.borrowerFeedback || "No written feedback."}
                        </p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{format(new Date(request.returnedAt || request.createdAt), 'PPP')}</span>
                          <Button variant="ghost" size="sm" className="px-0" onClick={(e) => { e.stopPropagation(); navigate(`/user/${request.borrowerId}`); }}>
                            Open profile
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                {ratedUsersPage.totalPages > 1 && (
                  <div className="flex items-center justify-between gap-3 pt-2">
                    <p className="text-sm text-muted-foreground">
                      Page {ratedUsersPage.currentPage} of {ratedUsersPage.totalPages}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" disabled={ratedUsersPage.currentPage === 1} onClick={() => updateTabPage("rated-users", ratedUsersPage.currentPage - 1)}>
                        Previous
                      </Button>
                      <Button variant="outline" size="sm" disabled={ratedUsersPage.currentPage === ratedUsersPage.totalPages} onClick={() => updateTabPage("rated-users", ratedUsersPage.currentPage + 1)}>
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={Boolean(selectedRequest)} onOpenChange={(open) => !open && setSelectedRequest(null)}>
        <DialogContent className="sm:max-w-[760px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Borrow Request Details</DialogTitle>
            <DialogDescription>
              Review the request, mark it returned, leave feedback, or escalate an issue for admin review.
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-6">
              <div className="grid gap-6 md:grid-cols-[180px_1fr]">
                <img
                  src={selectedRequest.itemImage}
                  alt={selectedRequest.itemTitle}
                  className="h-44 w-full rounded-lg object-cover"
                />

                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Item</p>
                    <p className="text-xl font-semibold">{selectedRequest.itemTitle}</p>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                    <span>Owner: {selectedRequest.ownerName}</span>
                    <span>Borrower: {selectedRequest.borrowerName}</span>
                    <span>
                      {format(new Date(selectedRequest.startDate), 'MMM d')} - {format(new Date(selectedRequest.endDate), 'MMM d, yyyy')}
                    </span>
                  </div>
                  <Badge variant="outline" className={getStatusColor(selectedRequest.status)}>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(selectedRequest.status)}
                      {selectedRequest.status}
                    </div>
                  </Badge>
                  {selectedRequest.message && <p className="text-sm text-muted-foreground">{selectedRequest.message}</p>}
                  <Button variant="outline" asChild>
                    <Link to={`/item/${selectedRequest.itemId}`}>Open Item</Link>
                  </Button>
                </div>
              </div>

              {selectedRequest.borrowerId === user.id && (selectedRequest.status === 'Approved' || selectedRequest.status === 'Active') && (
                <Card>
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium">Finish this borrow</p>
                      <p className="text-sm text-muted-foreground">Mark the item as returned when you hand it back.</p>
                    </div>
                    <Button onClick={() => handleMarkReturned(selectedRequest)}>
                      Mark as Returned
                    </Button>
                  </CardContent>
                </Card>
              )}

              {selectedRequest.borrowerId === user.id && selectedRequest.status === 'Returned' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Rate the Item Owner</CardTitle>
                    <CardDescription>Share your experience after returning the item.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Rating</Label>
                      <div className="space-y-2">
                        <div className="flex items-center gap-1" onMouseLeave={() => setRequestReviewHover(0)}>
                          {[1, 2, 3, 4, 5].map((rating) => {
                            const active = (requestReviewHover || requestReviewRating) >= rating;
                            return (
                              <button
                                key={rating}
                                type="button"
                                className="rounded-sm p-1 transition-transform hover:scale-110"
                                onMouseEnter={() => setRequestReviewHover(rating)}
                                onFocus={() => setRequestReviewHover(rating)}
                                onClick={() => setRequestReviewRating(rating)}
                                aria-label={`${rating} star${rating > 1 ? "s" : ""}`}
                              >
                                <Star className={`h-6 w-6 ${active ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
                              </button>
                            );
                          })}
                        </div>
                        <p className="text-xs text-muted-foreground">{requestReviewRating}/5 stars</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="borrower-review">Review</Label>
                      <Textarea
                        id="borrower-review"
                        rows={4}
                        value={requestReviewComment}
                        onChange={(e) => setRequestReviewComment(e.target.value)}
                        placeholder="Describe your experience with the item owner..."
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setSelectedRequest(null)}>Close</Button>
                      <Button onClick={handleLeaveReview}>Submit Review</Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {selectedRequest.ownerId === user.id && selectedRequest.status === 'Returned' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Rate the Borrower</CardTitle>
                    <CardDescription>Document how the item was returned. Leave a report if admin review is needed.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Borrower Rating</Label>
                      <div className="space-y-2">
                        <div className="flex items-center gap-1" onMouseLeave={() => setOwnerRatingHover(0)}>
                          {[1, 2, 3, 4, 5].map((rating) => {
                            const active = (ownerRatingHover || ownerRating) >= rating;
                            return (
                              <button
                                key={rating}
                                type="button"
                                className="rounded-sm p-1 transition-transform hover:scale-110"
                                onMouseEnter={() => setOwnerRatingHover(rating)}
                                onFocus={() => setOwnerRatingHover(rating)}
                                onClick={() => setOwnerRating(rating)}
                                aria-label={`${rating} star${rating > 1 ? "s" : ""}`}
                              >
                                <Star className={`h-6 w-6 ${active ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
                              </button>
                            );
                          })}
                        </div>
                        <p className="text-xs text-muted-foreground">{ownerRating}/5 stars</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="owner-feedback">Borrower Feedback</Label>
                      <Textarea
                        id="owner-feedback"
                        rows={3}
                        value={ownerFeedback}
                        onChange={(e) => setOwnerFeedback(e.target.value)}
                        placeholder="Optional comments about timeliness, condition, or communication..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="report-reason">Report Issue to Admin</Label>
                      <Textarea
                        id="report-reason"
                        rows={3}
                        value={reportReason}
                        onChange={(e) => setReportReason(e.target.value)}
                        placeholder="Optional. Add details if the item was damaged, returned late, or not returned properly."
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setSelectedRequest(null)}>Close</Button>
                      <Button onClick={handleOwnerFeedback}>{reportReason.trim() ? "Send Report" : "Save Feedback"}</Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[760px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Item Details</DialogTitle>
            <DialogDescription>
              Update your listing details, images, pricing, and availability.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-2 md:grid-cols-[250px_1fr]">
            <div className="space-y-3">
              <div className="rounded-lg border overflow-hidden bg-muted/40">
                {editForm.images[0] ? (
                  <img
                    src={editForm.images[0]}
                    alt="Cover preview"
                    className="w-full h-40 object-cover"
                  />
                ) : (
                  <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">
                    No image selected
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">Cover preview (first image)</p>

              <div className="space-y-2">
                <Label htmlFor="edit-images">Upload Images *</Label>
                <input
                  id="edit-images"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="sr-only"
                />
                <label
                  htmlFor="edit-images"
                  className="group flex cursor-pointer items-center justify-between rounded-md border border-dashed p-3 transition-colors hover:border-primary/70 hover:bg-muted/40"
                >
                  <div>
                    <p className="text-sm font-medium">Choose files</p>
                    <p className="text-xs text-muted-foreground">Tap to browse images from your device</p>
                  </div>
                  <span className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">
                    Upload
                  </span>
                </label>
                <p className="text-xs text-muted-foreground">
                  Up to 5 images. First image is used as cover. Selected: {editForm.images.length}
                </p>
              </div>

              {editForm.images.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {editForm.images.map((image, index) => (
                    <div key={`${image}-${index}`} className="relative">
                      <img
                        src={image}
                        alt={`Item preview ${index + 1}`}
                        className="h-16 w-full rounded-md object-cover border"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive text-white text-xs"
                        aria-label={`Remove image ${index + 1}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Item Title *</Label>
                <Input
                  id="edit-title"
                  value={editForm.title}
                  onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Description *</Label>
                <Textarea
                  id="edit-description"
                  rows={4}
                  value={editForm.description}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Select
                    value={editForm.category}
                    onValueChange={(value) => setEditForm(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
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
                  <Label>Condition *</Label>
                  <Select
                    value={editForm.condition}
                    onValueChange={(value) => setEditForm(prev => ({ ...prev, condition: value }))}
                  >
                    <SelectTrigger>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-rate">Rental Fee Per Day (₱) *</Label>
                  <Input
                    id="edit-rate"
                    type="number"
                    min={1}
                    value={editForm.rentalFeePerDay}
                    onChange={(e) => setEditForm(prev => ({ ...prev, rentalFeePerDay: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-deposit">Deposit (₱) *</Label>
                  <Input
                    id="edit-deposit"
                    type="number"
                    min={0}
                    value={editForm.deposit}
                    onChange={(e) => setEditForm(prev => ({ ...prev, deposit: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-location">Location *</Label>
                <Input
                  id="edit-location"
                  value={editForm.location}
                  onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                />
              </div>

              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <p className="text-sm font-medium">Available for Borrowing</p>
                  <p className="text-xs text-muted-foreground">Toggle if this item is currently available.</p>
                </div>
                <Switch
                  checked={editForm.available}
                  onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, available: checked }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveItemChanges}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}