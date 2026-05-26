import mongoose, { Schema, Document } from "mongoose";

export interface INotification extends Document {
  userId: string;
  type:
    | 'borrow_request_submitted'
    | 'borrow_request'
    | 'request_approved'
    | 'request_rejected'
    | 'item_returned'
    | 'new_review'
    | 'listing_submitted'
    | 'listing_approved'
    | 'listing_rejected'
    | 'system';
  title: string;
  message: string;
  referenceId?: string; // e.g., borrow request ID, item ID
  referenceType?: 'borrowRequest' | 'item' | 'review';
  meta?: any;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: [
      'borrow_request_submitted',
      'borrow_request',
      'request_approved',
      'request_rejected',
      'item_returned',
      'new_review',
      'listing_submitted',
      'listing_approved',
      'listing_rejected',
      'system',
    ],
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  referenceId: {
    type: String,
  },
  referenceType: {
    type: String,
    enum: ['borrowRequest', 'item', 'review'],
  },
  meta: {
    type: Schema.Types.Mixed,
  },
  read: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Index for efficient querying
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ read: 1 });

const Notification = mongoose.model<INotification>("Notification", notificationSchema);

export default Notification;
