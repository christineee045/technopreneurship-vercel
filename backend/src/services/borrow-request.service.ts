import BorrowRequest, { IBorrowRequest } from "../models/BorrowRequest";
import Item from "../models/Item";

const AVAILABILITY_BUFFER_DAYS = 2;
const AVAILABILITY_BUFFER_MS = AVAILABILITY_BUFFER_DAYS * 24 * 60 * 60 * 1000;
const RESERVED_STATUSES: IBorrowRequest["status"][] = ["Pending", "Approved", "Active", "Overdue"];

const rangesOverlap = (startA: Date, endA: Date, startB: Date, endB: Date): boolean => {
  return startA <= endB && endA >= startB;
};

export const getEstimatedAvailableAt = async (itemId: string): Promise<string | undefined> => {
  const requests = await BorrowRequest.find({
    itemId,
    status: { $in: RESERVED_STATUSES },
  })
    .select("endDate returnedAt")
    .lean();

  if (requests.length === 0) {
    return undefined;
  }

  let latestTimestamp = 0;

  requests.forEach((request) => {
    const sourceDate = request.returnedAt || request.endDate;
    if (!sourceDate) return;

    const requestTimestamp = new Date(sourceDate).getTime();
    if (!Number.isNaN(requestTimestamp) && requestTimestamp > latestTimestamp) {
      latestTimestamp = requestTimestamp;
    }
  });

  if (latestTimestamp === 0) {
    return undefined;
  }

  return new Date(latestTimestamp + AVAILABILITY_BUFFER_MS).toISOString();
};

export const createBorrowRequest = async (
  requestData: Partial<IBorrowRequest>
): Promise<IBorrowRequest> => {
  const item = await Item.findById(requestData.itemId);
  if (!item) {
    throw new Error("Item not found");
  }

  const startDate = requestData.startDate ? new Date(requestData.startDate) : null;
  const endDate = requestData.endDate ? new Date(requestData.endDate) : null;

  if (!startDate || !endDate || Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    throw new Error("Valid startDate and endDate are required");
  }

  if (endDate < startDate) {
    throw new Error("End date must be after the start date");
  }

  if (item.ownerId === requestData.borrowerId) {
    throw new Error("You cannot request to borrow your own item");
  }

  const existing = await BorrowRequest.findOne({
    itemId: requestData.itemId,
    borrowerId: requestData.borrowerId,
    status: { $in: ["Pending", "Approved", "Active"] },
  });

  if (existing) {
    throw new Error("You already have an active request for this item");
  }

  const conflictingRequests = await BorrowRequest.find({
    itemId: requestData.itemId,
    status: { $in: RESERVED_STATUSES },
  }).select("startDate endDate returnedAt status");

  const hasOverlap = conflictingRequests.some((request) => {
    const existingStart = new Date(request.startDate);
    const existingEnd = new Date(request.returnedAt || request.endDate);
    return (
      !Number.isNaN(existingStart.getTime()) &&
      !Number.isNaN(existingEnd.getTime()) &&
      rangesOverlap(startDate, endDate, existingStart, existingEnd)
    );
  });

  if (hasOverlap) {
    throw new Error("This item is already reserved for part of those dates. Please choose a different time window.");
  }

  const estimatedAvailableAt = await getEstimatedAvailableAt(item.id || item._id?.toString() || requestData.itemId || "");
  if (!item.available && estimatedAvailableAt) {
    const estimatedDate = new Date(estimatedAvailableAt);
    if (startDate < estimatedDate) {
      throw new Error(`This item is expected to be available from ${estimatedDate.toLocaleDateString()}. Please choose a later start date.`);
    }
  }

  return BorrowRequest.create(requestData);
};

export const getBorrowRequests = async (): Promise<IBorrowRequest[]> => {
  return BorrowRequest.find().sort({ createdAt: -1 });
};

export const getBorrowRequestById = async (id: string): Promise<IBorrowRequest | null> => {
  return BorrowRequest.findById(id);
};

export const getBorrowRequestsByBorrowerId = async (
  borrowerId: string
): Promise<IBorrowRequest[]> => {
  return BorrowRequest.find({ borrowerId }).sort({ createdAt: -1 });
};

export const getBorrowRequestsByOwnerId = async (ownerId: string): Promise<IBorrowRequest[]> => {
  return BorrowRequest.find({ ownerId }).sort({ createdAt: -1 });
};

export const updateBorrowRequest = async (
  id: string,
  updateData: Partial<IBorrowRequest>
): Promise<IBorrowRequest | null> => {
  return BorrowRequest.findByIdAndUpdate(id, updateData, { new: true });
};
