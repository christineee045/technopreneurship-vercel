import { Request, Response } from "express";
import {
  getAdminUsers,
  getAdminListings,
  getAdminBorrowRequests,
  getAdminOverdueItems,
  getAdminDisputes,
  getCategoryStats,
  getBorrowVolumeData,
  getTopLenders,
  getAdminStats,
  getDashboardData,
  updateListingApprovalStatus,
} from "../services/admin.service";
import { createNotification } from "../services/notification.service";

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await getAdminUsers();
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching admin users:", error);
    res.status(500).json({ message: "Failed to fetch admin users" });
  }
};

export const getListings = async (req: Request, res: Response) => {
  try {
    const listings = await getAdminListings();
    res.status(200).json(listings);
  } catch (error) {
    console.error("Error fetching admin listings:", error);
    res.status(500).json({ message: "Failed to fetch admin listings" });
  }
};

export const approveListing = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const itemId = Array.isArray(id) ? id[0] : id;

    if (!itemId) {
      res.status(400).json({ message: "Invalid listing id" });
      return;
    }

    const listing = await updateListingApprovalStatus(itemId, "approved");
    if (!listing) {
      res.status(404).json({ message: "Listing not found" });
      return;
    }

    await createNotification({
      userId: listing.ownerId,
      type: "listing_approved",
      title: "Listing Approved",
      message: `Your listing \"${listing.title}\" has been approved and published.`,
      referenceId: listing._id?.toString(),
      referenceType: "item",
    });

    res.status(200).json(listing);
  } catch (error) {
    console.error("Error approving listing:", error);
    res.status(500).json({ message: "Failed to approve listing" });
  }
};

export const rejectListing = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const itemId = Array.isArray(id) ? id[0] : id;

    if (!itemId) {
      res.status(400).json({ message: "Invalid listing id" });
      return;
    }

    const listing = await updateListingApprovalStatus(itemId, "rejected");
    if (!listing) {
      res.status(404).json({ message: "Listing not found" });
      return;
    }

    await createNotification({
      userId: listing.ownerId,
      type: "listing_rejected",
      title: "Listing Rejected",
      message: `Your listing \"${listing.title}\" was not approved for publication. Please revise the details and resubmit it.`,
      referenceId: listing._id?.toString(),
      referenceType: "item",
    });

    res.status(200).json(listing);
  } catch (error) {
    console.error("Error rejecting listing:", error);
    res.status(500).json({ message: "Failed to reject listing" });
  }
};

export const getBorrowRequests = async (req: Request, res: Response) => {
  try {
    const requests = await getAdminBorrowRequests();
    res.status(200).json(requests);
  } catch (error) {
    console.error("Error fetching admin borrow requests:", error);
    res.status(500).json({ message: "Failed to fetch admin borrow requests" });
  }
};

export const getOverdueItems = async (req: Request, res: Response) => {
  try {
    const overdueItems = await getAdminOverdueItems();
    res.status(200).json(overdueItems);
  } catch (error) {
    console.error("Error fetching overdue items:", error);
    res.status(500).json({ message: "Failed to fetch overdue items" });
  }
};

export const getDisputes = async (req: Request, res: Response) => {
  try {
    const disputes = await getAdminDisputes();
    res.status(200).json(disputes);
  } catch (error) {
    console.error("Error fetching disputes:", error);
    res.status(500).json({ message: "Failed to fetch disputes" });
  }
};

export const getCategoryStatsController = async (req: Request, res: Response) => {
  try {
    const stats = await getCategoryStats();
    res.status(200).json(stats);
  } catch (error) {
    console.error("Error fetching category stats:", error);
    res.status(500).json({ message: "Failed to fetch category stats" });
  }
};

export const getBorrowVolumeDataController = async (req: Request, res: Response) => {
  try {
    const data = await getBorrowVolumeData();
    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching borrow volume data:", error);
    res.status(500).json({ message: "Failed to fetch borrow volume data" });
  }
};

export const getTopLendersController = async (req: Request, res: Response) => {
  try {
    const lenders = await getTopLenders();
    res.status(200).json(lenders);
  } catch (error) {
    console.error("Error fetching top lenders:", error);
    res.status(500).json({ message: "Failed to fetch top lenders" });
  }
};

export const getStats = async (req: Request, res: Response) => {
  try {
    const stats = await getAdminStats();
    res.status(200).json(stats);
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    res.status(500).json({ message: "Failed to fetch admin stats" });
  }
};

export const getDashboard = async (req: Request, res: Response) => {
  try {
    const data = await getDashboardData();
    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    res.status(500).json({ message: "Failed to fetch dashboard data" });
  }
};
