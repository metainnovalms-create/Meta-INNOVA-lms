import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth, addDays } from 'date-fns';

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
  totalInstitutions: number;
  activeInstitutions: number;
  totalOfficers: number;
  totalStudents: number;
  expiringAgreements: number;
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
 * Hook to fetch staff's monthly attendance summary
 */
export function useStaffAttendanceSummary(userId: string | undefined) {
  const now = new Date();
  const monthStart = format(startOfMonth(now), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['staff-attendance-summary', userId, monthStart],
    queryFn: async (): Promise<AttendanceSummary> => {
      if (!userId) return { daysPresent: 0, totalHoursWorked: 0, overtimeHours: 0 };

      const { data, error } = await supabase
        .from('staff_attendance')
        .select('total_hours_worked, overtime_hours')
        .eq('user_id', userId)
        .gte('date', monthStart)
        .lte('date', monthEnd)
        .in('status', ['checked_out', 'auto_checkout']);

      if (error) throw error;

      const daysPresent = data?.length || 0;
      const totalHoursWorked = data?.reduce((sum, d) => sum + (d.total_hours_worked || 0), 0) || 0;
      const overtimeHours = data?.reduce((sum, d) => sum + (d.overtime_hours || 0), 0) || 0;

      return { daysPresent, totalHoursWorked, overtimeHours };
    },
    enabled: !!userId,
  });
}

/**
 * Hook to calculate staff's salary based on attendance
 */
export function useStaffSalaryCalculation(
  userId: string | undefined,
  annualSalary: number | undefined,
  overtimeMultiplier: number = 1.5,
  normalWorkingHours: number = 8
) {
  const { data: attendanceSummary, isLoading } = useStaffAttendanceSummary(userId);

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
 * Hook to fetch tasks assigned to staff
 */
export function useStaffTasks(userId: string | undefined) {
  return useQuery({
    queryKey: ['staff-tasks', userId],
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
 * Hook to fetch dashboard stats for system admin
 */
export function useStaffDashboardStats() {
  return useQuery({
    queryKey: ['staff-dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      // Get total institutions
      const { count: totalInstitutions } = await supabase
        .from('institutions')
        .select('*', { count: 'exact', head: true });

      // Get active institutions
      const { count: activeInstitutions } = await supabase
        .from('institutions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Get total officers
      const { count: totalOfficers } = await supabase
        .from('officers')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Get total students (active only)
      const { count: totalStudents } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Get expiring agreements (within 30 days)
      const thirtyDaysFromNow = format(addDays(new Date(), 30), 'yyyy-MM-dd');
      const { count: expiringAgreements } = await supabase
        .from('institutions')
        .select('*', { count: 'exact', head: true })
        .lte('mou_end_date', thirtyDaysFromNow)
        .gte('mou_end_date', format(new Date(), 'yyyy-MM-dd'));

      return {
        totalInstitutions: totalInstitutions || 0,
        activeInstitutions: activeInstitutions || 0,
        totalOfficers: totalOfficers || 0,
        totalStudents: totalStudents || 0,
        expiringAgreements: expiringAgreements || 0,
      };
    },
  });
}

/**
 * Hook to fetch user's profile with designation
 */
export function useUserProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ['user-profile', userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email, designation, department, position_name, annual_salary, employee_id')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}
