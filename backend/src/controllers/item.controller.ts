import type { Request, Response } from "express";
import {
  createItem,
  getItems,
  getFeaturedItems,
  getItemById,
  getItemsByOwnerId,
  updateItem,
  deleteItem,
} from "../services/item.service";
import { createNotification } from "../services/notification.service";

export const createItemHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user?.id || !user?.name) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

     const itemData = {
       ...req.body,
       ownerId: user.id,
       ownerName: user.name,
       ownerAvatar: user.avatar,
      approvalStatus: "pending",
     };

    if (!itemData.title || !itemData.description || !itemData.category || !itemData.condition) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }

    const item = await createItem(itemData);

    try {
      await createNotification({
        userId: user.id,
        type: "listing_submitted",
        title: "Listing Submitted for Review",
        message: `Your listing \"${item.title}\" has been submitted for administrative review and will be published once approved.`,
        referenceId: item._id?.toString(),
        referenceType: "item",
      });
    } catch (notificationError) {
      console.error("Failed to create listing submission notification:", notificationError);
    }

    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ message: "Failed to create item", error });
  }
};

export const getItemsHandler = async (_req: Request, res: Response): Promise<void> => {
  try {
    const items = await getItems();
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch items", error });
  }
};

export const getFeaturedItemsHandler = async (_req: Request, res: Response): Promise<void> => {
  try {
    const items = await getFeaturedItems();
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch featured items", error });
  }
};

export const getItemByIdHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const itemId = Array.isArray(id) ? id[0] : id;

    if (!itemId) {
      res.status(400).json({ message: "Invalid item id" });
      return;
    }

    const item = await getItemById(itemId);
    if (!item) {
      res.status(404).json({ message: "Item not found" });
      return;
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch item", error });
  }
};

export const getItemsByOwnerIdHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    // If authenticated via /owner/me, use user from token
    const userId = (req as any).user?.id;
    if (userId) {
      const items = await getItemsByOwnerId(userId);
      res.json(items);
      return;
    }

    // Public route /owner/:ownerId
    const { ownerId } = req.params;
    const publicOwnerId = Array.isArray(ownerId) ? ownerId[0] : ownerId;

    if (!publicOwnerId) {
      res.status(400).json({ message: "Owner ID is required" });
      return;
    }

    const items = await getItemsByOwnerId(publicOwnerId);
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch items", error });
  }
};

export const updateItemHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { id } = req.params;
    const itemId = Array.isArray(id) ? id[0] : id;

    if (!itemId) {
      res.status(400).json({ message: "Invalid item id" });
      return;
    }

    const existingItem = await getItemById(itemId);
    if (!existingItem) {
      res.status(404).json({ message: "Item not found" });
      return;
    }

    // Check if user owns this item
    if (existingItem.ownerId !== userId) {
      res.status(403).json({ message: "You can only update your own items" });
      return;
    }

    const updateData = req.body;
    const item = await updateItem(itemId, updateData);
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: "Failed to update item", error });
  }
};

export const deleteItemHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { id } = req.params;
    const itemId = Array.isArray(id) ? id[0] : id;

    if (!itemId) {
      res.status(400).json({ message: "Invalid item id" });
      return;
    }

    const existingItem = await getItemById(itemId);
    if (!existingItem) {
      res.status(404).json({ message: "Item not found" });
      return;
    }

    // Check if user owns this item
    if (existingItem.ownerId !== userId) {
      res.status(403).json({ message: "You can only delete your own items" });
      return;
    }

    const deleted = await deleteItem(itemId);
    if (deleted) {
      res.json({ message: "Item deleted successfully" });
    } else {
      res.status(500).json({ message: "Failed to delete item" });
    }
  } catch (error) {
    res.status(500).json({ message: "Failed to delete item", error });
  }
};
