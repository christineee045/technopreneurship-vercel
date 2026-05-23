import User from "../models/User";
import Item from "../models/Item";
import BorrowRequest from "../models/BorrowRequest";

const makeEmail = (name: string, id: string) => {
  const base = name
    .toLowerCase()
    .replace(/[^a-z]+/g, ".")
    .replace(/^\.|\.$/g, "");
  return `${base || "user"}.${id}@example.com`;
};

const daysSince = (dateStr: string | Date) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
};

export const getAdminUsers = async () => {
  const items = await Item.find();
  const requests = await BorrowRequest.find();
  const users = await User.find();

  const usersById = new Map<
    string,
    {
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
  >();

  const ensureUser = (
    id: string,
    name: string,
    avatar: string | undefined,
    rating: number,
    joinDate: string
  ) => {
    if (!id) return;
    if (!usersById.has(id)) {
      usersById.set(id, {
        id,
        name,
        email: makeEmail(name, id),
        phone: "+63 900 000 0000",
        avatar,
        joinDate,
        listings: 0,
        borrowRequests: 0,
        status: "active",
        verified: rating >= 4.8,
        trustScore: rating || 4.5,
      });
    }
  };

  items.forEach((item: any) => {
    ensureUser(item.ownerId, item.ownerName, item.ownerAvatar, item.ownerRating, item.createdAt);
    const owner = usersById.get(item.ownerId);
    if (owner) {
      owner.listings += 1;
    }
  });

  requests.forEach((request: any) => {
    ensureUser(request.borrowerId, request.borrowerName, request.borrowerAvatar, 4.6, request.createdAt);
    ensureUser(request.ownerId, request.ownerName, undefined, 4.7, request.createdAt);
    const borrower = usersById.get(request.borrowerId);
    if (borrower) {
      borrower.borrowRequests += 1;
    }
  });

  return Array.from(usersById.values());
};

export const getAdminListings = async () => {
  const items = await Item.find();
  const requests = await BorrowRequest.find();

  return items.map((item: any) => {
    const borrowCount = requests.filter((request: any) => request.itemId === item._id.toString()).length;
    return {
      id: item._id.toString(),
      title: item.title,
      category: item.category,
      owner: item.ownerName,
      ownerId: item.ownerId,
      deposit: item.deposit,
      dailyRate: item.rentalFeePerDay,
      image: item.images[0] || "",
      status: item.approvalStatus || "approved",
      featured: item.isFeatured || false,
      createdDate: item.createdAt,
      borrowCount,
      rating: item.ownerRating,
    };
  });
};

export const updateListingApprovalStatus = async (
  itemId: string,
  approvalStatus: 'pending' | 'approved' | 'rejected'
) => {
  return Item.findByIdAndUpdate(itemId, { approvalStatus }, { new: true });
};

export const getAdminBorrowRequests = async () => {
  const requests = await BorrowRequest.find();
  const items = await Item.find();

  const itemMap = new Map();
  items.forEach((item: any) => {
    itemMap.set(item._id.toString(), item);
  });

  return requests.map((request: any) => {
    const item = itemMap.get(request.itemId);
    return {
      id: `BR-${request._id.toString()}`,
      itemTitle: request.itemTitle,
      itemId: request.itemId,
      itemImage: request.itemImage,
      borrower: request.borrowerName,
      borrowerId: request.borrowerId,
      lender: request.ownerName,
      lenderId: request.ownerId,
      borrowerAvatar: request.borrowerAvatar,
      startDate: request.startDate,
      endDate: request.endDate,
      status: request.status,
      deposit: item?.deposit || 0,
      createdAt: request.createdAt,
      message: request.message,
    };
  });
};

export const getAdminOverdueItems = async () => {
  const requests = await BorrowRequest.find();
  const items = await Item.find();

  const itemMap = new Map();
  items.forEach((item: any) => {
    itemMap.set(item._id.toString(), item);
  });

  return requests
    .filter((request: any) => request.status === "Overdue")
    .map((request: any, index: number) => {
      const item = itemMap.get(request.itemId);
      const daysOverdue = daysSince(request.endDate);
      const flagColor = daysOverdue > 5 ? "red" : daysOverdue > 2 ? "orange" : "yellow";
      return {
        id: `OD-${index + 1}`,
        itemName: request.itemTitle,
        borrower: request.borrowerName,
        borrowerId: request.borrowerId,
        avatar: request.borrowerAvatar,
        dueDate: request.endDate,
        daysOverdue,
        flagColor,
        deposit: item?.deposit || 0,
      };
    });
};

export const getAdminDisputes = async () => {
  const requests = await BorrowRequest.find();

  return requests
    .filter((request: any) => request.status === "Reported" || request.reportReason)
    .map((request: any, index: number) => {
    const severity = request.reportReason?.toLowerCase().includes("damage") ? "High" : index === 0 ? "High" : "Medium";
    return {
      id: `D-${request._id.toString()}`,
      title: request.reportReason || (index === 0 ? "Item Returned Damaged" : "Late Return Without Communication"),
      itemTitle: request.itemTitle,
      reporter: request.ownerName,
      reporterId: request.ownerId,
      defendant: request.borrowerName,
      defendantId: request.borrowerId,
      reportDate: request.createdAt,
      status: request.status === "Reported" ? "Open" : "In Progress",
      severity,
      description: request.reportReason || (index === 0
        ? "Reported damage on return. Awaiting verification."
        : "Borrower has not responded to return reminders."),
      adminNotes: request.borrowerFeedback || "",
    };
    });
};

export const getCategoryStats = async () => {
  const items = await Item.find();

  const categoryCounts = items.reduce<Record<string, number>>((acc, item: any) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(categoryCounts).map(([name, value]) => ({
    name,
    value,
  }));
};

export const getBorrowVolumeData = async () => {
  const requests = await BorrowRequest.find();

  const totalRequests = requests.length;
  const returnedRequests = requests.filter((request: any) => request.status === "Returned").length;

  return Array.from({ length: 6 }, (_, idx) => {
    const factor = (idx + 1) / 6;
    return {
      week: `Week ${idx + 1}`,
      volume: Math.round(totalRequests * factor),
      returned: Math.round(returnedRequests * factor),
    };
  });
};

export const getTopLenders = async () => {
  const items = await Item.find();

  const lenderStats = items.reduce<
    Record<string, { name: string; listings: number; trustScore: number }>
  >((acc, item: any) => {
    if (!acc[item.ownerId]) {
      acc[item.ownerId] = { name: item.ownerName, listings: 0, trustScore: item.ownerRating };
    }
    acc[item.ownerId].listings += 1;
    return acc;
  }, {});

  return Object.values(lenderStats)
    .sort((a, b) => b.listings - a.listings)
    .slice(0, 4)
    .map((lender, idx) => ({
      ...lender,
      earnings: `₱${(lender.listings * 4200 + idx * 1500).toLocaleString()}`,
    }));
};

// Combined dashboard data — single DB pass for all dashboard widgets
export const getDashboardData = async () => {
  const [items, requests, users] = await Promise.all([
    Item.find(),
    BorrowRequest.find(),
    User.find(),
  ]);

  // --- Stats ---
  const totalUsers = users.length;
  const activeListings = items.filter((item) => item.available).length;
  const featuredListings = items.filter((item) => item.isFeatured).length;
  const pendingRequests = requests.filter((req) => req.status === "Pending").length;
  const returnedThisWeek = requests.filter((req) => req.status === "Returned").length;
  const totalBorrowVolume = requests.length;
  const overdueItems = requests.filter((req) => req.status === "Overdue").length;
  const disputes = requests.filter((req) => req.status === "Reported" || req.reportReason).length;
  const newUsersThisWeek = Math.min(12, totalUsers);

  const stats = {
    totalUsers,
    activeListings,
    pendingRequests,
    overdueItems,
    featuredListings,
    disputes,
    newUsersThisWeek,
    totalBorrowVolume,
    returnedThisWeek,
  };

  // --- Category stats ---
  const categoryCounts = items.reduce<Record<string, number>>((acc, item: any) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {});
  const categoryStats = Object.entries(categoryCounts).map(([name, value]) => ({ name, value }));

  // --- Borrow volume ---
  const borrowVolume = Array.from({ length: 6 }, (_, idx) => {
    const factor = (idx + 1) / 6;
    return {
      week: `Week ${idx + 1}`,
      volume: Math.round(totalBorrowVolume * factor),
      returned: Math.round(returnedThisWeek * factor),
    };
  });

  // --- Top lenders ---
  const lenderMap = items.reduce<
    Record<string, { name: string; listings: number; trustScore: number }>
  >((acc, item: any) => {
    if (!acc[item.ownerId]) {
      acc[item.ownerId] = { name: item.ownerName, listings: 0, trustScore: item.ownerRating };
    }
    acc[item.ownerId].listings += 1;
    return acc;
  }, {});

  const topLenders = Object.values(lenderMap)
    .sort((a, b) => b.listings - a.listings)
    .slice(0, 4)
    .map((lender, idx) => ({
      ...lender,
      earnings: `₱${(lender.listings * 4200 + idx * 1500).toLocaleString()}`,
    }));

  return { stats, categoryStats, borrowVolume, topLenders };
};

export const getAdminStats = async () => {
  // Single pass: fetch all data once
  const [items, requests, users] = await Promise.all([
    Item.find(),
    BorrowRequest.find(),
    User.find(),
  ]);

  const totalUsers = users.length;
  const activeListings = items.filter((item) => item.available).length;
  const featuredListings = items.filter((item) => item.isFeatured).length;
  const pendingRequests = requests.filter((req) => req.status === "Pending").length;
  const returnedThisWeek = requests.filter((req) => req.status === "Returned").length;
  const totalBorrowVolume = requests.length;
  const overdueItems = requests.filter((req) => req.status === "Overdue").length;
  const disputes = requests.filter((req) => req.status === "Reported" || req.reportReason).length;
  const newUsersThisWeek = Math.min(12, totalUsers);

  return {
    totalUsers,
    activeListings,
    pendingRequests,
    overdueItems,
    featuredListings,
    disputes,
    newUsersThisWeek,
    totalBorrowVolume,
    returnedThisWeek,
  };
};
