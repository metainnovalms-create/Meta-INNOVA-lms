import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LeaveBalanceData {
  monthly_credit: number;
  carried_forward: number;
  total_available: number;
  sick_leave_used: number;
  casual_leave_used: number;
  total_used: number;
  lop_days: number;
  balance_remaining: number;
}

export function useApplicantLeaveBalance(
  applicantId: string | undefined,
  year: number,
  month: number
) {
  return useQuery({
    queryKey: ['applicant-leave-balance', applicantId, year, month],
    queryFn: async (): Promise<LeaveBalanceData | null> => {
      if (!applicantId) return null;
      
      const { data, error } = await supabase.rpc('get_leave_balance', {
        p_user_id: applicantId,
        p_year: year,
        p_month: month
      });
      
      if (error) {
        console.error('Error fetching leave balance:', error);
        throw error;
      }
      
      if (data && Array.isArray(data) && data.length > 0) {
        return data[0] as LeaveBalanceData;
      }
      return null;
    },
    enabled: !!applicantId
  });
}

export function usePendingLeavesCount(
  applicantId: string | undefined,
  year: number,
  month: number
) {
  return useQuery({
    queryKey: ['pending-leaves-count', applicantId, year, month],
    queryFn: async (): Promise<number> => {
      if (!applicantId) return 0;
      
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      
      const { data, error } = await supabase
        .from('leave_applications')
        .select('*')
        .eq('applicant_id', applicantId)
        .eq('status', 'pending')
        .lte('start_date', endDate.toISOString().split('T')[0])
        .gte('start_date', startDate.toISOString().split('T')[0]);
      
      if (error) {
        console.error('Error fetching pending leaves count:', error);
        throw error;
      }
      
      return data?.length || 0;
    },
    enabled: !!applicantId
  });
}
