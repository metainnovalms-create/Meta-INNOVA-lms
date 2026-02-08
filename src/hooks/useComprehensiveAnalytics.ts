import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { calculateWeightedScore, WEIGHTAGE } from '@/utils/assessmentWeightageCalculator';
import { AssessmentAttempt } from '@/types/assessment';

export interface WeightedAssessmentBreakdown {
  fa1_score: number;
  fa2_score: number;
  final_score: number;
  internal_score: number;
  total_weighted: number;
}

export interface StudentPerformance {
  student_id: string;
  user_id: string | null;
  student_name: string;
  class_name: string;
  class_id: string;
  assessment_avg: number;
  assessment_pass_rate: number;
  assignment_avg: number;
  total_xp: number;
  badges_count: number;
  projects_count: number;
  course_completion: number;
  overall_score: number;
  rank?: number;
  weighted_assessment?: WeightedAssessmentBreakdown;
}

export interface ClassPerformance {
  class_id: string;
  class_name: string;
  total_students: number;
  assessment_avg: number;
  assessment_pass_rate: number;
  assignment_avg: number;
  total_xp: number;
  avg_badges: number;
  avg_projects: number;
  course_completion: number;
  overall_score: number;
  topStudents: StudentPerformance[];
  allStudents: StudentPerformance[];
  weighted_assessment?: WeightedAssessmentBreakdown;
}

export interface InstitutionPerformance {
  total_students: number;
  total_classes: number;
  assessment_avg: number;
  assessment_pass_rate: number;
  assignment_avg: number;
  total_xp: number;
  total_badges: number;
  total_projects: number;
  course_completion: number;
  topStudents: StudentPerformance[];
  allStudents: StudentPerformance[];
  classPerformance: ClassPerformance[];
  weighted_assessment?: WeightedAssessmentBreakdown;
}

export function useComprehensiveAnalytics(institutionId: string | undefined) {
  return useQuery({
    queryKey: ['comprehensive-analytics', institutionId],
    queryFn: async (): Promise<InstitutionPerformance | null> => {
      if (!institutionId) return null;

      // Fetch all students for this institution
      const { data: students } = await supabase
        .from('students')
        .select('id, user_id, student_name, class_id, status')
        .eq('institution_id', institutionId)
        .eq('status', 'active');

      // Fetch classes
      const { data: classes } = await supabase
        .from('classes')
        .select('id, class_name, section')
        .eq('institution_id', institutionId)
        .eq('status', 'active');

      // Fetch class assessment mappings for this institution
      const { data: assessmentMappings } = await supabase
        .from('class_assessment_mapping')
        .select('*')
        .eq('institution_id', institutionId);

      // Fetch internal assessment marks
      const { data: internalMarks } = await supabase
        .from('internal_assessment_marks')
        .select('*')
        .eq('institution_id', institutionId);

      // Fetch assessment attempts
      const { data: assessmentAttempts } = await supabase
        .from('assessment_attempts')
        .select('id, student_id, class_id, assessment_id, percentage, passed, score, total_points, status')
        .eq('institution_id', institutionId);

      // Fetch assignment submissions
      const { data: assignmentSubmissions } = await supabase
        .from('assignment_submissions')
        .select(`
          student_id, class_id, marks_obtained,
          assignments:assignment_id (total_marks)
        `)
        .eq('institution_id', institutionId)
        .eq('status', 'graded');

      // Fetch XP transactions - use student user_ids
      const studentUserIds = students?.map(s => s.user_id).filter(Boolean) as string[] || [];
      let xpData: { student_id: string; points_earned: number }[] = [];
      if (studentUserIds.length > 0) {
        const { data: xp } = await supabase
          .from('student_xp_transactions')
          .select('student_id, points_earned')
          .in('student_id', studentUserIds);
        xpData = xp || [];
      }

      // Fetch badges
      let badgesData: { student_id: string; badge_id: string }[] = [];
      if (studentUserIds.length > 0) {
        const { data: badges } = await supabase
          .from('student_badges')
          .select('student_id, badge_id')
          .in('student_id', studentUserIds);
        badgesData = badges || [];
      }

      // Fetch project memberships - use student record IDs
      const studentRecordIds = students?.map(s => s.id) || [];
      let projectsData: { student_id: string; project_id: string }[] = [];
      if (studentRecordIds.length > 0) {
        const { data: projects } = await supabase
          .from('project_members')
          .select('student_id, project_id')
          .in('student_id', studentRecordIds);
        projectsData = projects || [];
      }

      // Fetch course class assignments for this institution
      const { data: courseAssignments } = await supabase
        .from('course_class_assignments')
        .select('id, course_id, class_id')
        .eq('institution_id', institutionId);

      const assignmentIds = courseAssignments?.map(ca => ca.id) || [];

      // Fetch course completions using student record IDs (students.id, not user_id)
      let contentCompletions: { student_id: string; content_id: string; class_assignment_id: string }[] = [];
      if (studentRecordIds.length > 0 && assignmentIds.length > 0) {
        const { data: completions } = await supabase
          .from('student_content_completions')
          .select('student_id, content_id, class_assignment_id')
          .in('student_id', studentRecordIds)
          .in('class_assignment_id', assignmentIds);
        contentCompletions = completions || [];
      }

      // Build a map of class_id -> total content count for assigned courses
      const classContentCountMap = new Map<string, number>();
      
      if (courseAssignments && courseAssignments.length > 0) {
        const courseIds = [...new Set(courseAssignments.map(ca => ca.course_id))];
        
        const { data: courseContent } = await supabase
          .from('course_content')
          .select('id, course_id')
          .in('course_id', courseIds);

        const courseContentMap = new Map<string, number>();
        courseContent?.forEach(cc => {
          courseContentMap.set(cc.course_id, (courseContentMap.get(cc.course_id) || 0) + 1);
        });

        for (const assignment of courseAssignments) {
          const currentCount = classContentCountMap.get(assignment.class_id) || 0;
          const courseContentCount = courseContentMap.get(assignment.course_id) || 0;
          classContentCountMap.set(assignment.class_id, currentCount + courseContentCount);
        }
      }

      // Build maps for lookups
      const studentClassMap = new Map(students?.map(s => [s.id, s.class_id]) || []);
      const classMappingMap = new Map(assessmentMappings?.map(m => [m.class_id, m]) || []);
      
      // Helper function to get weighted assessment for a student
      const getStudentWeightedAssessment = (studentUserId: string | null, classId: string): WeightedAssessmentBreakdown => {
        const mapping = classMappingMap.get(classId);
        
        if (!mapping) {
          return { fa1_score: 0, fa2_score: 0, final_score: 0, internal_score: 0, total_weighted: 0 };
        }

        // Get FA1 attempt
        const fa1Attempt = mapping.fa1_assessment_id 
          ? assessmentAttempts?.find(a => 
              a.student_id === studentUserId && 
              a.assessment_id === mapping.fa1_assessment_id &&
              ['completed', 'submitted', 'auto_submitted', 'evaluated', 'absent'].includes(a.status)
            )
          : null;

        // Get FA2 attempt
        const fa2Attempt = mapping.fa2_assessment_id
          ? assessmentAttempts?.find(a => 
              a.student_id === studentUserId && 
              a.assessment_id === mapping.fa2_assessment_id &&
              ['completed', 'submitted', 'auto_submitted', 'evaluated', 'absent'].includes(a.status)
            )
          : null;

        // Get Final attempt
        const finalAttempt = mapping.final_assessment_id
          ? assessmentAttempts?.find(a => 
              a.student_id === studentUserId && 
              a.assessment_id === mapping.final_assessment_id &&
              ['completed', 'submitted', 'auto_submitted', 'evaluated', 'absent'].includes(a.status)
            )
          : null;

        // Get internal marks for this student
        const studentInternal = internalMarks?.find(im => 
          im.student_id === studentUserId && im.class_id === classId
        );

        const internalMarksData = studentInternal 
          ? { obtained: Number(studentInternal.marks_obtained), total: Number(studentInternal.total_marks) }
          : null;

        // Convert to AssessmentAttempt format for the calculator
        const toAttemptFormat = (attempt: any): AssessmentAttempt | null => {
          if (!attempt) return null;
          return {
            id: attempt.id,
            score: attempt.score || 0,
            total_points: attempt.total_points || 0,
            status: attempt.status as any,
            percentage: attempt.percentage || 0,
            passed: attempt.passed || false,
          } as AssessmentAttempt;
        };

        const result = calculateWeightedScore(
          toAttemptFormat(fa1Attempt),
          toAttemptFormat(fa2Attempt),
          toAttemptFormat(finalAttempt),
          internalMarksData
        );

        return {
          fa1_score: result.fa1_score,
          fa2_score: result.fa2_score,
          final_score: result.final_score,
          internal_score: result.internal_score,
          total_weighted: result.total_weighted,
        };
      };

      // Build student performance map
      const studentPerformanceMap = new Map<string, StudentPerformance>();
      const classMap = new Map(classes?.map(c => [c.id, c.class_name]) || []);

      students?.forEach(student => {
        const completedStatuses = ['completed', 'submitted', 'auto_submitted', 'evaluated'];
        const studentAssessments = assessmentAttempts?.filter(a => 
          a.student_id === student.user_id && completedStatuses.includes(a.status)
        ) || [];
        const studentAssignments = assignmentSubmissions?.filter(a => a.student_id === student.user_id) || [];
        const studentXp = xpData.filter(x => x.student_id === student.user_id);
        const studentBadges = badgesData.filter(b => b.student_id === student.user_id);
        const studentProjects = projectsData.filter(p => p.student_id === student.id);
        const studentCompletions = contentCompletions.filter(c => c.student_id === student.id);

        // Get weighted assessment score
        const weightedAssessment = getStudentWeightedAssessment(student.user_id, student.class_id);

        // Use weighted assessment total as the assessment average
        const assessmentAvg = weightedAssessment.total_weighted;
        
        // Pass rate based on weighted score (>= 40% is pass)
        const assessmentPassRate = assessmentAvg >= 40 ? 100 : 0;

        // Calculate assignment avg
        let assignmentAvg = 0;
        if (studentAssignments.length > 0) {
          const totalPct = studentAssignments.reduce((sum, s) => {
            const total = (s.assignments as any)?.total_marks || 100;
            return sum + ((s.marks_obtained || 0) / total) * 100;
          }, 0);
          assignmentAvg = totalPct / studentAssignments.length;
        }

        // Calculate totals
        const totalXp = studentXp.reduce((sum, x) => sum + x.points_earned, 0);
        const badgesCount = new Set(studentBadges.map(b => b.badge_id)).size;
        const projectsCount = new Set(studentProjects.map(p => p.project_id)).size;
        
        // Calculate course completion based on class-specific content count
        const studentClassId = student.class_id;
        const classContentCount = classContentCountMap.get(studentClassId) || 0;
        const completionsCount = new Set(studentCompletions.map(c => c.content_id)).size;
        const courseCompletion = classContentCount > 0 
          ? (completionsCount / classContentCount) * 100 
          : 0;

        // Calculate overall score (weighted average)
        const overallScore = (
          (assessmentAvg * 0.3) +
          (assessmentPassRate * 0.2) +
          (assignmentAvg * 0.2) +
          (Math.min(totalXp / 100, 100) * 0.1) +
          (Math.min(badgesCount * 10, 100) * 0.05) +
          (Math.min(projectsCount * 20, 100) * 0.05) +
          (courseCompletion * 0.1)
        );

        studentPerformanceMap.set(student.id, {
          student_id: student.id,
          user_id: student.user_id,
          student_name: student.student_name,
          class_name: classMap.get(student.class_id) || 'Unknown',
          class_id: student.class_id,
          assessment_avg: Math.round(assessmentAvg * 10) / 10,
          assessment_pass_rate: Math.round(assessmentPassRate * 10) / 10,
          assignment_avg: Math.round(assignmentAvg * 10) / 10,
          total_xp: totalXp,
          badges_count: badgesCount,
          projects_count: projectsCount,
          course_completion: Math.round(courseCompletion * 10) / 10,
          overall_score: Math.round(overallScore * 10) / 10,
          weighted_assessment: weightedAssessment,
        });
      });

      // Build class performance
      const classPerformance: ClassPerformance[] = [];
      classes?.forEach(cls => {
        const classStudents = Array.from(studentPerformanceMap.values())
          .filter(s => s.class_id === cls.id);
        
        if (classStudents.length === 0) {
          classPerformance.push({
            class_id: cls.id,
            class_name: cls.class_name,
            total_students: 0,
            assessment_avg: 0,
            assessment_pass_rate: 0,
            assignment_avg: 0,
            total_xp: 0,
            avg_badges: 0,
            avg_projects: 0,
            course_completion: 0,
            overall_score: 0,
            topStudents: [],
            allStudents: [],
            weighted_assessment: { fa1_score: 0, fa2_score: 0, final_score: 0, internal_score: 0, total_weighted: 0 },
          });
          return;
        }

        const sortedStudents = [...classStudents].sort((a, b) => b.overall_score - a.overall_score);
        const top10 = sortedStudents.slice(0, 10).map((s, i) => ({ ...s, rank: i + 1 }));
        const rankedAll = sortedStudents.map((s, i) => ({ ...s, rank: i + 1 }));

        // Calculate class average weighted assessment
        const classWeightedAvg: WeightedAssessmentBreakdown = {
          fa1_score: Math.round((classStudents.reduce((sum, s) => sum + (s.weighted_assessment?.fa1_score || 0), 0) / classStudents.length) * 10) / 10,
          fa2_score: Math.round((classStudents.reduce((sum, s) => sum + (s.weighted_assessment?.fa2_score || 0), 0) / classStudents.length) * 10) / 10,
          final_score: Math.round((classStudents.reduce((sum, s) => sum + (s.weighted_assessment?.final_score || 0), 0) / classStudents.length) * 10) / 10,
          internal_score: Math.round((classStudents.reduce((sum, s) => sum + (s.weighted_assessment?.internal_score || 0), 0) / classStudents.length) * 10) / 10,
          total_weighted: Math.round((classStudents.reduce((sum, s) => sum + (s.weighted_assessment?.total_weighted || 0), 0) / classStudents.length) * 10) / 10,
        };

        classPerformance.push({
          class_id: cls.id,
          class_name: cls.class_name,
          total_students: classStudents.length,
          assessment_avg: Math.round((classStudents.reduce((sum, s) => sum + s.assessment_avg, 0) / classStudents.length) * 10) / 10,
          assessment_pass_rate: Math.round((classStudents.reduce((sum, s) => sum + s.assessment_pass_rate, 0) / classStudents.length) * 10) / 10,
          assignment_avg: Math.round((classStudents.reduce((sum, s) => sum + s.assignment_avg, 0) / classStudents.length) * 10) / 10,
          total_xp: classStudents.reduce((sum, s) => sum + s.total_xp, 0),
          avg_badges: Math.round((classStudents.reduce((sum, s) => sum + s.badges_count, 0) / classStudents.length) * 10) / 10,
          avg_projects: Math.round((classStudents.reduce((sum, s) => sum + s.projects_count, 0) / classStudents.length) * 10) / 10,
          course_completion: Math.round((classStudents.reduce((sum, s) => sum + s.course_completion, 0) / classStudents.length) * 10) / 10,
          overall_score: Math.round((classStudents.reduce((sum, s) => sum + s.overall_score, 0) / classStudents.length) * 10) / 10,
          topStudents: top10,
          allStudents: rankedAll,
          weighted_assessment: classWeightedAvg,
        });
      });

      // Sort classes by overall score
      classPerformance.sort((a, b) => b.overall_score - a.overall_score);

      // Build institution-level metrics
      const allStudents = Array.from(studentPerformanceMap.values());
      const sortedAll = [...allStudents].sort((a, b) => b.overall_score - a.overall_score);
      const top10Overall = sortedAll.slice(0, 10).map((s, i) => ({ ...s, rank: i + 1 }));

      // Calculate institution average weighted assessment
      const institutionWeightedAvg: WeightedAssessmentBreakdown = allStudents.length > 0 ? {
        fa1_score: Math.round((allStudents.reduce((sum, s) => sum + (s.weighted_assessment?.fa1_score || 0), 0) / allStudents.length) * 10) / 10,
        fa2_score: Math.round((allStudents.reduce((sum, s) => sum + (s.weighted_assessment?.fa2_score || 0), 0) / allStudents.length) * 10) / 10,
        final_score: Math.round((allStudents.reduce((sum, s) => sum + (s.weighted_assessment?.final_score || 0), 0) / allStudents.length) * 10) / 10,
        internal_score: Math.round((allStudents.reduce((sum, s) => sum + (s.weighted_assessment?.internal_score || 0), 0) / allStudents.length) * 10) / 10,
        total_weighted: Math.round((allStudents.reduce((sum, s) => sum + (s.weighted_assessment?.total_weighted || 0), 0) / allStudents.length) * 10) / 10,
      } : { fa1_score: 0, fa2_score: 0, final_score: 0, internal_score: 0, total_weighted: 0 };

      return {
        total_students: allStudents.length,
        total_classes: classes?.length || 0,
        assessment_avg: allStudents.length > 0 
          ? Math.round((allStudents.reduce((sum, s) => sum + s.assessment_avg, 0) / allStudents.length) * 10) / 10 
          : 0,
        assessment_pass_rate: allStudents.length > 0 
          ? Math.round((allStudents.reduce((sum, s) => sum + s.assessment_pass_rate, 0) / allStudents.length) * 10) / 10 
          : 0,
        assignment_avg: allStudents.length > 0 
          ? Math.round((allStudents.reduce((sum, s) => sum + s.assignment_avg, 0) / allStudents.length) * 10) / 10 
          : 0,
        total_xp: allStudents.reduce((sum, s) => sum + s.total_xp, 0),
        total_badges: allStudents.reduce((sum, s) => sum + s.badges_count, 0),
        total_projects: allStudents.reduce((sum, s) => sum + s.projects_count, 0),
        course_completion: allStudents.length > 0 
          ? Math.round((allStudents.reduce((sum, s) => sum + s.course_completion, 0) / allStudents.length) * 10) / 10 
          : 0,
        topStudents: top10Overall,
        allStudents: sortedAll.map((s, i) => ({ ...s, rank: i + 1 })),
        classPerformance,
        weighted_assessment: institutionWeightedAvg,
      };
    },
    enabled: !!institutionId,
    staleTime: 5 * 60 * 1000,
  });
}
