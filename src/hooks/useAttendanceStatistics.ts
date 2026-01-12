import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, parseISO } from "date-fns";

export interface DailyTrend {
  date: string;
  displayDate: string;
  attendanceRate: number;
  totalStudents: number;
  studentsPresent: number;
  sessionsCount: number;
}

export interface ClassStats {
  classId: string;
  className: string;
  attendanceRate: number;
  totalSessions: number;
  totalStudents: number;
  studentsPresent: number;
}

export interface OfficerStats {
  officerId: string;
  officerName: string;
  attendanceRate: number;
  totalSessions: number;
  totalStudents: number;
  studentsPresent: number;
}

export interface AttendanceStatistics {
  dailyTrend: DailyTrend[];
  byClass: ClassStats[];
  byOfficer: OfficerStats[];
  summary: {
    averageRate: number;
    totalSessions: number;
    totalStudents: number;
    trend: 'up' | 'down' | 'stable';
    trendPercentage: number;
    highestClass: ClassStats | null;
    lowestClass: ClassStats | null;
    highestOfficer: OfficerStats | null;
    lowestOfficer: OfficerStats | null;
  };
}

export type DateRange = '7days' | '30days' | '90days' | 'custom';

export function useAttendanceStatistics(
  institutionId: string | undefined,
  dateRange: DateRange,
  customStartDate?: Date,
  customEndDate?: Date
) {
  const getDateRange = () => {
    const end = new Date();
    let start: Date;
    
    switch (dateRange) {
      case '7days':
        start = subDays(end, 7);
        break;
      case '30days':
        start = subDays(end, 30);
        break;
      case '90days':
        start = subDays(end, 90);
        break;
      case 'custom':
        start = customStartDate || subDays(end, 30);
        break;
      default:
        start = subDays(end, 7);
    }
    
    return {
      startDate: format(start, 'yyyy-MM-dd'),
      endDate: format(customEndDate || end, 'yyyy-MM-dd'),
    };
  };

  return useQuery({
    queryKey: ['attendance-statistics', institutionId, dateRange, customStartDate?.toISOString(), customEndDate?.toISOString()],
    queryFn: async (): Promise<AttendanceStatistics> => {
      if (!institutionId) {
        return getEmptyStats();
      }

      const { startDate, endDate } = getDateRange();

      // Fetch attendance data with class and officer info
      const { data: attendanceData, error } = await supabase
        .from('class_session_attendance')
        .select(`
          id,
          date,
          class_id,
          officer_id,
          total_students,
          students_present,
          students_late,
          students_absent,
          is_session_completed,
          classes:class_id (class_name),
          officers:officer_id (full_name)
        `)
        .eq('institution_id', institutionId)
        .eq('is_session_completed', true)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date');

      if (error) {
        console.error('[useAttendanceStatistics] Error fetching data:', error);
        return getEmptyStats();
      }

      if (!attendanceData || attendanceData.length === 0) {
        return getEmptyStats();
      }

      // Process daily trend
      const dailyMap = new Map<string, { total: number; present: number; sessions: number }>();
      attendanceData.forEach((record) => {
        const existing = dailyMap.get(record.date) || { total: 0, present: 0, sessions: 0 };
        dailyMap.set(record.date, {
          total: existing.total + (record.total_students || 0),
          present: existing.present + (record.students_present || 0),
          sessions: existing.sessions + 1,
        });
      });

      const dailyTrend: DailyTrend[] = Array.from(dailyMap.entries())
        .map(([date, data]) => ({
          date,
          displayDate: format(parseISO(date), 'MMM d'),
          attendanceRate: data.total > 0 ? Math.round((data.present / data.total) * 100) : 0,
          totalStudents: data.total,
          studentsPresent: data.present,
          sessionsCount: data.sessions,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Process by class
      const classMap = new Map<string, { name: string; total: number; present: number; sessions: number }>();
      attendanceData.forEach((record) => {
        if (!record.class_id) return;
        const className = (record.classes as any)?.class_name || 'Unknown Class';
        const existing = classMap.get(record.class_id) || { name: className, total: 0, present: 0, sessions: 0 };
        classMap.set(record.class_id, {
          name: className,
          total: existing.total + (record.total_students || 0),
          present: existing.present + (record.students_present || 0),
          sessions: existing.sessions + 1,
        });
      });

      const byClass: ClassStats[] = Array.from(classMap.entries())
        .map(([classId, data]) => ({
          classId,
          className: data.name,
          attendanceRate: data.total > 0 ? Math.round((data.present / data.total) * 100) : 0,
          totalSessions: data.sessions,
          totalStudents: data.total,
          studentsPresent: data.present,
        }))
        .sort((a, b) => b.attendanceRate - a.attendanceRate);

      // Process by officer
      const officerMap = new Map<string, { name: string; total: number; present: number; sessions: number }>();
      attendanceData.forEach((record) => {
        if (!record.officer_id) return;
        const officerName = (record.officers as any)?.full_name || 'Unknown Officer';
        const existing = officerMap.get(record.officer_id) || { name: officerName, total: 0, present: 0, sessions: 0 };
        officerMap.set(record.officer_id, {
          name: officerName,
          total: existing.total + (record.total_students || 0),
          present: existing.present + (record.students_present || 0),
          sessions: existing.sessions + 1,
        });
      });

      const byOfficer: OfficerStats[] = Array.from(officerMap.entries())
        .map(([officerId, data]) => ({
          officerId,
          officerName: data.name,
          attendanceRate: data.total > 0 ? Math.round((data.present / data.total) * 100) : 0,
          totalSessions: data.sessions,
          totalStudents: data.total,
          studentsPresent: data.present,
        }))
        .sort((a, b) => b.attendanceRate - a.attendanceRate);

      // Calculate summary
      const totalStudents = attendanceData.reduce((sum, r) => sum + (r.total_students || 0), 0);
      const totalPresent = attendanceData.reduce((sum, r) => sum + (r.students_present || 0), 0);
      const averageRate = totalStudents > 0 ? Math.round((totalPresent / totalStudents) * 100) : 0;

      // Calculate trend (compare first half vs second half)
      const midpoint = Math.floor(dailyTrend.length / 2);
      const firstHalf = dailyTrend.slice(0, midpoint);
      const secondHalf = dailyTrend.slice(midpoint);
      
      const firstHalfAvg = firstHalf.length > 0
        ? firstHalf.reduce((sum, d) => sum + d.attendanceRate, 0) / firstHalf.length
        : 0;
      const secondHalfAvg = secondHalf.length > 0
        ? secondHalf.reduce((sum, d) => sum + d.attendanceRate, 0) / secondHalf.length
        : 0;
      
      const trendDiff = secondHalfAvg - firstHalfAvg;
      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (trendDiff > 2) trend = 'up';
      else if (trendDiff < -2) trend = 'down';

      return {
        dailyTrend,
        byClass,
        byOfficer,
        summary: {
          averageRate,
          totalSessions: attendanceData.length,
          totalStudents,
          trend,
          trendPercentage: Math.abs(Math.round(trendDiff)),
          highestClass: byClass[0] || null,
          lowestClass: byClass[byClass.length - 1] || null,
          highestOfficer: byOfficer[0] || null,
          lowestOfficer: byOfficer[byOfficer.length - 1] || null,
        },
      };
    },
    enabled: !!institutionId,
  });
}

function getEmptyStats(): AttendanceStatistics {
  return {
    dailyTrend: [],
    byClass: [],
    byOfficer: [],
    summary: {
      averageRate: 0,
      totalSessions: 0,
      totalStudents: 0,
      trend: 'stable',
      trendPercentage: 0,
      highestClass: null,
      lowestClass: null,
      highestOfficer: null,
      lowestOfficer: null,
    },
  };
}
