import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ClassAnalytics } from '@/types/institution';

export function useClassAnalytics(classId: string | undefined, institutionId?: string) {
  return useQuery({
    queryKey: ['class-analytics', classId],
    queryFn: async (): Promise<ClassAnalytics | null> => {
      if (!classId) return null;

      // Fetch students in this class
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('id, user_id, student_name, status, gender')
        .eq('class_id', classId);

      if (studentsError) throw studentsError;

      // Fetch attendance records for this class
      const { data: attendance, error: attendanceError } = await supabase
        .from('class_session_attendance')
        .select('students_present, students_absent, students_late, total_students, date')
        .eq('class_id', classId)
        .order('date', { ascending: false })
        .limit(100);

      if (attendanceError) throw attendanceError;

      // Fetch assessment attempts for this class
      const { data: assessmentAttempts, error: assessmentError } = await supabase
        .from('assessment_attempts')
        .select('student_id, percentage, passed, score, total_points')
        .eq('class_id', classId)
        .eq('status', 'submitted');

      if (assessmentError) throw assessmentError;

      // Fetch XP transactions for top students
      const studentUserIds = students?.map(s => s.user_id).filter(Boolean) || [];
      let xpData: { student_id: string; points_earned: number }[] = [];
      
      if (studentUserIds.length > 0) {
        const { data: xp, error: xpError } = await supabase
          .from('student_xp_transactions')
          .select('student_id, points_earned')
          .in('student_id', studentUserIds);
        
        if (!xpError && xp) {
          xpData = xp;
        }
      }

      // Calculate student metrics
      const totalStudents = students?.length || 0;
      const activeStudents = students?.filter(s => s.status === 'active').length || 0;

      // Gender distribution
      const genderDistribution = {
        male: students?.filter(s => s.gender === 'male').length || 0,
        female: students?.filter(s => s.gender === 'female').length || 0,
        other: students?.filter(s => s.gender === 'other' || !s.gender).length || 0,
      };

      // Calculate attendance rate
      let averageAttendanceRate = 0;
      if (attendance && attendance.length > 0) {
        const totalPresent = attendance.reduce((sum, a) => sum + (a.students_present || 0), 0);
        const totalStudentsAttendance = attendance.reduce((sum, a) => sum + (a.total_students || 0), 0);
        averageAttendanceRate = totalStudentsAttendance > 0 
          ? Math.round((totalPresent / totalStudentsAttendance) * 1000) / 10 
          : 0;
      }

      // Calculate academic metrics
      let averageGrade = 0;
      const performanceDistribution = { excellent: 0, good: 0, average: 0, below_average: 0 };
      
      if (assessmentAttempts && assessmentAttempts.length > 0) {
        const totalPercentage = assessmentAttempts.reduce((sum, a) => sum + (a.percentage || 0), 0);
        averageGrade = Math.round((totalPercentage / assessmentAttempts.length) * 10) / 10;

        // Performance distribution based on percentage
        assessmentAttempts.forEach(a => {
          const pct = a.percentage || 0;
          if (pct >= 85) performanceDistribution.excellent++;
          else if (pct >= 70) performanceDistribution.good++;
          else if (pct >= 50) performanceDistribution.average++;
          else performanceDistribution.below_average++;
        });
      }

      // Calculate attendance trends by month
      const attendanceTrends: { month: string; attendance_rate: number }[] = [];
      if (attendance && attendance.length > 0) {
        const monthlyData: Record<string, { present: number; total: number }> = {};
        
        attendance.forEach(a => {
          const date = new Date(a.date);
          const monthKey = date.toLocaleString('default', { month: 'short' });
          
          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { present: 0, total: 0 };
          }
          monthlyData[monthKey].present += a.students_present || 0;
          monthlyData[monthKey].total += a.total_students || 0;
        });

        Object.entries(monthlyData).forEach(([month, data]) => {
          if (data.total > 0) {
            attendanceTrends.push({
              month,
              attendance_rate: Math.round((data.present / data.total) * 1000) / 10,
            });
          }
        });
      }

      // Calculate top students based on XP
      const studentXpTotals: Record<string, number> = {};
      xpData.forEach(xp => {
        if (!studentXpTotals[xp.student_id]) {
          studentXpTotals[xp.student_id] = 0;
        }
        studentXpTotals[xp.student_id] += xp.points_earned;
      });

      const topStudents = Object.entries(studentXpTotals)
        .map(([userId, points]) => {
          const student = students?.find(s => s.user_id === userId);
          return {
            student_id: student?.id || userId,
            student_name: student?.student_name || 'Unknown',
            total_points: points,
            rank: 0,
          };
        })
        .sort((a, b) => b.total_points - a.total_points)
        .slice(0, 5)
        .map((s, index) => ({ ...s, rank: index + 1 }));

      const analytics: ClassAnalytics = {
        class_id: classId,
        period: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
        student_metrics: {
          total_students: totalStudents,
          active_students: activeStudents,
          average_attendance_rate: averageAttendanceRate,
          gender_distribution: genderDistribution,
        },
        academic_metrics: {
          average_grade: averageGrade,
          assignment_completion_rate: 0,
          quiz_average_score: 0,
          top_performers_count: performanceDistribution.excellent,
          students_needing_attention: performanceDistribution.below_average,
          performance_distribution: performanceDistribution,
        },
        course_metrics: {
          total_courses_assigned: 0,
          overall_completion_rate: 0,
          average_modules_completed: 0,
          assignment_submission_rate: 0,
          quiz_attempt_rate: 0,
        },
        engagement_metrics: {
          average_login_frequency: 0,
          content_views_total: 0,
          project_participation_rate: 0,
        },
        attendance_trends: attendanceTrends.length > 0 ? attendanceTrends : [
          { month: 'N/A', attendance_rate: 0 }
        ],
        top_students: topStudents.length > 0 ? topStudents : [],
      };

      return analytics;
    },
    enabled: !!classId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
