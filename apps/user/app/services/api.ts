const VITE_API = (import.meta as any).env.VITE_API_URL;
const API_BASE_URL = `${VITE_API}/api`;

const USER_TOKEN_KEY = "lendly_token";

const getAuthHeaders = () => {
  const token = localStorage.getItem(USER_TOKEN_KEY);

  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
};

const getJsonHeaders = () => ({
  "Content-Type": "application/json",
  ...getAuthHeaders(),
});

export interface User {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  password?: string;
  isAdmin: boolean;
  joinDate: string;
  rating: number;
  reviewCount: number;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Item {
  _id?: string;
  id?: string;
  title: string;
  description: string;
  category: string;
  condition: "New" | "Excellent" | "Good" | "Fair";
  rentalFeePerDay: number;
  deposit: number;
  images: string[];
  ownerId: string;
  ownerName: string;
  ownerAvatar?: string;
  ownerEmail?: string;
  ownerPhone?: string;
  ownerRating: number;
  location: string;
  available: boolean;
  estimatedAvailableAt?: string;
  availabilityBufferDays?: number;
  isFeatured?: boolean;
  approvalStatus?: "pending" | "approved" | "rejected";
  createdAt: string;
}

export interface Review {
  _id?: string;
  id?: string;
  itemId: string;
  itemTitle: string;
  reviewerId: string;
  reviewerName: string;
  reviewerAvatar?: string;
  ownerId: string;
  ownerName: string;
  rating: number;
  comment: string;
  isHidden?: boolean;
  ownerReply?: string;
  ownerReplyAt?: string;
  replies?: ReviewReply[];
  createdAt: string;
}

export interface ReviewReply {
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  createdAt: string;
}

export interface BorrowRequest {
  _id?: string;
  id?: string;
  itemId: string;
  itemTitle: string;
  itemImage: string;
  borrowerId: string;
  borrowerName: string;
  borrowerAvatar?: string;
  ownerId: string;
  ownerName: string;
  ownerAvatar?: string;
  startDate: string;
  endDate: string;
  status: "Pending" | "Approved" | "Rejected" | "Active" | "Returned" | "Reported" | "Overdue";
  message?: string;
  borrowerRating?: number;
  borrowerFeedback?: string;
  reportReason?: string;
  createdAt: string;
  returnedAt?: string;
}

export interface BorrowerFeedback {
  id?: string;
  itemId: string;
  itemTitle: string;
  ownerId: string;
  ownerName: string;
  ownerAvatar?: string;
  borrowerRating?: number;
  borrowerFeedback?: string;
  status: BorrowRequest["status"];
  createdAt: string;
  returnedAt?: string;
}

const normalizeBorrowRequest = (request: BorrowRequest): BorrowRequest => ({
  ...request,
  id: request.id || request._id || '',
});

const normalizeItem = (item: Item): Item => ({
  ...item,
  id: item.id || item._id || '',
  images: item.images || [],
});

const normalizeReview = (review: Review): Review => ({
  ...review,
  id: review.id || review._id || '',
  replies: review.replies || [],
});

export const setUserToken = (token: string) => {
  localStorage.setItem(USER_TOKEN_KEY, token);
};

export const getUserToken = () => localStorage.getItem(USER_TOKEN_KEY);

export const clearUserToken = () => {
  localStorage.removeItem(USER_TOKEN_KEY);
};

export const clearAdminToken = () => {
  localStorage.removeItem("adminToken");
  localStorage.removeItem("adminEmail");
};

export const loginUser = async (email: string, password: string): Promise<AuthResponse> => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to log in");
  }

  return response.json();
};

export const signupUser = async (payload: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthResponse> => {
  const response = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...payload,
      joinDate: new Date().toISOString().split("T")[0],
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(payload.name)}`,
      isAdmin: false,
      rating: 0,
      reviewCount: 0,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to sign up");
  }

  return response.json();
};

export const fetchCurrentUser = async (): Promise<User> => {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: {
      ...getAuthHeaders(),
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to load current user");
  }

  return response.json();
};

export const fetchCurrentUserWithToken = async (token: string): Promise<User> => {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to load current user");
  }

  return response.json();
};

// User API
export const fetchUsers = async (): Promise<User[]> => {
  const response = await fetch(`${API_BASE_URL}/users`);
  if (!response.ok) throw new Error("Failed to fetch users");
  return response.json();
};

export const createUser = async (userData: Partial<User>): Promise<User> => {
  const response = await fetch(`${API_BASE_URL}/users`, {
    method: "POST",
    headers: getJsonHeaders(),
    body: JSON.stringify(userData),
  });
  if (!response.ok) throw new Error("Failed to create user");
  return response.json();
};

export const fetchUserById = async (id: string): Promise<User> => {
  const response = await fetch(`${API_BASE_URL}/users/${id}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error("Failed to fetch user");
  return response.json();
};

export const fetchUserProfile = async (userId: string) => {
  const [user, items, reviews] = await Promise.all([
    fetch(`${API_BASE_URL}/users/profile/${userId}`).then(r => {
      if (!r.ok) throw new Error("Failed to fetch user");
      return r.json();
    }),
    fetch(`${API_BASE_URL}/items/owner/${userId}`).then(r => {
      if (!r.ok) throw new Error("Failed to fetch items");
      return r.json();
    }),
    fetch(`${API_BASE_URL}/reviews/owner/${userId}`).then(r => {
      if (!r.ok) throw new Error("Failed to fetch reviews");
      return r.json();
    }),
  ]);
  return { user, items, reviews };
};

export const updateUserProfile = async (profileData: {
  name?: string;
  avatar?: string;
  phone?: string;
}): Promise<User> => {
  const response = await fetch(`${API_BASE_URL}/users/profile/me`, {
    method: "PUT",
    headers: getJsonHeaders(),
    body: JSON.stringify(profileData),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to update profile");
  }

  return response.json();
};

// Item API
export const fetchItems = async (): Promise<Item[]> => {
  const response = await fetch(`${API_BASE_URL}/items`);
  if (!response.ok) throw new Error("Failed to fetch items");
  const items = await response.json();
  return items.map(normalizeItem);
};

export const fetchFeaturedItems = async (): Promise<Item[]> => {
  const response = await fetch(`${API_BASE_URL}/items/featured`);
  if (!response.ok) throw new Error("Failed to fetch featured items");
  const items = await response.json();
  return items.map(normalizeItem);
};

export const fetchItemById = async (id: string): Promise<Item> => {
  const response = await fetch(`${API_BASE_URL}/items/${id}`);
  if (!response.ok) throw new Error("Failed to fetch item");
  const item = await response.json();
  return normalizeItem(item);
};

export const createItem = async (itemData: Partial<Item>): Promise<Item> => {
  const response = await fetch(`${API_BASE_URL}/items`, {
    method: "POST",
    headers: getJsonHeaders(),
    body: JSON.stringify(itemData),
  });
  if (!response.ok) throw new Error("Failed to create item");
  const item = await response.json();
  return normalizeItem(item);
};

export const updateItem = async (id: string, updateData: Partial<Item>): Promise<Item> => {
  const response = await fetch(`${API_BASE_URL}/items/${id}`, {
    method: "PUT",
    headers: getJsonHeaders(),
    body: JSON.stringify(updateData),
  });
  if (!response.ok) throw new Error("Failed to update item");
  const item = await response.json();
  return normalizeItem(item);
};

export const deleteItem = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/items/${id}`, {
    method: "DELETE",
    headers: getJsonHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to delete item");
  }
};

export const fetchUserItems = async (): Promise<Item[]> => {
  const response = await fetch(`${API_BASE_URL}/items/owner/me`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error("Failed to fetch your items");
  const items = await response.json();
  return items.map(normalizeItem);
};

// Borrow Request API
export const fetchBorrowRequests = async (): Promise<BorrowRequest[]> => {
  const response = await fetch(`${API_BASE_URL}/borrow-requests`);
  if (!response.ok) throw new Error("Failed to fetch borrow requests");
  return response.json();
};

export const fetchBorrowRequestById = async (id: string): Promise<BorrowRequest> => {
  const response = await fetch(`${API_BASE_URL}/borrow-requests/${id}`);
  if (!response.ok) throw new Error("Failed to fetch borrow request");
  const request = await response.json();
  return normalizeBorrowRequest(request);
};

export const fetchBorrowRequestsByBorrowerId = async (
  borrowerId: string
): Promise<BorrowRequest[]> => {
  const response = await fetch(`${API_BASE_URL}/borrow-requests/borrower/${borrowerId}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error("Failed to fetch your borrow requests");
  const requests = await response.json();
  return requests.map(normalizeBorrowRequest);
};

export const fetchBorrowRequestsByOwnerId = async (
  ownerId: string
): Promise<BorrowRequest[]> => {
  const response = await fetch(`${API_BASE_URL}/borrow-requests/owner/${ownerId}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error("Failed to fetch incoming requests");
  const requests = await response.json();
  return requests.map(normalizeBorrowRequest);
};

export const fetchBorrowerFeedbackByBorrowerId = async (
  borrowerId: string
): Promise<BorrowerFeedback[]> => {
  const response = await fetch(`${API_BASE_URL}/borrow-requests/borrower/${borrowerId}/public`);
  if (!response.ok) throw new Error("Failed to fetch borrower feedback");
  return response.json();
};

export const createBorrowRequest = async (
  requestData: Partial<BorrowRequest>
): Promise<BorrowRequest> => {
  const response = await fetch(`${API_BASE_URL}/borrow-requests`, {
    method: "POST",
    headers: getJsonHeaders(),
    body: JSON.stringify(requestData),
  });
  if (!response.ok) throw new Error("Failed to create borrow request");
  const request = await response.json();
  return normalizeBorrowRequest(request);
};

export const createReview = async (
  reviewData: Partial<Review>
): Promise<{ review: Review; ownerRating: number; reviewCount: number }> => {
  const response = await fetch(`${API_BASE_URL}/reviews`, {
    method: "POST",
    headers: getJsonHeaders(),
    body: JSON.stringify(reviewData),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to create review");
  }

  const result = await response.json();
  return {
    ...result,
    review: normalizeReview(result.review),
  };
};

export const fetchReviewsByItemId = async (itemId: string): Promise<Review[]> => {
  const response = await fetch(`${API_BASE_URL}/reviews/item/${itemId}`);
  if (!response.ok) throw new Error("Failed to fetch reviews");
  const reviews = await response.json();
  return reviews.map(normalizeReview);
};

export const fetchReviewThreadByItemId = async (itemId: string): Promise<Review[]> => {
  const response = await fetch(`${API_BASE_URL}/reviews/item/${itemId}/thread`);
  if (!response.ok) throw new Error("Failed to fetch review thread");
  const reviews = await response.json();
  return reviews.map(normalizeReview);
};

export const fetchReviewsByOwnerId = async (ownerId: string): Promise<Review[]> => {
  const response = await fetch(`${API_BASE_URL}/reviews/owner/${ownerId}`);
  if (!response.ok) throw new Error("Failed to fetch reviews");
  const reviews = await response.json();
  return reviews.map(normalizeReview);
};

export const fetchReviewsByReviewerId = async (reviewerId: string): Promise<Review[]> => {
  const response = await fetch(`${API_BASE_URL}/reviews/reviewer/${reviewerId}`);
  if (!response.ok) throw new Error("Failed to fetch reviews");
  const reviews = await response.json();
  return reviews.map(normalizeReview);
};

export const replyToReview = async (reviewId: string, content: string): Promise<Review> => {
  const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}/replies`, {
    method: "POST",
    headers: getJsonHeaders(),
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to reply to review");
  }

  const review = await response.json();
  return normalizeReview(review);
};

export const deleteReview = async (reviewId: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to delete review");
  }
};

export const updateBorrowRequest = async (
  id: string,
  updateData: Partial<BorrowRequest>
): Promise<BorrowRequest> => {
  const response = await fetch(`${API_BASE_URL}/borrow-requests/${id}`, {
    method: "PUT",
    headers: getJsonHeaders(),
    body: JSON.stringify(updateData),
  });
  if (!response.ok) throw new Error("Failed to update borrow request");
  const request = await response.json();
  return normalizeBorrowRequest(request);
};

// Notifications API
export const fetchNotifications = async (): Promise<Notification[]> => {
  const response = await fetch(`${API_BASE_URL}/notifications`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error("Failed to fetch notifications");
  return response.json();
};

export const fetchUnreadCount = async (): Promise<{ count: number }> => {
  const response = await fetch(`${API_BASE_URL}/notifications/unread-count`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error("Failed to fetch unread count");
  return response.json();
};

export const markNotificationAsRead = async (id: string): Promise<Notification> => {
  const response = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
    method: "PATCH",
    headers: getJsonHeaders(),
  });
  if (!response.ok) throw new Error("Failed to mark notification as read");
  return response.json();
};

export const markAllNotificationsAsRead = async (): Promise<{ modifiedCount: number }> => {
  const response = await fetch(`${API_BASE_URL}/notifications/mark-all-read`, {
    method: "POST",
    headers: getJsonHeaders(),
  });
  if (!response.ok) throw new Error("Failed to mark all notifications as read");
  return response.json();
};

export const deleteNotification = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/notifications/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error("Failed to delete notification");
};

export interface Notification {
  _id?: string;
  id?: string;
  userId: string;
  type:
    | 'borrow_request_submitted'
    | 'borrow_request'
    | 'request_approved'
    | 'request_rejected'
    | 'item_returned'
    | 'new_review'
    | 'listing_submitted'
    | 'listing_approved'
    | 'listing_rejected'
    | 'system';
  title: string;
  message: string;
  referenceId?: string;
  referenceType?: 'borrowRequest' | 'item' | 'review';
  read: boolean;
  createdAt: string;
  updatedAt: string;
}
