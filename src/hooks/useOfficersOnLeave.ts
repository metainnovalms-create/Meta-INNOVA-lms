import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export interface SubstituteAssignment {
  class_name: string;
  subject: string;
  date: string;
  day: string;
  period_label: string;
  period_time: string;
  substitute_officer_id: string;
  substitute_officer_name: string;
  original_officer_id: string;
  original_officer_name: string;
}

export interface OfficerLeaveDetails {
  id: string;
  officerName: string;
  officerId: string;
  startDate: string;
  endDate: string;
  leaveType: string;
  totalDays: number;
  reason: string;
  substituteAssignments: SubstituteAssignment[];
}

export function useOfficersOnLeave(institutionId: string | undefined) {
  return useQuery({
    queryKey: ['officers-on-leave', institutionId],
    queryFn: async (): Promise<OfficerLeaveDetails[]> => {
      if (!institutionId) return [];

      const today = format(new Date(), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('leave_applications')
        .select('*')
        .eq('status', 'approved')
        .eq('institution_id', institutionId)
        .lte('start_date', today)
        .gte('end_date', today);

      if (error) {
        console.error('Error fetching officers on leave:', error);
        throw error;
      }

      return (data || []).map(leave => ({
        id: leave.id,
        officerName: leave.applicant_name,
        officerId: leave.officer_id || leave.applicant_id,
        startDate: leave.start_date,
        endDate: leave.end_date,
        leaveType: leave.leave_type,
        totalDays: leave.total_days,
        reason: leave.reason,
        substituteAssignments: Array.isArray(leave.substitute_assignments) 
          ? (leave.substitute_assignments as unknown as SubstituteAssignment[])
          : [],
      }));
    },
    enabled: !!institutionId,
  });
}
