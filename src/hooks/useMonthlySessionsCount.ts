import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useMonthlySessionsCount(institutionId?: string) {
  return useQuery({
    queryKey: ['monthly-sessions-count', institutionId],
    queryFn: async (): Promise<number> => {
      if (!institutionId) return 0;

      // Get first day of current month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfMonthStr = startOfMonth.toISOString().split('T')[0];

      const { count, error } = await supabase
        .from('class_session_attendance')
        .select('*', { count: 'exact', head: true })
        .eq('institution_id', institutionId)
        .eq('is_session_completed', true)
        .gte('date', startOfMonthStr);

      if (error) {
        console.error('Error fetching monthly sessions count:', error);
        return 0;
      }

      return count || 0;
    },
    enabled: !!institutionId,
  });
}
