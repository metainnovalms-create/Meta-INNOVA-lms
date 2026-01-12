import { useState, useEffect } from 'react';
import { Notification, NotificationType } from '@/types/notification';

export type NotificationRecipientRole = 'officer' | 'student' | 'system_admin' | 'management';

export function useNotifications(userId: string, userRole: NotificationRecipientRole) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const loadNotifications = () => {
    const key = `notifications_${userId}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Sort by created_at descending
      parsed.sort((a: Notification, b: Notification) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setNotifications(parsed);
    }
  };

  useEffect(() => {
    loadNotifications();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  const getUnreadCount = () => {
    return notifications.filter(n => !n.read).length;
  };

  const markAsRead = (notificationId: string) => {
    const key = `notifications_${userId}`;
    const updated = notifications.map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    );
    setNotifications(updated);
    localStorage.setItem(key, JSON.stringify(updated));
  };

  const markAllAsRead = () => {
    const key = `notifications_${userId}`;
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    localStorage.setItem(key, JSON.stringify(updated));
  };

  return {
    notifications,
    unreadCount: getUnreadCount(),
    markAsRead,
    markAllAsRead,
    reload: loadNotifications
  };
}

export function createNotification(
  recipientId: string,
  recipientRole: NotificationRecipientRole,
  type: NotificationType,
  title: string,
  message: string,
  link: string,
  metadata?: any
): Notification {
  const notification: Notification = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    recipient_id: recipientId,
    recipient_role: recipientRole,
    type,
    title,
    message,
    link,
    metadata,
    read: false,
    created_at: new Date().toISOString()
  };
  
  const key = `notifications_${recipientId}`;
  const existing = JSON.parse(localStorage.getItem(key) || '[]');
  existing.unshift(notification);
  localStorage.setItem(key, JSON.stringify(existing));
  
  return notification;
}

export function createNotificationForSystemAdmin(
  type: NotificationType,
  title: string,
  message: string,
  link: string,
  metadata?: any
): void {
  // For now, use a hardcoded system admin ID
  // In a real system, this would fetch all system admin user IDs
  const systemAdminId = 'system_admin_001';
  createNotification(systemAdminId, 'system_admin', type, title, message, link, metadata);
}
