import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth } from 'date-fns';

interface AttendanceSummary {
  daysPresent: number;
  totalHoursWorked: number;
  overtimeHours: number;
}

interface SalaryCalculation {
  monthlyBase: number;
  daysPresent: number;
  workingDays: number;
  earnedSalary: number;
  overtimeHours: number;
  overtimePay: number;
  totalEarnings: number;
  progressPercentage: number;
}

interface DashboardStats {
  upcomingSessions: number;
  activeProjects: number;
  labEquipment: number;
  studentsEnrolled: number;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  due_date: string | null;
}

/**
 * Hook to fetch officer's monthly attendance summary
 */
export function useOfficerAttendanceSummary(officerId: string | undefined) {
  const now = new Date();
  const monthStart = format(startOfMonth(now), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['officer-attendance-summary', officerId, monthStart],
    queryFn: async (): Promise<AttendanceSummary> => {
      if (!officerId) return { daysPresent: 0, totalHoursWorked: 0, overtimeHours: 0 };

      const { data, error } = await supabase
        .from('officer_attendance')
        .select('total_hours_worked, overtime_hours')
        .eq('officer_id', officerId)
        .gte('date', monthStart)
        .lte('date', monthEnd)
        .in('status', ['checked_out', 'auto_checkout']);

      if (error) throw error;

      const daysPresent = data?.length || 0;
      const totalHoursWorked = data?.reduce((sum, d) => sum + (d.total_hours_worked || 0), 0) || 0;
      const overtimeHours = data?.reduce((sum, d) => sum + (d.overtime_hours || 0), 0) || 0;

      return { daysPresent, totalHoursWorked, overtimeHours };
    },
    enabled: !!officerId,
  });
}

/**
 * Hook to calculate officer's salary based on attendance
 */
export function useOfficerSalaryCalculation(
  officerId: string | undefined,
  annualSalary: number | undefined,
  overtimeMultiplier: number = 1.5,
  normalWorkingHours: number = 8
) {
  const { data: attendanceSummary, isLoading } = useOfficerAttendanceSummary(officerId);

  const now = new Date();
  const workingDaysInMonth = 26; // Approximate working days

  const monthlyBase = (annualSalary || 0) / 12;
  const perDayRate = monthlyBase / workingDaysInMonth;
  const perHourRate = perDayRate / normalWorkingHours;

  const daysPresent = attendanceSummary?.daysPresent || 0;
  const overtimeHours = attendanceSummary?.overtimeHours || 0;

  const earnedSalary = daysPresent * perDayRate;
  const overtimePay = overtimeHours * perHourRate * overtimeMultiplier;
  const totalEarnings = earnedSalary + overtimePay;

  // Calculate progress based on days worked / total working days
  const dayOfMonth = now.getDate();
  const expectedDays = Math.min(dayOfMonth, workingDaysInMonth);
  const progressPercentage = expectedDays > 0 ? (daysPresent / expectedDays) * 100 : 0;

  return {
    isLoading,
    data: {
      monthlyBase,
      daysPresent,
      workingDays: workingDaysInMonth,
      earnedSalary,
      overtimeHours,
      overtimePay,
      totalEarnings,
      progressPercentage: Math.min(progressPercentage, 100),
    } as SalaryCalculation,
  };
}

/**
 * Hook to fetch tasks assigned to officer
 */
export function useOfficerTasks(userId: string | undefined) {
  return useQuery({
    queryKey: ['officer-tasks', userId],
    queryFn: async (): Promise<Task[]> => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('tasks')
        .select('id, title, description, priority, status, due_date')
        .eq('assigned_to_id', userId)
        .neq('status', 'completed')
        .neq('status', 'approved')
        .order('priority', { ascending: false })
        .order('due_date', { ascending: true })
        .limit(5);

      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });
}

/**
 * Hook to fetch dashboard stats for officer
 */
export function useOfficerDashboardStats(officerId: string | undefined, institutionId: string | undefined) {
  return useQuery({
    queryKey: ['officer-dashboard-stats', officerId, institutionId],
    queryFn: async (): Promise<DashboardStats> => {
      if (!officerId || !institutionId) {
        return { upcomingSessions: 0, activeProjects: 0, labEquipment: 0, studentsEnrolled: 0 };
      }

      const today = format(new Date(), 'EEEE'); // e.g., 'Monday'

      // Get upcoming sessions count from timetable assignments
      const { count: sessionsCount } = await supabase
        .from('institution_timetable_assignments')
        .select('*', { count: 'exact', head: true })
        .eq('institution_id', institutionId)
        .eq('teacher_id', officerId);

      // Get active projects count (use multiple possible status values)
      const { count: projectsCount } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('institution_id', institutionId)
        .in('status', ['in_progress', 'ongoing', 'submitted']);

      // Get lab equipment count
      const { count: equipmentCount } = await supabase
        .from('inventory_items')
        .select('*', { count: 'exact', head: true })
        .eq('institution_id', institutionId);

      // Get students enrolled count
      const { count: studentsCount } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('institution_id', institutionId)
        .eq('status', 'active');

      return {
        upcomingSessions: sessionsCount || 0,
        activeProjects: projectsCount || 0,
        labEquipment: equipmentCount || 0,
        studentsEnrolled: studentsCount || 0,
      };
    },
    enabled: !!officerId && !!institutionId,
  });
}
