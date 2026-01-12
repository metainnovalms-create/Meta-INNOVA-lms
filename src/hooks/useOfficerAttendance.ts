/**
 * React Query hooks for Officer Attendance
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  getOfficerTodayAttendance,
  getOfficerMonthlyAttendance,
  getInstitutionMonthlyAttendance,
  getAllOfficerAttendanceForMonth,
  getAllTodayAttendance,
  recordCheckIn,
  recordCheckOut,
  getInstitutionGPSSettings,
  type CheckInParams,
  type CheckOutParams,
  type OfficerAttendanceRecord,
} from '@/services/officer-attendance.service';
import { useEffect } from 'react';

// Query keys
export const officerAttendanceKeys = {
  all: ['officer-attendance'] as const,
  today: (officerId: string, institutionId: string) =>
    [...officerAttendanceKeys.all, 'today', officerId, institutionId] as const,
  monthly: (officerId: string, month: string) =>
    [...officerAttendanceKeys.all, 'monthly', officerId, month] as const,
  institutionMonthly: (institutionId: string, month: string) =>
    [...officerAttendanceKeys.all, 'institution', institutionId, month] as const,
  allMonthly: (month: string) =>
    [...officerAttendanceKeys.all, 'all', month] as const,
  allToday: () => [...officerAttendanceKeys.all, 'all-today'] as const,
  institutionSettings: (institutionId: string) =>
    [...officerAttendanceKeys.all, 'settings', institutionId] as const,
};

/**
 * Hook to get officer's today attendance
 */
export const useOfficerTodayAttendance = (officerId: string, institutionId: string) => {
  return useQuery({
    queryKey: officerAttendanceKeys.today(officerId, institutionId),
    queryFn: () => getOfficerTodayAttendance(officerId, institutionId),
    enabled: !!officerId && !!institutionId,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
};

/**
 * Hook to get officer's monthly attendance
 */
export const useOfficerMonthlyAttendance = (officerId: string, month: string) => {
  return useQuery({
    queryKey: officerAttendanceKeys.monthly(officerId, month),
    queryFn: () => getOfficerMonthlyAttendance(officerId, month),
    enabled: !!officerId && !!month,
  });
};

/**
 * Hook to get institution's monthly attendance
 */
export const useInstitutionMonthlyAttendance = (institutionId: string, month: string) => {
  return useQuery({
    queryKey: officerAttendanceKeys.institutionMonthly(institutionId, month),
    queryFn: () => getInstitutionMonthlyAttendance(institutionId, month),
    enabled: !!institutionId && !!month,
  });
};

/**
 * Hook to get all officer attendance for a month (CEO view)
 */
export const useAllOfficerAttendanceForMonth = (month: string) => {
  return useQuery({
    queryKey: officerAttendanceKeys.allMonthly(month),
    queryFn: () => getAllOfficerAttendanceForMonth(month),
    enabled: !!month,
  });
};

/**
 * Hook to get today's attendance for all officers (CEO view)
 */
export const useAllTodayAttendance = () => {
  return useQuery({
    queryKey: officerAttendanceKeys.allToday(),
    queryFn: getAllTodayAttendance,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
};

/**
 * Hook to get institution GPS settings
 */
export const useInstitutionGPSSettings = (institutionId: string) => {
  return useQuery({
    queryKey: officerAttendanceKeys.institutionSettings(institutionId),
    queryFn: () => getInstitutionGPSSettings(institutionId),
    enabled: !!institutionId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
};

/**
 * Hook for check-in mutation
 */
export const useCheckIn = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: recordCheckIn,
    onSuccess: (data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: officerAttendanceKeys.today(variables.officer_id, variables.institution_id),
      });
      queryClient.invalidateQueries({
        queryKey: officerAttendanceKeys.allToday(),
      });
    },
  });
};

/**
 * Hook for check-out mutation
 */
export const useCheckOut = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: recordCheckOut,
    onSuccess: (data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: officerAttendanceKeys.today(variables.officer_id, variables.institution_id),
      });
      queryClient.invalidateQueries({
        queryKey: officerAttendanceKeys.allToday(),
      });
    },
  });
};

/**
 * Hook for real-time attendance updates
 */
export const useOfficerAttendanceRealtime = (institutionId?: string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('officer-attendance-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'officer_attendance',
          ...(institutionId ? { filter: `institution_id=eq.${institutionId}` } : {}),
        },
        (payload) => {
          console.log('Officer attendance change:', payload);
          // Invalidate all attendance queries
          queryClient.invalidateQueries({
            queryKey: officerAttendanceKeys.all,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, institutionId]);
};

/**
 * Aggregate attendance data for display
 */
export interface AggregatedOfficerAttendance {
  officer_id: string;
  officer_name: string;
  employee_id: string;
  institution_id: string;
  institution_name: string;
  month: string;
  present_days: number;
  absent_days: number;
  leave_days: number;
  total_hours_worked: number;
  overtime_hours: number;
  daily_records: OfficerAttendanceRecord[];
  last_marked_date: string;
}

/**
 * Helper to aggregate attendance records by officer
 */
export const aggregateAttendanceByOfficer = (
  records: OfficerAttendanceRecord[],
  officers: Array<{ id: string; full_name: string; employee_id?: string }>,
  institutions: Array<{ id: string; name: string }>,
  month: string
): AggregatedOfficerAttendance[] => {
  // Group records by officer
  const groupedByOfficer: Record<string, OfficerAttendanceRecord[]> = {};
  
  records.forEach((record) => {
    if (!groupedByOfficer[record.officer_id]) {
      groupedByOfficer[record.officer_id] = [];
    }
    groupedByOfficer[record.officer_id].push(record);
  });

  return Object.entries(groupedByOfficer).map(([officerId, officerRecords]) => {
    const officer = officers.find((o) => o.id === officerId);
    const institution = institutions.find((i) => i.id === officerRecords[0]?.institution_id);

    let presentDays = 0;
    let totalHours = 0;
    let overtimeHours = 0;

    officerRecords.forEach((record) => {
      if (record.status === 'checked_in' || record.status === 'checked_out') {
        presentDays++;
      }
      totalHours += record.total_hours_worked || 0;
      overtimeHours += record.overtime_hours || 0;
    });

    return {
      officer_id: officerId,
      officer_name: officer?.full_name || 'Unknown',
      employee_id: officer?.employee_id || officerId,
      institution_id: officerRecords[0]?.institution_id || '',
      institution_name: institution?.name || 'Unknown',
      month,
      present_days: presentDays,
      absent_days: 0, // Would need to calculate based on working days in month
      leave_days: 0, // Would need to integrate with leave system
      total_hours_worked: Math.round(totalHours * 100) / 100,
      overtime_hours: Math.round(overtimeHours * 100) / 100,
      daily_records: officerRecords,
      last_marked_date: officerRecords[officerRecords.length - 1]?.date || '',
    };
  });
};
