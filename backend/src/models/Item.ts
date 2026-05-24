import mongoose, { Schema, Document } from "mongoose";

export interface IItem extends Document {
  title: string;
  description: string;
  category: string;
  condition: "New" | "Excellent" | "Good" | "Fair";
  rentalFeePerDay: number;
  deposit: number;
  images: string[];
  ownerId: string;
  ownerName: string;
  ownerAvatar?: string;
  ownerEmail?: string;
  ownerPhone?: string;
  ownerRating: number;
  location: string;
  available: boolean;
  isFeatured?: boolean;
  approvalStatus?: "pending" | "approved" | "rejected";
  createdAt: Date;
  updatedAt: Date;
  estimatedAvailableAt?: string;
  availabilityBufferDays?: number;
}

const itemSchema = new Schema<IItem>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    condition: {
      type: String,
      enum: ["New", "Excellent", "Good", "Fair"],
      required: true,
    },
    rentalFeePerDay: {
      type: Number,
      required: true,
    },
    deposit: {
      type: Number,
      required: true,
    },
    images: [
      {
        type: String,
        required: true,
      },
    ],
    ownerId: {
      type: String,
      required: true,
    },
    ownerName: {
      type: String,
      required: true,
    },
ownerAvatar: {
       type: String,
     },
     ownerEmail: {
       type: String,
     },
     ownerPhone: {
       type: String,
     },
     ownerRating: {
      type: Number,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    available: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

const Item = mongoose.model<IItem>("Item", itemSchema);

export default Item;
