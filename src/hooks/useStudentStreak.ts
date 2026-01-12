import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { gamificationDbService } from '@/services/gamification-db.service';
import { toast } from 'sonner';

interface StreakData {
  current_streak: number;
  longest_streak: number;
  last_activity_date?: string;
}

export function useStudentStreak(studentId: string | undefined, institutionId?: string) {
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);
  const prevStreakRef = useRef<number | null>(null);
  const hasUpdatedRef = useRef(false);

  // Fetch streak and trigger update
  useEffect(() => {
    if (!studentId) {
      setLoading(false);
      return;
    }

    const fetchAndUpdateStreak = async () => {
      try {
        // Update streak first (will create record if needed and award XP)
        if (institutionId && !hasUpdatedRef.current) {
          hasUpdatedRef.current = true;
          await gamificationDbService.updateStreak(studentId, institutionId);
        }

        // Then fetch the current streak
        const streakData = await gamificationDbService.getStudentStreak(studentId);
        if (streakData) {
          // Show toast if streak increased
          if (prevStreakRef.current !== null && streakData.current_streak > prevStreakRef.current) {
            toast.success(`🔥 Streak increased to ${streakData.current_streak} days!`, {
              duration: 3000,
            });
          }
          prevStreakRef.current = streakData.current_streak;
          setStreak(streakData);
        }
      } catch (error) {
        console.error('Error fetching/updating streak:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAndUpdateStreak();
  }, [studentId, institutionId]);

  // Subscribe to realtime changes
  useEffect(() => {
    if (!studentId) return;

    const channel = supabase
      .channel(`streak-${studentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'student_streaks',
          filter: `student_id=eq.${studentId}`
        },
        (payload) => {
          const newData = payload.new as StreakData;
          if (newData) {
            // Show toast if streak increased from realtime update
            if (prevStreakRef.current !== null && newData.current_streak > prevStreakRef.current) {
              toast.success(`🔥 Streak increased to ${newData.current_streak} days!`, {
                duration: 3000,
              });
            }
            prevStreakRef.current = newData.current_streak;
            setStreak({
              current_streak: newData.current_streak,
              longest_streak: newData.longest_streak,
              last_activity_date: newData.last_activity_date
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [studentId]);

  return { streak, loading };
}
