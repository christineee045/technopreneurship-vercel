const API_BASE_URL = "http://localhost:5000/api/admin";
const AUTH_BASE_URL = "http://localhost:5000/api/auth";

const ADMIN_TOKEN_KEY = "adminToken";

let dashboardCache: {
  stats: any;
  categoryStats: any;
  borrowVolume: any;
  topLenders: any;
} | null = null;
let dashboardCacheTime = 0;
const DASHBOARD_CACHE_TTL = 60000; // 60 seconds

const getAuthHeaders = () => {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY);

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

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  isAdmin: boolean;
  joinDate: string;
  rating: number;
  reviewCount: number;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export const loginAdmin = async (email: string, password: string): Promise<AuthResponse> => {
  const response = await fetch(`${AUTH_BASE_URL}/login`, {
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

export const fetchCurrentAdminWithToken = async (token: string): Promise<AuthUser> => {
  const response = await fetch(`${AUTH_BASE_URL}/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to load current admin user");
  }

  return response.json();
};

// Admin User Type
export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  joinDate: string;
  listings: number;
  borrowRequests: number;
  status: "active" | "suspended";
  verified: boolean;
  trustScore: number;
}

// Admin Listing Type
export interface AdminListing {
  id: string;
  title: string;
  category: string;
  owner: string;
  ownerId: string;
  deposit: number;
  dailyRate: number;
  image: string;
  status: "approved" | "pending" | "rejected";
  featured: boolean;
  createdDate: string;
  borrowCount: number;
  rating: number;
}

// Admin Borrow Request Type
export interface AdminBorrowRequest {
  id: string;
  itemTitle: string;
  itemId: string;
  itemImage: string;
  borrower: string;
  borrowerId: string;
  lender: string;
  lenderId: string;
  borrowerAvatar: string;
  startDate: string;
  endDate: string;
  status: string;
  deposit: number;
  createdAt: string;
  message: string;
}

// Overdue Item Type
export interface OverdueItem {
  id: string;
  itemName: string;
  borrower: string;
  borrowerId: string;
  avatar: string;
  dueDate: string;
  daysOverdue: number;
  flagColor: "red" | "orange" | "yellow";
  deposit: number;
}

// Dispute Type
export interface Dispute {
  id: string;
  title: string;
  itemTitle: string;
  reporter: string;
  reporterId: string;
  defendant: string;
  defendantId: string;
  reportDate: string;
  status: "Open" | "In Progress" | "Resolved" | "Escalated";
  severity: "High" | "Medium" | "Low";
  description: string;
  adminNotes: string;
}

// Category Stats Type
export interface CategoryStat {
  name: string;
  value: number;
}

// Borrow Volume Type
export interface BorrowVolume {
  week: string;
  volume: number;
  returned: number;
}

// Top Lender Type
export interface TopLender {
  name: string;
  listings: number;
  trustScore: number;
  earnings: string;
}

// Admin Stats Type
export interface AdminStats {
  totalUsers: number;
  activeListings: number;
  pendingRequests: number;
  overdueItems: number;
  featuredListings: number;
  disputes: number;
  newUsersThisWeek: number;
  totalBorrowVolume: number;
  returnedThisWeek: number;
}

// Fetch Functions
export const fetchAdminUsers = async (): Promise<AdminUser[]> => {
  const response = await fetch(`${API_BASE_URL}/users`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error("Failed to fetch admin users");
  return response.json();
};

export const fetchAdminListings = async (): Promise<AdminListing[]> => {
  const response = await fetch(`${API_BASE_URL}/listings`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error("Failed to fetch admin listings");
  return response.json();
};

export const approveAdminListing = async (id: string): Promise<AdminListing> => {
  const response = await fetch(`${API_BASE_URL}/listings/${id}/approve`, {
    method: "POST",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to approve listing");
  }

  return response.json();
};

export const rejectAdminListing = async (id: string): Promise<AdminListing> => {
  const response = await fetch(`${API_BASE_URL}/listings/${id}/reject`, {
    method: "POST",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to reject listing");
  }

  return response.json();
};

export const fetchAdminBorrowRequests = async (): Promise<AdminBorrowRequest[]> => {
  const response = await fetch(`${API_BASE_URL}/borrow-requests`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error("Failed to fetch admin borrow requests");
  return response.json();
};

export const fetchOverdueItems = async (): Promise<OverdueItem[]> => {
  const response = await fetch(`${API_BASE_URL}/overdue-items`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error("Failed to fetch overdue items");
  return response.json();
};

export const fetchDisputes = async (): Promise<Dispute[]> => {
  const response = await fetch(`${API_BASE_URL}/disputes`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error("Failed to fetch disputes");
  return response.json();
};

export const fetchCategoryStats = async (): Promise<CategoryStat[]> => {
  const response = await fetch(`${API_BASE_URL}/category-stats`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error("Failed to fetch category stats");
  return response.json();
};

export const fetchBorrowVolume = async (): Promise<BorrowVolume[]> => {
  const response = await fetch(`${API_BASE_URL}/borrow-volume`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error("Failed to fetch borrow volume");
  return response.json();
};

export const fetchTopLenders = async (): Promise<TopLender[]> => {
  const response = await fetch(`${API_BASE_URL}/top-lenders`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error("Failed to fetch top lenders");
  return response.json();
};

export const fetchAdminStats = async (): Promise<AdminStats> => {
  const response = await fetch(`${API_BASE_URL}/stats`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error("Failed to fetch admin stats");
  return response.json();
};

export interface DashboardData {
  stats: AdminStats;
  categoryStats: CategoryStat[];
  borrowVolume: BorrowVolume[];
  topLenders: TopLender[];
}

export const fetchDashboardData = async (): Promise<DashboardData> => {
  const now = Date.now();
  if (dashboardCache && now - dashboardCacheTime < DASHBOARD_CACHE_TTL) {
    return dashboardCache;
  }

  const response = await fetch(`${API_BASE_URL}/dashboard`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error("Failed to fetch dashboard data");

  const data = await response.json();
  dashboardCache = data;
  dashboardCacheTime = now;
  return data;
};
