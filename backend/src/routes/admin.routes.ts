import { Router } from "express";
import {
  getUsers,
  getListings,
  getBorrowRequests,
  getOverdueItems,
  getDisputes,
  getCategoryStatsController,
  getBorrowVolumeDataController,
  getTopLendersController,
  getStats,
  getDashboard,
  approveListing,
  rejectListing,
} from "../controllers/admin.controller";
import { authenticateToken, requireAdmin } from "../middleware/auth";

const router = Router();

router.use(authenticateToken, requireAdmin);

router.get("/users", getUsers);
router.get("/listings", getListings);
router.post("/listings/:id/approve", approveListing);
router.post("/listings/:id/reject", rejectListing);
router.get("/borrow-requests", getBorrowRequests);
router.get("/overdue-items", getOverdueItems);
router.get("/disputes", getDisputes);
router.get("/category-stats", getCategoryStatsController);
router.get("/borrow-volume", getBorrowVolumeDataController);
router.get("/top-lenders", getTopLendersController);
router.get("/stats", getStats);
router.get("/dashboard", getDashboard);

export default router;
