import type { Request, Response } from "express";
import Item from "../models/Item";
import BorrowRequest from "../models/BorrowRequest";
import User from "../models/User";
import {
  createReview,
  deleteReview,
  getReviewsByItemId,
  getReviewsByOwnerId,
  getReviewsByReviewerId,
  replyToReview,
} from "../services/review.service";

export const createReviewHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user?.id || !user?.name) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { itemId, rating, comment } = req.body;
    const normalizedItemId = Array.isArray(itemId) ? itemId[0] : itemId;

    if (!normalizedItemId || rating == null || !comment?.trim()) {
      res.status(400).json({ message: "itemId, rating, and comment are required" });
      return;
    }

    const item = await Item.findById(normalizedItemId);
    if (!item) {
      res.status(404).json({ message: "Item not found" });
      return;
    }

    // Verify that the reviewer has borrowed this item (has an approved/completed request)
    const borrowRequests = await BorrowRequest.find({
      itemId: normalizedItemId,
      borrowerId: user.id,
      status: { $in: ["Approved", "Active", "Returned"] },
    });

    if (borrowRequests.length === 0) {
      res.status(403).json({ message: "You must borrow this item before leaving a review" });
      return;
    }

    const currentUser = await User.findById(user.id).select("avatar").lean();

    const review = await createReview({
      itemId: item.id,
      itemTitle: item.title,
      reviewerId: user.id,
      reviewerName: user.name,
      reviewerAvatar: currentUser?.avatar,
      ownerId: item.ownerId,
      ownerName: item.ownerName,
      rating: Number(rating),
      comment: comment.trim(),
    });

    const reviews = await getReviewsByOwnerId(item.ownerId);
    const reviewCount = reviews.length;
    const averageRating =
      reviewCount === 0
        ? 0
        : reviews.reduce((sum, currentReview) => sum + currentReview.rating, 0) / reviewCount;

    res.status(201).json({
      review,
      ownerRating: Number(averageRating.toFixed(1)),
      reviewCount,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to create review", error });
  }
};

export const getReviewsByItemIdHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { itemId } = req.params;
    const resolvedItemId = Array.isArray(itemId) ? itemId[0] : itemId;

    if (!resolvedItemId) {
      res.status(400).json({ message: "Invalid item id" });
      return;
    }

    const reviews = await getReviewsByItemId(resolvedItemId);
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch reviews", error });
  }
};

export const getReviewsByOwnerIdHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ownerId } = req.params;
    const resolvedOwnerId = Array.isArray(ownerId) ? ownerId[0] : ownerId;

    if (!resolvedOwnerId) {
      res.status(400).json({ message: "Invalid owner id" });
      return;
    }

    const reviews = await getReviewsByOwnerId(resolvedOwnerId);
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch reviews", error });
  }
};

export const getReviewsByReviewerIdHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { reviewerId } = req.params;
    const resolvedReviewerId = Array.isArray(reviewerId) ? reviewerId[0] : reviewerId;

    if (!resolvedReviewerId) {
      res.status(400).json({ message: "Invalid reviewer id" });
      return;
    }

    const reviews = await getReviewsByReviewerId(resolvedReviewerId);
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch reviews", error });
  }
};

export const replyToReviewHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user?.id) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { reviewId } = req.params;
    const resolvedReviewId = Array.isArray(reviewId) ? reviewId[0] : reviewId;
    const { content, ownerReply } = req.body;
    const replyContent = typeof content === "string" ? content : ownerReply;

    if (!resolvedReviewId || !replyContent?.trim()) {
      res.status(400).json({ message: "reviewId and content are required" });
      return;
    }

    const currentUser = await User.findById(user.id).select("avatar name").lean();
    const updatedReview = await replyToReview(resolvedReviewId, {
      id: user.id,
      name: currentUser?.name || user.name,
      avatar: currentUser?.avatar,
    }, replyContent);
    if (!updatedReview) {
      res.status(404).json({ message: "Review not found" });
      return;
    }

    res.json(updatedReview);
  } catch (error) {
    if (error instanceof Error && error.message === "You cannot reply to your own review") {
      res.status(403).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: "Failed to reply to review", error });
  }
};

export const deleteReviewHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { reviewId } = req.params;
    const resolvedReviewId = Array.isArray(reviewId) ? reviewId[0] : reviewId;

    if (!resolvedReviewId) {
      res.status(400).json({ message: "reviewId is required" });
      return;
    }

    const success = await deleteReview(resolvedReviewId);

    if (!success) {
      res.status(404).json({ message: "Review not found" });
      return;
    }

    res.json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({ message: "Failed to delete review", error: error instanceof Error ? error.message : "Unknown error" });
  }
};
