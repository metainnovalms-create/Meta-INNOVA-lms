import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Json } from '@/integrations/supabase/types';

interface AttendanceRecord {
  student_id: string;
  student_name: string;
  roll_number: string;
  status: 'present' | 'absent' | 'late';
  check_in_time?: string;
}

interface SessionCompletionResult {
  markSessionComplete: (
    sessionId: string,
    studentIds: string[],
    classAssignmentId: string,
    classId: string,
    timetableAssignmentId?: string,
    moduleId?: string,
    courseId?: string
  ) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook to handle marking all content in a session as complete for multiple students
 * This triggers the database trigger that handles unlocking next sessions/modules
 * AND creates a record in class_session_attendance for management dashboard
 */
export function useSessionCompletion(): SessionCompletionResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const markSessionComplete = async (
    sessionId: string,
    studentIds: string[],
    classAssignmentId: string,
    classId: string,
    timetableAssignmentId?: string,
    moduleId?: string,
    courseId?: string
  ): Promise<boolean> => {
    if (studentIds.length === 0) {
      toast.error('Please select at least one student');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 1. Fetch all content in this session
      const { data: contentItems, error: contentError } = await supabase
        .from('course_content')
        .select('id')
        .eq('session_id', sessionId);

      if (contentError) throw contentError;
      if (!contentItems || contentItems.length === 0) {
        toast.error('No content found in this session');
        return false;
      }

      // 2. Create completion records for each student + content combination
      const completionRecords = studentIds.flatMap(studentId =>
        contentItems.map(content => ({
          student_id: studentId,
          content_id: content.id,
          class_assignment_id: classAssignmentId,
          watch_percentage: 100,
          completed_at: new Date().toISOString()
        }))
      );

      // 3. Upsert completions (avoid duplicates)
      const { error: insertError } = await supabase
        .from('student_content_completions')
        .upsert(completionRecords, {
          onConflict: 'student_id,content_id,class_assignment_id',
          ignoreDuplicates: false
        });

      if (insertError) throw insertError;

      // 4. Also create/update class_session_attendance for management dashboard
      await createAttendanceRecord(classId, studentIds, sessionId, timetableAssignmentId);

      // 5. Trigger certificate issuance via edge function (if module/course info available)
      if (moduleId && courseId) {
        await triggerCertificateIssuance(studentIds, classAssignmentId, moduleId, courseId);
      }

      toast.success(
        `Session marked complete for ${studentIds.length} student${studentIds.length > 1 ? 's' : ''}`
      );
      return true;
    } catch (err: any) {
      console.error('Failed to mark session complete:', err);
      setError(err.message || 'Failed to mark session complete');
      toast.error('Failed to mark session complete');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { markSessionComplete, isLoading, error };
}

/**
 * Triggers certificate issuance via edge function for each student
 */
async function triggerCertificateIssuance(
  studentRecordIds: string[],
  classAssignmentId: string,
  moduleId: string,
  courseId: string
) {
  try {
    // Get student user IDs (profiles.id) for each student record
    const { data: students } = await supabase
      .from('students')
      .select('id, user_id, institution_id')
      .in('id', studentRecordIds);

    if (!students || students.length === 0) return;

    // Call edge function for each student
    for (const student of students) {
      if (!student.user_id) continue; // Skip students without linked user accounts

      try {
        const { error } = await supabase.functions.invoke('issue-completion-certificates', {
          body: {
            studentRecordId: student.id,
            studentUserId: student.user_id,
            classAssignmentId,
            courseId,
            moduleId,
            institutionId: student.institution_id
          }
        });

        if (error) {
          console.error('Failed to issue certificate for student:', student.id, error);
        }
      } catch (err) {
        console.error('Error calling certificate edge function for student:', student.id, err);
      }
    }
  } catch (err) {
    console.error('Error in triggerCertificateIssuance:', err);
  }
}

/**
 * Creates an attendance record in class_session_attendance table
 */
async function createAttendanceRecord(
  classId: string,
  selectedStudentIds: string[],
  sessionId: string,
  timetableAssignmentId?: string
) {
  try {
    // Get class details for institution_id
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('institution_id')
      .eq('id', classId)
      .single();

    if (classError || !classData) {
      console.error('Failed to get class details:', classError);
      return;
    }

    // Get current user's officer ID
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: officerData } = await supabase
      .from('officers')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    const officerId = officerData?.id || null;

    // Get all students in the class
    const { data: allStudents, error: studentsError } = await supabase
      .from('students')
      .select('id, student_name, roll_number')
      .eq('class_id', classId)
      .eq('status', 'active');

    if (studentsError || !allStudents) {
      console.error('Failed to get students:', studentsError);
      return;
    }

    // Get session details for period info
    const { data: sessionData } = await supabase
      .from('course_sessions')
      .select('title')
      .eq('id', sessionId)
      .maybeSingle();

    // Build attendance records
    const attendanceRecords: AttendanceRecord[] = allStudents.map(student => ({
      student_id: student.id,
      student_name: student.student_name,
      roll_number: student.roll_number || '',
      status: selectedStudentIds.includes(student.id) ? 'present' : 'absent',
      check_in_time: selectedStudentIds.includes(student.id) ? new Date().toISOString() : undefined
    }));

    const today = format(new Date(), 'yyyy-MM-dd');
    
    // If no timetable assignment, try to find one or create a placeholder ID
    let finalTimetableAssignmentId = timetableAssignmentId;
    
    if (!finalTimetableAssignmentId) {
      // Try to find a timetable assignment for this class today
      const dayOfWeek = format(new Date(), 'EEEE'); // e.g., "Monday"
      const { data: existingAssignment } = await supabase
        .from('institution_timetable_assignments')
        .select('id')
        .eq('class_id', classId)
        .eq('day', dayOfWeek)
        .limit(1)
        .maybeSingle();

      if (existingAssignment) {
        finalTimetableAssignmentId = existingAssignment.id;
      } else {
        // Create a placeholder timetable assignment for course completion tracking
        const { data: newAssignment, error: assignmentError } = await supabase
          .from('institution_timetable_assignments')
          .insert({
            class_id: classId,
            class_name: 'Course Session',
            institution_id: classData.institution_id,
            day: dayOfWeek,
            period_id: await getFirstPeriodId(classData.institution_id),
            subject: sessionData?.title || 'Course Content',
            teacher_id: officerId,
            teacher_name: 'Course Instructor'
          })
          .select('id')
          .single();

        if (!assignmentError && newAssignment) {
          finalTimetableAssignmentId = newAssignment.id;
        }
      }
    }

    if (!finalTimetableAssignmentId) {
      console.error('Could not find or create timetable assignment');
      return;
    }

    // Insert or update attendance record
    const { error: attendanceError } = await supabase
      .from('class_session_attendance')
      .upsert({
        timetable_assignment_id: finalTimetableAssignmentId,
        class_id: classId,
        institution_id: classData.institution_id,
        officer_id: officerId,
        date: today,
        period_label: sessionData?.title || 'Course Session',
        subject: sessionData?.title || 'Course Content',
        attendance_records: attendanceRecords as unknown as Json,
        total_students: allStudents.length,
        students_present: selectedStudentIds.length,
        students_absent: allStudents.length - selectedStudentIds.length,
        students_late: 0,
        is_session_completed: true,
        completed_by: officerId,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'timetable_assignment_id,date'
      });

    if (attendanceError) {
      console.error('Failed to create attendance record:', attendanceError);
    }
  } catch (err) {
    console.error('Error creating attendance record:', err);
  }
}

/**
 * Helper to get first period ID for an institution
 */
async function getFirstPeriodId(institutionId: string): Promise<string> {
  const { data } = await supabase
    .from('institution_periods')
    .select('id')
    .eq('institution_id', institutionId)
    .order('display_order', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (data) return data.id;

  // Create a default period if none exists
  const { data: newPeriod } = await supabase
    .from('institution_periods')
    .insert({
      institution_id: institutionId,
      label: 'Period 1',
      start_time: '09:00',
      end_time: '10:00',
      display_order: 1,
      is_break: false
    })
    .select('id')
    .single();

  return newPeriod?.id || '';
}

/**
 * Hook to fetch student completion status for a session
 */
export function useStudentSessionCompletions(
  sessionId: string | null,
  classAssignmentId: string | null,
  studentIds: string[]
) {
  const [completions, setCompletions] = useState<Map<string, boolean>>(new Map());
  const [isLoading, setIsLoading] = useState(false);

  const fetchCompletions = async () => {
    if (!sessionId || !classAssignmentId || studentIds.length === 0) {
      setCompletions(new Map());
      return;
    }

    setIsLoading(true);
    try {
      // Get all content in the session
      const { data: contentItems } = await supabase
        .from('course_content')
        .select('id')
        .eq('session_id', sessionId);

      if (!contentItems || contentItems.length === 0) {
        setCompletions(new Map());
        return;
      }

      const contentIds = contentItems.map(c => c.id);

      // Get completions for each student
      const { data: completionData } = await supabase
        .from('student_content_completions')
        .select('student_id, content_id')
        .in('student_id', studentIds)
        .in('content_id', contentIds)
        .eq('class_assignment_id', classAssignmentId);

      // Calculate which students have completed ALL content
      const studentCompletions = new Map<string, boolean>();
      for (const studentId of studentIds) {
        const studentCompletedContent = completionData?.filter(
          c => c.student_id === studentId
        ).length || 0;
        studentCompletions.set(studentId, studentCompletedContent >= contentIds.length);
      }

      setCompletions(studentCompletions);
    } catch (err) {
      console.error('Failed to fetch completions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return { completions, isLoading, refetch: fetchCompletions };
}
