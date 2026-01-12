import { useState, useEffect, useCallback } from 'react';
import { notificationService, DbNotification, GetNotificationsOptions } from '@/services/notification.service';
import { supabase } from '@/integrations/supabase/client';

export function useDbNotifications(userId: string | undefined, options: GetNotificationsOptions = {}) {
  const [notifications, setNotifications] = useState<DbNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    if (!userId) return;
    
    try {
      const data = await notificationService.getNotifications(userId, options);
      setNotifications(data);
      // Only count unread non-archived
      setUnreadCount(data.filter(n => !n.read && !n.archived).length);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, options.includeArchived, options.limit]);

  useEffect(() => {
    loadNotifications();

    // Set up realtime subscription for INSERT and UPDATE events
    if (!userId) return;

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${userId}`
        },
        (payload) => {
          const newNotification = {
            ...payload.new,
            archived: payload.new.archived ?? false,
            archived_at: payload.new.archived_at ?? null,
            read_at: payload.new.read_at ?? null
          } as DbNotification;
          
          // Only add if not archived (or if we're including archived)
          if (!newNotification.archived || options.includeArchived) {
            setNotifications(prev => [newNotification, ...prev]);
            if (!newNotification.read && !newNotification.archived) {
              setUnreadCount(prev => prev + 1);
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${userId}`
        },
        (payload) => {
          const updatedNotification = {
            ...payload.new,
            archived: payload.new.archived ?? false,
            archived_at: payload.new.archived_at ?? null,
            read_at: payload.new.read_at ?? null
          } as DbNotification;
          
          setNotifications(prev => {
            // If notification is now archived and we're not showing archived, remove it
            if (updatedNotification.archived && !options.includeArchived) {
              return prev.filter(n => n.id !== updatedNotification.id);
            }
            // Otherwise update in place
            return prev.map(n => n.id === updatedNotification.id ? updatedNotification : n);
          });
          
          // Recalculate unread count
          setNotifications(prev => {
            setUnreadCount(prev.filter(n => !n.read && !n.archived).length);
            return prev;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, loadNotifications, options.includeArchived]);

  const markAsRead = async (notificationId: string) => {
    await notificationService.markAsRead(notificationId);
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true, read_at: new Date().toISOString() } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    if (!userId) return;
    await notificationService.markAllAsRead(userId);
    setNotifications(prev => prev.map(n => ({ ...n, read: true, read_at: new Date().toISOString() })));
    setUnreadCount(0);
  };

  const archiveNotification = async (notificationId: string) => {
    await notificationService.archiveNotification(notificationId);
    setNotifications(prev => {
      if (!options.includeArchived) {
        return prev.filter(n => n.id !== notificationId);
      }
      return prev.map(n => n.id === notificationId ? { ...n, archived: true, archived_at: new Date().toISOString(), read: true } : n);
    });
    setUnreadCount(prev => {
      const notification = notifications.find(n => n.id === notificationId);
      if (notification && !notification.read) {
        return Math.max(0, prev - 1);
      }
      return prev;
    });
  };

  const archiveAllRead = async () => {
    if (!userId) return;
    await notificationService.archiveAllRead(userId);
    setNotifications(prev => {
      if (!options.includeArchived) {
        return prev.filter(n => !n.read);
      }
      return prev.map(n => n.read ? { ...n, archived: true, archived_at: new Date().toISOString() } : n);
    });
  };

  const unarchiveNotification = async (notificationId: string) => {
    await notificationService.unarchiveNotification(notificationId);
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, archived: false, archived_at: null } : n)
    );
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    archiveAllRead,
    unarchiveNotification,
    reload: loadNotifications
  };
}
