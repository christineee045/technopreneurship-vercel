import mongoose, { Schema, Document } from "mongoose";

export interface IReviewReply {
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  createdAt: Date;
}

export interface IReview extends Document {
  itemId: string;
  itemTitle: string;
  reviewerId: string;
  reviewerName: string;
  reviewerAvatar?: string;
  ownerId: string;
  ownerName: string;
  rating: number;
  comment: string;
  ownerReply?: string;
  ownerReplyAt?: Date;
  replies: IReviewReply[];
  createdAt: Date;
  updatedAt: Date;
}

const reviewReplySchema = new Schema<IReviewReply>(
  {
    authorId: { type: String, required: true },
    authorName: { type: String, required: true },
    authorAvatar: { type: String },
    content: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const reviewSchema = new Schema<IReview>(
  {
    itemId: { type: String, required: true },
    itemTitle: { type: String, required: true },
    reviewerId: { type: String, required: true },
    reviewerName: { type: String, required: true },
    reviewerAvatar: { type: String },
    ownerId: { type: String, required: true },
    ownerName: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true },
    ownerReply: { type: String, trim: true },
    ownerReplyAt: { type: Date },
    replies: { type: [reviewReplySchema], default: [] },
  },
  { timestamps: true }
);

const Review = mongoose.model<IReview>("Review", reviewSchema);

export default Review;