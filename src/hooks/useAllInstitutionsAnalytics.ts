import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { InstitutionEngagement } from '@/data/mockInstitutionEngagement';

export function useAllInstitutionsAnalytics() {
  return useQuery({
    queryKey: ['all-institutions-analytics'],
    queryFn: async (): Promise<InstitutionEngagement[]> => {
      // Fetch all institutions
      const { data: institutions, error: instError } = await supabase
        .from('institutions')
        .select('id, name')
        .eq('status', 'active');

      if (instError) {
        console.error('Error fetching institutions:', instError);
        throw instError;
      }

      if (!institutions || institutions.length === 0) {
        return [];
      }

      // Fetch students per institution
      const { data: studentCounts } = await supabase
        .from('students')
        .select('institution_id, status');

      // Fetch classes per institution
      const { data: classCounts } = await supabase
        .from('classes')
        .select('institution_id');

      // Fetch attendance data
      const { data: attendanceData } = await supabase
        .from('class_session_attendance')
        .select('institution_id, students_present, total_students, date');

      // Fetch assessment attempts
      const { data: assessmentData } = await supabase
        .from('assessment_attempts')
        .select('institution_id, passed, percentage, submitted_at');

      // Fetch course assignments
      const { data: courseAssignments } = await supabase
        .from('course_class_assignments')
        .select('institution_id, course_id');

      // Calculate analytics for each institution
      const analyticsData: InstitutionEngagement[] = institutions.map(inst => {
        // Student metrics
        const instStudents = studentCounts?.filter(s => s.institution_id === inst.id) || [];
        const activeStudents = instStudents.filter(s => s.status === 'active').length;
        const inactiveStudents = instStudents.filter(s => s.status !== 'active').length;
        const totalStudents = instStudents.length;

        // Class count
        const classCount = classCounts?.filter(c => c.institution_id === inst.id).length || 0;

        // Attendance metrics
        const instAttendance = attendanceData?.filter(a => a.institution_id === inst.id) || [];
        let avgAttendanceRate = 0;
        if (instAttendance.length > 0) {
          const totalPresent = instAttendance.reduce((sum, a) => sum + (a.students_present || 0), 0);
          const totalExpected = instAttendance.reduce((sum, a) => sum + (a.total_students || 0), 0);
          avgAttendanceRate = totalExpected > 0 ? Math.round((totalPresent / totalExpected) * 100) : 0;
        }

        // Assessment metrics
        const instAssessments = assessmentData?.filter(a => a.institution_id === inst.id) || [];
        const completedAssessments = instAssessments.length;
        const passedAssessments = instAssessments.filter(a => a.passed).length;
        const avgScore = instAssessments.length > 0
          ? Math.round(instAssessments.reduce((sum, a) => sum + (a.percentage || 0), 0) / instAssessments.length)
          : 0;
        const passRate = completedAssessments > 0 
          ? Math.round((passedAssessments / completedAssessments) * 100) 
          : 0;

        // Course metrics
        const instCourses = courseAssignments?.filter(c => c.institution_id === inst.id) || [];
        const totalCourses = instCourses.length;
        const coursesInUse = new Set(instCourses.map(c => c.course_id)).size;

        // Calculate engagement score (weighted average)
        // 40% attendance, 30% assessment participation, 20% course usage, 10% active students ratio
        const studentRatio = totalStudents > 0 ? (activeStudents / totalStudents) * 100 : 0;
        const courseUsageRate = totalCourses > 0 ? (coursesInUse / totalCourses) * 100 : 0;
        const participationRate = totalStudents > 0 && completedAssessments > 0 
          ? Math.min(100, (completedAssessments / totalStudents) * 100)
          : 0;

        const engagementScore = Math.round(
          (avgAttendanceRate * 0.4) +
          (participationRate * 0.3) +
          (courseUsageRate * 0.2) +
          (studentRatio * 0.1)
        );

        // Determine risk level
        let riskLevel: 'low' | 'medium' | 'high' = 'low';
        if (engagementScore < 40) riskLevel = 'high';
        else if (engagementScore < 70) riskLevel = 'medium';

        // Calculate trend based on recent activity
        const recentAttendance = instAttendance
          .filter(a => new Date(a.date) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        let trend: 'increasing' | 'stable' | 'declining' = 'stable';
        if (recentAttendance.length >= 4) {
          const firstHalf = recentAttendance.slice(0, Math.floor(recentAttendance.length / 2));
          const secondHalf = recentAttendance.slice(Math.floor(recentAttendance.length / 2));
          
          const avgFirst = firstHalf.reduce((sum, a) => sum + (a.students_present || 0), 0) / firstHalf.length;
          const avgSecond = secondHalf.reduce((sum, a) => sum + (a.students_present || 0), 0) / secondHalf.length;
          
          if (avgSecond > avgFirst * 1.1) trend = 'increasing';
          else if (avgSecond < avgFirst * 0.9) trend = 'declining';
        }

        // Days since last activity
        const lastAttendanceDate = instAttendance.length > 0
          ? Math.max(...instAttendance.map(a => new Date(a.date).getTime()))
          : null;
        const lastAssessmentDate = instAssessments.length > 0
          ? Math.max(...instAssessments.filter(a => a.submitted_at).map(a => new Date(a.submitted_at!).getTime()))
          : null;
        
        const lastActivityDate = Math.max(lastAttendanceDate || 0, lastAssessmentDate || 0);
        const daysSinceActivity = lastActivityDate > 0
          ? Math.floor((Date.now() - lastActivityDate) / (24 * 60 * 60 * 1000))
          : 999;

        return {
          institution_id: inst.id,
          institution_name: inst.name,
          period: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          course_metrics: {
            total_courses_assigned: totalCourses,
            courses_in_use: coursesInUse,
            average_completion_rate: courseUsageRate,
            active_students: activeStudents,
            inactive_students: inactiveStudents,
            daily_active_users: Math.round(activeStudents * 0.6), // Estimate
            weekly_active_users: Math.round(activeStudents * 0.85), // Estimate
            most_used_courses: [],
            least_used_courses: []
          },
          assessment_metrics: {
            total_assessments_created: completedAssessments,
            assessments_completed: completedAssessments,
            average_participation_rate: participationRate,
            average_score: avgScore,
            assessments_pending: 0
          },
          lab_metrics: {
            active_projects: 0,
            students_participating: 0,
            lab_sessions_conducted: 0,
            equipment_utilization_rate: 0
          },
          engagement_score: engagementScore,
          engagement_trend: trend,
          risk_level: riskLevel,
          last_login_date: lastActivityDate > 0 ? new Date(lastActivityDate).toISOString() : new Date().toISOString(),
          days_since_last_activity: daysSinceActivity,
          support_tickets: {
            open: 0,
            resolved: 0,
            average_resolution_time: 0
          }
        };
      });

      return analyticsData;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
