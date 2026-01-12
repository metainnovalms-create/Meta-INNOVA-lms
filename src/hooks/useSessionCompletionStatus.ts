import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SessionCompletionStatus {
  sessionId: string;
  totalStudents: number;
  completedStudents: number;
  isFullyCompleted: boolean;
  isConducted: boolean; // At least 1 student marked = session was taught
}

interface ClassProgressResult {
  totalSessions: number;
  totalStudents: number;
  totalCompletions: number; // Sum of all student session completions
  maxCompletions: number; // totalSessions * totalStudents
  progressPercentage: number;
  sessionStatuses: Map<string, SessionCompletionStatus>;
}

/**
 * Hook to fetch session completion status for officer dashboard.
 * Shows how many students have completed each session for a class.
 */
export function useSessionCompletionStatus(
  classId: string | undefined,
  classAssignmentId: string | undefined,
  sessionIds: string[]
) {
  return useQuery({
    queryKey: ['session-completion-status', classId, classAssignmentId, sessionIds],
    queryFn: async (): Promise<ClassProgressResult> => {
      if (!classId || !classAssignmentId || sessionIds.length === 0) {
        return {
          totalSessions: 0,
          totalStudents: 0,
          totalCompletions: 0,
          maxCompletions: 0,
          progressPercentage: 0,
          sessionStatuses: new Map(),
        };
      }

      // Get total students in class
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('id')
        .eq('class_id', classId)
        .eq('status', 'active');

      if (studentsError) throw studentsError;
      const totalStudents = students?.length || 0;

      if (totalStudents === 0) {
        return {
          totalSessions: sessionIds.length,
          totalStudents: 0,
          totalCompletions: 0,
          maxCompletions: 0,
          progressPercentage: 0,
          sessionStatuses: new Map(),
        };
      }

      // Get content for each session
      const { data: contentItems, error: contentError } = await supabase
        .from('course_content')
        .select('id, session_id')
        .in('session_id', sessionIds);

      if (contentError) throw contentError;

      // Group content by session
      const contentBySession = new Map<string, string[]>();
      contentItems?.forEach(c => {
        const existing = contentBySession.get(c.session_id) || [];
        existing.push(c.id);
        contentBySession.set(c.session_id, existing);
      });

      // Get all completions for this class assignment
      const allContentIds = contentItems?.map(c => c.id) || [];
      let completions: { student_id: string; content_id: string }[] = [];

      if (allContentIds.length > 0) {
        const { data: completionData, error: completionError } = await supabase
          .from('student_content_completions')
          .select('student_id, content_id')
          .in('content_id', allContentIds)
          .eq('class_assignment_id', classAssignmentId);

        if (completionError) throw completionError;
        completions = completionData || [];
      }

      // Calculate completion status per session
      const sessionStatuses = new Map<string, SessionCompletionStatus>();
      let totalCompletions = 0;

      for (const sessionId of sessionIds) {
        const sessionContentIds = contentBySession.get(sessionId) || [];
        const contentCount = sessionContentIds.length;

        if (contentCount === 0) {
          // No content in session - consider all students completed
          sessionStatuses.set(sessionId, {
            sessionId,
            totalStudents,
            completedStudents: totalStudents,
            isFullyCompleted: true,
            isConducted: true,
          });
          totalCompletions += totalStudents;
          continue;
        }

        // Count students who completed ALL content in this session
        let completedStudents = 0;
        for (const student of students || []) {
          const studentCompletedContent = completions.filter(
            c => c.student_id === student.id && sessionContentIds.includes(c.content_id)
          ).length;

          if (studentCompletedContent >= contentCount) {
            completedStudents++;
          }
        }

        sessionStatuses.set(sessionId, {
          sessionId,
          totalStudents,
          completedStudents,
          isFullyCompleted: completedStudents === totalStudents,
          isConducted: completedStudents > 0,
        });

        totalCompletions += completedStudents;
      }

      const maxCompletions = sessionIds.length * totalStudents;
      const progressPercentage = maxCompletions > 0 
        ? Math.round((totalCompletions / maxCompletions) * 100) 
        : 0;

      return {
        totalSessions: sessionIds.length,
        totalStudents,
        totalCompletions,
        maxCompletions,
        progressPercentage,
        sessionStatuses,
      };
    },
    enabled: !!classId && !!classAssignmentId && sessionIds.length > 0,
  });
}

/**
 * Hook to fetch student's individual course progress.
 * Returns sessions completed by a specific student.
 */
export function useStudentCourseProgress(
  studentId: string | undefined,
  classAssignmentId: string | undefined,
  sessionIds: string[]
) {
  return useQuery({
    queryKey: ['student-course-progress', studentId, classAssignmentId, sessionIds],
    queryFn: async () => {
      if (!studentId || !classAssignmentId || sessionIds.length === 0) {
        return {
          completedSessions: new Set<string>(),
          totalSessions: 0,
          completedCount: 0,
          progressPercentage: 0,
        };
      }

      // Get content for each session
      const { data: contentItems, error: contentError } = await supabase
        .from('course_content')
        .select('id, session_id')
        .in('session_id', sessionIds);

      if (contentError) throw contentError;

      // Group content by session
      const contentBySession = new Map<string, string[]>();
      contentItems?.forEach(c => {
        const existing = contentBySession.get(c.session_id) || [];
        existing.push(c.id);
        contentBySession.set(c.session_id, existing);
      });

      // Get student's completions
      const allContentIds = contentItems?.map(c => c.id) || [];
      let completions: { content_id: string }[] = [];

      if (allContentIds.length > 0) {
        const { data: completionData, error: completionError } = await supabase
          .from('student_content_completions')
          .select('content_id')
          .eq('student_id', studentId)
          .eq('class_assignment_id', classAssignmentId)
          .in('content_id', allContentIds);

        if (completionError) throw completionError;
        completions = completionData || [];
      }

      const completedContentIds = new Set(completions.map(c => c.content_id));
      const completedSessions = new Set<string>();

      // Check each session
      for (const sessionId of sessionIds) {
        const sessionContentIds = contentBySession.get(sessionId) || [];
        if (sessionContentIds.length === 0) {
          completedSessions.add(sessionId);
          continue;
        }

        const allCompleted = sessionContentIds.every(id => completedContentIds.has(id));
        if (allCompleted) {
          completedSessions.add(sessionId);
        }
      }

      const completedCount = completedSessions.size;
      const totalSessions = sessionIds.length;
      const progressPercentage = totalSessions > 0 
        ? Math.round((completedCount / totalSessions) * 100) 
        : 0;

      return {
        completedSessions,
        totalSessions,
        completedCount,
        progressPercentage,
      };
    },
    enabled: !!studentId && !!classAssignmentId && sessionIds.length > 0,
  });
}
