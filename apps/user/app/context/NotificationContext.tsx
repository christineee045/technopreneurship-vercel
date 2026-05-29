import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import {
  fetchNotifications as fetchNotifsAPI,
  markNotificationAsRead as markReadAPI,
  markAllNotificationsAsRead as markAllReadAPI,
  deleteNotification as deleteNotifAPI,
  type Notification as ApiNotification,
} from '../services/api';

export interface Notification {
  _id?: string;
  id: string;
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
  referenceId?: string;
  referenceType?: 'borrowRequest' | 'item' | 'review';
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'updatedAt' | 'userId' | 'type'> & { userId?: string; type?: Notification['type'] }) => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const normalize = (n: ApiNotification): Notification => ({
    ...n,
    id: n._id?.toString() || n.id || '',
  });

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const data = await fetchNotifsAPI();
      const normalized = data.map(normalize);
      setNotifications(normalized);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    } else {
      setNotifications([]);
    }
  }, [user, fetchNotifications]);

  const addNotification = (notificationData: Omit<Notification, 'id' | 'createdAt' | 'updatedAt' | 'userId' | 'type'> & { userId?: string; type?: Notification['type'] }) => {
    const newNotif: Notification = {
      ...notificationData,
      userId: notificationData.userId || user?.id || '',
      type: notificationData.type || 'system',
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const markAsRead = async (id: string) => {
    try {
      await markReadAPI(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await markAllReadAPI();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await deleteNotifAPI(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        fetchNotifications,
        addNotification,
        markAsRead,
        markAllAsRead,
        deleteNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
