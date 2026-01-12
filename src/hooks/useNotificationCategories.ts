import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface NotificationCategoryCounts {
  assessments: number;
  projects: number;
  events: number;
  inventory: number;
  leave: number;
  courses: number;
  certificates: number;
  total: number;
}

const EMPTY_COUNTS: NotificationCategoryCounts = {
  assessments: 0,
  projects: 0,
  events: 0,
  inventory: 0,
  leave: 0,
  courses: 0,
  certificates: 0,
  total: 0
};

// Map notification types to categories
function categorizeNotificationType(type: string): keyof Omit<NotificationCategoryCounts, 'total'> | null {
  if (type.includes('assessment') || type.includes('quiz') || type.includes('grade')) {
    return 'assessments';
  }
  if (type.includes('project')) {
    return 'projects';
  }
  if (type.includes('event')) {
    return 'events';
  }
  if (type.includes('purchase') || type.includes('inventory')) {
    return 'inventory';
  }
  if (type.includes('leave')) {
    return 'leave';
  }
  if (type.includes('course') || type.includes('assignment')) {
    return 'courses';
  }
  if (type.includes('certificate')) {
    return 'certificates';
  }
  return null;
}

export function useNotificationCategories(userId: string | undefined) {
  const [counts, setCounts] = useState<NotificationCategoryCounts>(EMPTY_COUNTS);
  const [loading, setLoading] = useState(true);

  const fetchCounts = useCallback(async () => {
    if (!userId) {
      setCounts(EMPTY_COUNTS);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('type')
        .eq('recipient_id', userId)
        .eq('read', false)
        .eq('archived', false);

      if (error) {
        console.error('Error fetching notification categories:', error);
        return;
      }

      const newCounts: NotificationCategoryCounts = { ...EMPTY_COUNTS };

      (data || []).forEach(notification => {
        const category = categorizeNotificationType(notification.type);
        if (category) {
          newCounts[category]++;
        }
        newCounts.total++;
      });

      setCounts(newCounts);
    } catch (err) {
      console.error('Error in useNotificationCategories:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchCounts();

    // Set up realtime subscription for notifications
    const channel = supabase
      .channel(`notification-categories-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${userId}`
        },
        () => {
          fetchCounts();
        }
      )
      .subscribe();

    // Also poll every 30 seconds as backup
    const interval = setInterval(fetchCounts, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [userId, fetchCounts]);

  return { counts, loading, refetch: fetchCounts };
}
