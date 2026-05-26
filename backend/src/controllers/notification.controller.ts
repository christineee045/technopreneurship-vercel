import type { Request, Response } from "express";
import {
  createNotification,
  getNotificationsByUserId,
  getNotificationsForAdmin,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "../services/notification.service";

export const createNotificationHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, type, title, message, referenceId, referenceType } = req.body;

    if (!userId || !type || !title || !message) {
      res.status(400).json({ message: "userId, type, title, and message are required" });
      return;
    }

    const notification = await createNotification({
      userId,
      type,
      title,
      message,
      referenceId,
      referenceType,
    });

    res.status(201).json(notification);
  } catch (error) {
    res.status(500).json({ message: "Failed to create notification", error });
  }
};

export const getNotificationsHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user?.id) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (user?.isAdmin) {
      const notifications = await getNotificationsForAdmin(user.id);
      res.json(notifications);
      return;
    }

    const notifications = await getNotificationsByUserId(user.id);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch notifications", error });
  }
};

export const getUnreadCountHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user?.id) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const count = await getUnreadCount(user.id);
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch unread count", error });
  }
};

export const markAsReadHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user?.id) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { id } = req.params;
    const notificationId = Array.isArray(id) ? id[0] : id;

    if (!notificationId) {
      res.status(400).json({ message: "Invalid notification id" });
      return;
    }

    const notification = await markAsRead(notificationId, user.id, Boolean(user.isAdmin));
    if (!notification) {
      res.status(404).json({ message: "Notification not found" });
      return;
    }

    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: "Failed to mark notification as read", error });
  }
};

export const markAllAsReadHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user?.id) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const modifiedCount = await markAllAsRead(user.id);
    res.json({ modifiedCount });
  } catch (error) {
    res.status(500).json({ message: "Failed to mark all notifications as read", error });
  }
};

export const deleteNotificationHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user?.id) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { id } = req.params;
    const notificationId = Array.isArray(id) ? id[0] : id;

    if (!notificationId) {
      res.status(400).json({ message: "Invalid notification id" });
      return;
    }

    const success = await deleteNotification(notificationId, user.id);
    if (!success) {
      res.status(404).json({ message: "Notification not found" });
      return;
    }

    res.json({ message: "Notification deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete notification", error });
  }
};
