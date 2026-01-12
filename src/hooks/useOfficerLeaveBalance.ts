import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface LeaveBalanceData {
  casual_leave: number;
  sick_leave: number;
  earned_leave: number;
  monthly_credit: number;
  lop_days: number;
  total_days_used: number;
}

/**
 * Hook to fetch officer's leave balance from the database
 */
export function useOfficerLeaveBalance(userId: string | undefined, year: number) {
  return useQuery({
    queryKey: ['officer-leave-balance', userId, year],
    queryFn: async (): Promise<LeaveBalanceData | null> => {
      if (!userId) return null;

      // First try to get from leave_balances table
      const { data: balanceData, error: balanceError } = await supabase
        .from('leave_balances')
        .select('*')
        .eq('user_id', userId)
        .eq('year', year)
        .order('month', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (balanceData) {
        return {
          casual_leave: balanceData.balance_remaining || 0,
          sick_leave: Math.max(0, 12 - (balanceData.sick_leave_used || 0)),
          earned_leave: Math.max(0, 15 - (balanceData.casual_leave_used || 0)),
          monthly_credit: balanceData.monthly_credit || 0,
          lop_days: balanceData.lop_days || 0,
          total_days_used: (balanceData.casual_leave_used || 0) + (balanceData.sick_leave_used || 0),
        };
      }

      // Fallback: Calculate from leave_applications
      const { data: leaveApps } = await supabase
        .from('leave_applications')
        .select('leave_type, total_days')
        .eq('applicant_id', userId)
        .eq('status', 'approved')
        .gte('start_date', `${year}-01-01`)
        .lte('end_date', `${year}-12-31`);

      if (leaveApps && leaveApps.length > 0) {
        let casualUsed = 0;
        let sickUsed = 0;
        let earnedUsed = 0;

        leaveApps.forEach(app => {
          const days = app.total_days || 0;
          if (app.leave_type === 'casual' || app.leave_type === 'cl') casualUsed += days;
          else if (app.leave_type === 'sick' || app.leave_type === 'sl') sickUsed += days;
          else if (app.leave_type === 'earned' || app.leave_type === 'el') earnedUsed += days;
        });

        // Assuming default annual entitlements: 12 CL, 12 SL, 15 EL
        return {
          casual_leave: Math.max(0, 12 - casualUsed),
          sick_leave: Math.max(0, 12 - sickUsed),
          earned_leave: Math.max(0, 15 - earnedUsed),
          monthly_credit: 1,
          lop_days: 0,
          total_days_used: casualUsed + sickUsed + earnedUsed,
        };
      }

      // Default values if no leave data exists
      return {
        casual_leave: 12,
        sick_leave: 12,
        earned_leave: 15,
        monthly_credit: 1,
        lop_days: 0,
        total_days_used: 0,
      };
    },
    enabled: !!userId,
  });
}
