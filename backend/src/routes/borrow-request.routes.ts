import { Router } from "express";
import {
  createBorrowRequestHandler,
  getBorrowRequestsHandler,
  getBorrowRequestByIdHandler,
  getBorrowRequestsByBorrowerIdHandler,
  getBorrowRequestsByOwnerIdHandler,
  getPublicBorrowerFeedbackHandler,
  updateBorrowRequestHandler,
} from "../controllers/borrow-request.controller";
import { authenticateToken } from "../middleware/auth";

const router = Router();

// Protected: only admins can see all requests (add requireAdmin if needed)
router.get("/", authenticateToken, getBorrowRequestsHandler);
router.post("/", authenticateToken, createBorrowRequestHandler);
router.get("/borrower/:borrowerId/public", getPublicBorrowerFeedbackHandler);
router.get("/borrower/:borrowerId", authenticateToken, getBorrowRequestsByBorrowerIdHandler);
router.get("/owner/:ownerId", authenticateToken, getBorrowRequestsByOwnerIdHandler);
router.get("/:id", getBorrowRequestByIdHandler);
router.put("/:id", authenticateToken, updateBorrowRequestHandler);

export default router;
