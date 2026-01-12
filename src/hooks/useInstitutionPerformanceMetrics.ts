import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PerformanceMetrics {
  passRate: number;
  avgAttendance: number;
  engagementScore: number;
  hasData: boolean;
}

export function useInstitutionPerformanceMetrics(institutionId: string | undefined) {
  return useQuery({
    queryKey: ['institution-performance-metrics', institutionId],
    queryFn: async (): Promise<PerformanceMetrics> => {
      if (!institutionId) {
        return { passRate: 0, avgAttendance: 0, engagementScore: 0, hasData: false };
      }

      // Get assessment pass rate
      const { data: assessmentData } = await supabase
        .from('assessment_attempts')
        .select('passed, percentage')
        .eq('institution_id', institutionId);

      // Get attendance data from class_session_attendance
      const { data: attendanceData } = await supabase
        .from('class_session_attendance')
        .select('students_present, total_students')
        .eq('institution_id', institutionId);

      // Calculate pass rate
      let passRate = 0;
      if (assessmentData && assessmentData.length > 0) {
        const passedCount = assessmentData.filter(a => a.passed).length;
        passRate = Math.round((passedCount / assessmentData.length) * 100);
      }

      // Calculate average attendance from session data
      let avgAttendance = 0;
      if (attendanceData && attendanceData.length > 0) {
        const totalPresent = attendanceData.reduce((sum, a) => sum + (a.students_present || 0), 0);
        const totalStudents = attendanceData.reduce((sum, a) => sum + (a.total_students || 0), 0);
        if (totalStudents > 0) {
          avgAttendance = Math.round((totalPresent / totalStudents) * 100);
        }
      }

      // Calculate engagement score (based on assessment completion and average percentage)
      let engagementScore = 0;
      if (assessmentData && assessmentData.length > 0) {
        const avgPercentage = assessmentData.reduce((sum, a) => sum + (a.percentage || 0), 0) / assessmentData.length;
        engagementScore = Math.round(avgPercentage);
      }

      const hasData = (assessmentData && assessmentData.length > 0) || (attendanceData && attendanceData.length > 0);

      return {
        passRate,
        avgAttendance,
        engagementScore,
        hasData,
      };
    },
    enabled: !!institutionId,
  });
}
