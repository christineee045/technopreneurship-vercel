import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import {
  createReviewHandler,
  getReviewsByItemIdHandler,
  getReviewsByOwnerIdHandler,
  getReviewsByReviewerIdHandler,
  replyToReviewHandler,
  deleteReviewHandler,
} from "../controllers/review.controller";

const router = Router();

router.get("/item/:itemId", getReviewsByItemIdHandler);
router.get("/item/:itemId/thread", getReviewsByItemIdHandler);
router.get("/owner/:ownerId", getReviewsByOwnerIdHandler);
router.get("/reviewer/:reviewerId", getReviewsByReviewerIdHandler);
router.post("/", authenticateToken, createReviewHandler);
router.post("/:reviewId/replies", authenticateToken, replyToReviewHandler);
router.put("/:reviewId/reply", authenticateToken, replyToReviewHandler);
router.delete("/:reviewId", authenticateToken, deleteReviewHandler);

export default router;