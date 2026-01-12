import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';

export interface DbNotification {
  id: string;
  recipient_id: string;
  recipient_role: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  metadata: Json;
  read: boolean;
  archived: boolean;
  archived_at: string | null;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface GetNotificationsOptions {
  includeArchived?: boolean;
  limit?: number;
}

export const notificationService = {
  // Fetch notifications for a user
  getNotifications: async (userId: string, options: GetNotificationsOptions = {}): Promise<DbNotification[]> => {
    const { includeArchived = false, limit = 50 } = options;
    
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('recipient_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (!includeArchived) {
      query = query.eq('archived', false);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to fetch notifications:', error);
      return [];
    }

    return (data || []).map(n => ({
      ...n,
      archived: n.archived ?? false,
      archived_at: n.archived_at ?? null,
      read_at: n.read_at ?? null
    })) as DbNotification[];
  },

  // Get unread count (excludes archived)
  getUnreadCount: async (userId: string): Promise<number> => {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', userId)
      .eq('read', false)
      .eq('archived', false);

    if (error) {
      console.error('Failed to get unread count:', error);
      return 0;
    }

    return count || 0;
  },

  // Mark notification as read
  markAsRead: async (notificationId: string): Promise<void> => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId);

    if (error) {
      console.error('Failed to mark notification as read:', error);
    }
  },

  // Mark all as read for a user (excludes archived)
  markAllAsRead: async (userId: string): Promise<void> => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('recipient_id', userId)
      .eq('read', false)
      .eq('archived', false);

    if (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  },

  // Archive a notification (mark as complete)
  archiveNotification: async (notificationId: string): Promise<void> => {
    const { error } = await supabase
      .from('notifications')
      .update({ 
        archived: true, 
        archived_at: new Date().toISOString(),
        read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', notificationId);

    if (error) {
      console.error('Failed to archive notification:', error);
    }
  },

  // Archive all read notifications for a user
  archiveAllRead: async (userId: string): Promise<void> => {
    const { error } = await supabase
      .from('notifications')
      .update({ 
        archived: true, 
        archived_at: new Date().toISOString() 
      })
      .eq('recipient_id', userId)
      .eq('read', true)
      .eq('archived', false);

    if (error) {
      console.error('Failed to archive all read notifications:', error);
    }
  },

  // Unarchive a notification
  unarchiveNotification: async (notificationId: string): Promise<void> => {
    const { error } = await supabase
      .from('notifications')
      .update({ archived: false, archived_at: null })
      .eq('id', notificationId);

    if (error) {
      console.error('Failed to unarchive notification:', error);
    }
  },

  // Create a notification
  createNotification: async (
    recipientId: string,
    recipientRole: string,
    type: string,
    title: string,
    message: string,
    link?: string,
    metadata?: Record<string, unknown>
  ): Promise<DbNotification | null> => {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        recipient_id: recipientId,
        recipient_role: recipientRole,
        type,
        title,
        message,
        link: link || null,
        metadata: (metadata || {}) as Json
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create notification:', error);
      return null;
    }

    return {
      ...data,
      archived: data.archived ?? false,
      archived_at: data.archived_at ?? null,
      read_at: data.read_at ?? null
    } as DbNotification;
  },

  // Create notifications for multiple recipients
  createBulkNotifications: async (
    recipientIds: string[],
    recipientRole: string,
    type: string,
    title: string,
    message: string,
    link?: string,
    metadata?: Record<string, unknown>
  ): Promise<void> => {
    const notifications = recipientIds.map(recipientId => ({
      recipient_id: recipientId,
      recipient_role: recipientRole,
      type,
      title,
      message,
      link: link || null,
      metadata: (metadata || {}) as Json
    }));

    const { error } = await supabase
      .from('notifications')
      .insert(notifications);

    if (error) {
      console.error('Failed to create bulk notifications:', error);
    }
  }
};
