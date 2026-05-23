import mongoose, { Schema, Document } from "mongoose";

export interface IBorrowRequest extends Document {
  itemId: string;
  itemTitle: string;
  itemImage: string;
  borrowerId: string;
  borrowerName: string;
  borrowerAvatar?: string;
  ownerId: string;
  ownerName: string;
  startDate: string;
  endDate: string;
  status: "Pending" | "Approved" | "Rejected" | "Active" | "Returned" | "Reported" | "Overdue";
  message?: string;
  borrowerRating?: number;
  borrowerFeedback?: string;
  reportReason?: string;
  returnedAt?: string;
  createdAt: Date;
  updatedAt: Date;
}

const borrowRequestSchema = new Schema<IBorrowRequest>(
  {
    itemId: {
      type: String,
      required: true,
    },
    itemTitle: {
      type: String,
      required: true,
    },
    itemImage: {
      type: String,
      required: true,
    },
    borrowerId: {
      type: String,
      required: true,
    },
    borrowerName: {
      type: String,
      required: true,
    },
    borrowerAvatar: {
      type: String,
    },
    ownerId: {
      type: String,
      required: true,
    },
    ownerName: {
      type: String,
      required: true,
    },
    startDate: {
      type: String,
      required: true,
    },
    endDate: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Active", "Returned", "Reported", "Overdue"],
      default: "Pending",
    },
    message: {
      type: String,
    },
    borrowerRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    borrowerFeedback: {
      type: String,
      trim: true,
    },
    reportReason: {
      type: String,
      trim: true,
    },
    returnedAt: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const BorrowRequest = mongoose.model<IBorrowRequest>("BorrowRequest", borrowRequestSchema);

export default BorrowRequest;
