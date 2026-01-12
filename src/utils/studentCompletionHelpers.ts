import { StudentContentCompletion, StudentLearningLog } from '@/types/contentCompletion';
import { mockContent, mockModules, mockCourses } from '@/data/mockCourseData';
import { mockStudents } from '@/data/mockStudentData';
import { getOfficerByTenant } from '@/data/mockOfficerData';
import { getAllSessions } from './sessionHelpers';

const STUDENT_COMPLETION_KEY = 'student_content_completions';

// Get all student completions from storage
function getAllCompletions(): StudentContentCompletion[] {
  try {
    const stored = localStorage.getItem(STUDENT_COMPLETION_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error('Failed to parse student completions:', e);
    return [];
  }
}

// Save completions to storage
function saveCompletions(completions: StudentContentCompletion[]): void {
  localStorage.setItem(STUDENT_COMPLETION_KEY, JSON.stringify(completions));
}

// Record completions for all students present in a session
export function recordStudentCompletions(
  sessionId: string,
  contentId: string,
  moduleId: string,
  courseId: string,
  officerId: string,
  studentIds: string[]
): void {
  const completions = getAllCompletions();
  const content = mockContent.find(c => c.id === contentId);
  const module = mockModules.find(m => m.id === moduleId);
  const course = mockCourses.find(c => c.id === courseId);
  const sessions = getAllSessions();
  const session = sessions.find(s => s.id === sessionId);
  
  if (!content || !module || !course || !session) {
    console.error('Missing data for recording completions');
    return;
  }

  // Find officer - try to get from tenant in session or default
  const officerData = getOfficerByTenant('springfield'); // Using default tenant
  const officerName = officerData?.name || 'Unknown Officer';

  studentIds.forEach(studentId => {
    const student = mockStudents.find(s => s.id === studentId);
    if (!student) return;

    // Check if already completed
    const existingIndex = completions.findIndex(
      c => c.student_id === studentId && c.content_id === contentId
    );

    const completionRecord: StudentContentCompletion = {
      id: `completion-${studentId}-${contentId}-${Date.now()}`,
      student_id: studentId,
      student_name: student.student_name,
      content_id: contentId,
      content_title: content.title,
      module_id: moduleId,
      module_title: module.title,
      session_id: sessionId,
      course_id: courseId,
      course_name: course.title,
      officer_id: officerId,
      officer_name: officerName,
      completed_at: new Date().toISOString(),
      class_name: session.class_name,
      content_type: content.type as any,
    };

    if (existingIndex !== -1) {
      // Update existing record
      completions[existingIndex] = completionRecord;
    } else {
      // Add new record
      completions.push(completionRecord);
    }
  });

  saveCompletions(completions);
}

// Get student's completions for a specific course
export function getStudentCompletions(
  studentId: string,
  courseId: string
): StudentContentCompletion[] {
  const completions = getAllCompletions();
  return completions.filter(
    c => c.student_id === studentId && c.course_id === courseId
  ).sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime());
}

// Get student's learning log for a course
export function getStudentLearningLog(
  studentId: string,
  courseId: string
): StudentLearningLog {
  const completions = getStudentCompletions(studentId, courseId);
  
  return {
    student_id: studentId,
    course_id: courseId,
    completions,
    total_completed: completions.length,
    last_updated: completions.length > 0 
      ? completions[0].completed_at 
      : new Date().toISOString(),
  };
}

// Check if content is completed by student
export function isContentCompletedByStudent(
  studentId: string,
  contentId: string
): boolean {
  const completions = getAllCompletions();
  return completions.some(
    c => c.student_id === studentId && c.content_id === contentId
  );
}

// Get completion record for specific content
export function getContentCompletion(
  studentId: string,
  contentId: string
): StudentContentCompletion | null {
  const completions = getAllCompletions();
  return completions.find(
    c => c.student_id === studentId && c.content_id === contentId
  ) || null;
}

// Get unique sessions attended by student for a course
export function getStudentSessionsAttended(
  studentId: string,
  courseId: string
): number {
  const completions = getStudentCompletions(studentId, courseId);
  const uniqueSessions = new Set(completions.map(c => c.session_id));
  return uniqueSessions.size;
}
