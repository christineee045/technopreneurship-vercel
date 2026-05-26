import Review, { IReview } from "../models/Review";
import Item from "../models/Item";
import User from "../models/User";
import { createNotification } from "./notification.service";

const visibleReviewFilter = { isHidden: { $ne: true } };

const populateReviewAvatars = async (reviews: IReview[]): Promise<IReview[]> => {
  const userIds = new Set<string>();

  reviews.forEach((review) => {
    if (review.reviewerId && !review.reviewerAvatar) {
      userIds.add(review.reviewerId);
    }

    review.replies.forEach((reply) => {
      if (reply.authorId && !reply.authorAvatar) {
        userIds.add(reply.authorId);
      }
    });
  });

  if (userIds.size === 0) {
    return reviews;
  }

  const users = await User.find({ _id: { $in: Array.from(userIds) } }).select("avatar").lean();
  const avatarMap = new Map(users.map((user) => [user._id.toString(), user.avatar || ""]));

  return reviews.map((review) => {
    const plainReview = review.toObject();

    return {
      ...plainReview,
      reviewerAvatar: plainReview.reviewerAvatar || avatarMap.get(plainReview.reviewerId) || "",
      replies: plainReview.replies.map((reply: IReview["replies"][number]) => ({
        ...reply,
        authorAvatar: reply.authorAvatar || avatarMap.get(reply.authorId) || "",
      })),
    } as IReview;
  });
};

export const getOwnerReviewStats = async (ownerId: string): Promise<{ reviewCount: number; rating: number }> => {
  const ownerReviews = await Review.find({ ownerId, ...visibleReviewFilter });
  const reviewCount = ownerReviews.length;
  const averageRating =
    reviewCount === 0
      ? 0
      : ownerReviews.reduce((sum, currentReview) => sum + currentReview.rating, 0) / reviewCount;

  return {
    reviewCount,
    rating: Number(averageRating.toFixed(1)),
  };
};

const recalculateOwnerReviewStats = async (ownerId: string) => {
  const { reviewCount, rating } = await getOwnerReviewStats(ownerId);

  await User.findByIdAndUpdate(ownerId, {
    rating,
    reviewCount,
  });

  await Item.updateMany({ ownerId }, { ownerRating: rating });
};

export const createReview = async (reviewData: Partial<IReview>): Promise<IReview> => {
  const review = await Review.create(reviewData);

  await recalculateOwnerReviewStats(review.ownerId);

  return review;
};

export const getReviewsByOwnerId = async (ownerId: string): Promise<IReview[]> => {
  const reviews = await Review.find({ ownerId, ...visibleReviewFilter }).sort({ createdAt: -1 });
  return populateReviewAvatars(reviews);
};

export const getReviewsByReviewerId = async (reviewerId: string): Promise<IReview[]> => {
  const reviews = await Review.find({ reviewerId, ...visibleReviewFilter }).sort({ createdAt: -1 });
  return populateReviewAvatars(reviews);
};

export const getReviewsByItemId = async (itemId: string): Promise<IReview[]> => {
  const reviews = await Review.find({ itemId, ...visibleReviewFilter }).sort({ createdAt: -1 });
  return populateReviewAvatars(reviews);
};

export const getAllReviews = async (): Promise<Array<IReview & { category?: string }>> => {
  const [reviews, items] = await Promise.all([
    Review.find().sort({ createdAt: -1 }),
    Item.find().select("category").lean(),
  ]);

  const categoryByItemId = new Map(items.map((item: any) => [item._id.toString(), item.category || ""]));
  const withAvatars = await populateReviewAvatars(reviews);

  return withAvatars.map((review) => ({
    ...review,
    category: categoryByItemId.get(review.itemId) || "",
  }));
};

export const replyToReview = async (
  reviewId: string,
  author: { id: string; name: string; avatar?: string },
  content: string
): Promise<IReview | null> => {
  const review = await Review.findById(reviewId);
  if (!review) return null;

  if (review.reviewerId === author.id) {
    throw new Error("You cannot reply to your own review");
  }

  const reply = {
    authorId: author.id,
    authorName: author.name,
    authorAvatar: author.avatar,
    content: content.trim(),
    createdAt: new Date(),
  };

  review.replies.push(reply);

  if (review.ownerId === author.id) {
    review.ownerReply = content.trim();
    review.ownerReplyAt = reply.createdAt;
  }

  await review.save();

  if (review.reviewerId !== author.id) {
    await createNotification({
      userId: review.reviewerId,
      type: "new_review",
      title: `Reply on ${review.itemTitle}`,
      message: `${author.name} replied to your review.`,
      referenceId: review.id,
      referenceType: "review",
    });
  }

  return review;
};

export const deleteReview = async (reviewId: string): Promise<boolean> => {
  // Find the review first to get the ownerId
  const review = await Review.findById(reviewId);
  if (!review) {
    return false;
  }

  const ownerId = review.ownerId;

  // Delete the review
  await Review.findByIdAndDelete(reviewId);

  // Recalculate the owner's rating and review count based on remaining reviews
  await recalculateOwnerReviewStats(ownerId);

  return true;
};

export const updateReviewVisibility = async (reviewId: string, isHidden: boolean): Promise<IReview | null> => {
  const review = await Review.findById(reviewId);
  if (!review) {
    return null;
  }

  review.isHidden = isHidden;
  await review.save();

  await recalculateOwnerReviewStats(review.ownerId);

  return review;
};