import type { Request, Response } from "express";
import Item from "../models/Item";
import {
  createBorrowRequest,
  getBorrowRequests,
  getBorrowRequestById,
  getBorrowRequestsByBorrowerId,
  getBorrowRequestsByOwnerId,
  updateBorrowRequest,
} from "../services/borrow-request.service";
import { createNotification as createNotif } from "../services/notification.service";

const getRequestId = (value: unknown): string | undefined => {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0];
  return undefined;
};

const getUserId = (user: any): string | undefined => user?.id || user?._id;

export const createBorrowRequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const requestData = req.body;
    const request = await createBorrowRequest(requestData);

    await createNotif({
      userId: request.borrowerId,
      type: "borrow_request_submitted",
      title: "Borrow Request Submitted",
      message: `Your request to borrow "${request.itemTitle}" is waiting for approval from ${request.ownerName}.`,
      referenceId: request._id?.toString(),
      referenceType: "borrowRequest",
    });

    await createNotif({
      userId: request.ownerId,
      type: "borrow_request",
      title: "New Borrow Request",
      message: `${request.borrowerName} wants to borrow your ${request.itemTitle}.`,
      referenceId: request._id?.toString(),
      referenceType: "borrowRequest",
    });

    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({ message: "Failed to create borrow request", error });
  }
};

export const getBorrowRequestsHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user?.isAdmin) {
      res.status(403).json({ message: "Admin access required" });
      return;
    }

    const requests = await getBorrowRequests();
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch borrow requests", error });
  }
};

export const getBorrowRequestByIdHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const requestId = getRequestId(req.params.id);
    if (!requestId) {
      res.status(400).json({ message: "Invalid borrow request id" });
      return;
    }

    const request = await getBorrowRequestById(requestId);
    if (!request) {
      res.status(404).json({ message: "Borrow request not found" });
      return;
    }

    const user = (req as any).user;
    const userId = getUserId(user);
    const canAccess = user?.isAdmin || (userId && (request.borrowerId === userId || request.ownerId === userId));

    if (!canAccess) {
      res.status(403).json({ message: "Not authorized to view this request" });
      return;
    }

    res.json(request);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch borrow request", error });
  }
};

export const getBorrowRequestsByBorrowerIdHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const borrowerId = getRequestId(req.params.borrowerId);
    if (!borrowerId) {
      res.status(400).json({ message: "Invalid borrower id" });
      return;
    }

    const user = (req as any).user;
    const userId = getUserId(user);
    if (!user?.isAdmin && userId !== borrowerId) {
      res.status(403).json({ message: "Not authorized to view these requests" });
      return;
    }

    const requests = await getBorrowRequestsByBorrowerId(borrowerId);
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch borrow requests", error });
  }
};

export const getPublicBorrowerFeedbackHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const borrowerId = getRequestId(req.params.borrowerId);
    if (!borrowerId) {
      res.status(400).json({ message: "Invalid borrower id" });
      return;
    }

    const requests = await getBorrowRequestsByBorrowerId(borrowerId);
    const feedback = requests
      .filter((request) => request.borrowerRating !== undefined || request.borrowerFeedback)
      .map((request) => ({
        id: request._id?.toString(),
        itemId: request.itemId,
        itemTitle: request.itemTitle,
        ownerId: request.ownerId,
        ownerName: request.ownerName,
        borrowerRating: request.borrowerRating,
        borrowerFeedback: request.borrowerFeedback,
        status: request.status,
        createdAt: request.createdAt,
        returnedAt: request.returnedAt,
      }));

    res.json(feedback);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch borrower feedback", error });
  }
};

export const getBorrowRequestsByOwnerIdHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const ownerId = getRequestId(req.params.ownerId);
    if (!ownerId) {
      res.status(400).json({ message: "Invalid owner id" });
      return;
    }

    const user = (req as any).user;
    const userId = getUserId(user);
    if (!user?.isAdmin && userId !== ownerId) {
      res.status(403).json({ message: "Not authorized to view these requests" });
      return;
    }

    const requests = await getBorrowRequestsByOwnerId(ownerId);
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch borrow requests", error });
  }
};

export const updateBorrowRequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const requestId = getRequestId(req.params.id);
    if (!requestId) {
      res.status(400).json({ message: "Invalid borrow request id" });
      return;
    }

    const existingRequest = await getBorrowRequestById(requestId);
    if (!existingRequest) {
      res.status(404).json({ message: "Borrow request not found" });
      return;
    }

    const user = (req as any).user;
    const userId = getUserId(user);
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const isOwner = existingRequest.ownerId === userId;
    const isBorrower = existingRequest.borrowerId === userId;
    const isAdmin = Boolean(user?.isAdmin);
    const updateData = { ...req.body } as Record<string, any>;

    if (updateData.status === "Returned") {
      if (!isBorrower && !isAdmin) {
        res.status(403).json({ message: "Only the borrower can mark this request as returned" });
        return;
      }

      if (!["Approved", "Active", "Returned"].includes(existingRequest.status)) {
        res.status(400).json({ message: "This request cannot be marked as returned yet" });
        return;
      }

      updateData.returnedAt = updateData.returnedAt || new Date().toISOString();
    }

    const hasOwnerFeedback = updateData.borrowerRating !== undefined || updateData.borrowerFeedback !== undefined || updateData.reportReason !== undefined;
    if (hasOwnerFeedback && !isOwner && !isAdmin) {
      res.status(403).json({ message: "Only the item owner can add borrower feedback or reports" });
      return;
    }

    if (hasOwnerFeedback && updateData.reportReason) {
      updateData.status = "Reported";
    }

    if (updateData.status === "Approved" || updateData.status === "Active") {
      if (!isOwner && !isAdmin) {
        res.status(403).json({ message: "You can only approve requests for your own items" });
        return;
      }
    }

    if (updateData.status === "Rejected") {
      if (!isOwner && !isAdmin) {
        res.status(403).json({ message: "You can only reject requests for your own items" });
        return;
      }
    }

    const request = await updateBorrowRequest(requestId, updateData);
    if (!request) {
      res.status(404).json({ message: "Borrow request not found after update" });
      return;
    }

    if (updateData.status === "Approved" || updateData.status === "Active") {
      await Item.findByIdAndUpdate(request.itemId, { available: false });

      await createNotif({
        userId: request.borrowerId,
        type: "request_approved",
        title: "Request Approved!",
        message: `${request.ownerName} approved your borrow request for \"${request.itemTitle}\".`,
        referenceId: request._id?.toString(),
        referenceType: "borrowRequest",
      });
    }

    if (updateData.status === "Rejected") {
      await Item.findByIdAndUpdate(request.itemId, { available: true });

      await createNotif({
        userId: request.borrowerId,
        type: "request_rejected",
        title: "Request Rejected",
        message: `${request.ownerName} rejected your borrow request for \"${request.itemTitle}\".`,
        referenceId: request._id?.toString(),
        referenceType: "borrowRequest",
      });
    }

    if (updateData.status === "Returned") {
      await Item.findByIdAndUpdate(request.itemId, { available: true });

      await createNotif({
        userId: request.ownerId,
        type: "item_returned",
        title: "Item Returned",
        message: `${request.borrowerName} marked \"${request.itemTitle}\" as returned.`,
        referenceId: request._id?.toString(),
        referenceType: "borrowRequest",
      });
    }

    if (updateData.status === "Reported") {
      await createNotif({
        userId: request.borrowerId,
        type: "system",
        title: "Borrow Request Reported",
        message: `${request.ownerName} reported an issue for \"${request.itemTitle}\". Admin review has been requested.`,
        referenceId: request._id?.toString(),
        referenceType: "borrowRequest",
      });
    }

    if (hasOwnerFeedback && !updateData.reportReason) {
      await createNotif({
        userId: request.borrowerId,
        type: "system",
        title: "Borrower Feedback Received",
        message: `${request.ownerName} left feedback on your borrow request for \"${request.itemTitle}\".`,
        referenceId: request._id?.toString(),
        referenceType: "borrowRequest",
      });
    }

    res.json(request);
  } catch (error) {
    res.status(500).json({ message: "Failed to update borrow request", error });
  }
};
