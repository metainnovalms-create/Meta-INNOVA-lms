import { CourseSessionDelivery, SessionProgress } from '@/types/session';
import { mockModules } from '@/data/mockCourseData';
import { recordStudentCompletions } from './studentCompletionHelpers';

const STORAGE_KEY = 'officer_session_deliveries';

export function getAllSessions(): CourseSessionDelivery[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error('Failed to parse sessions:', e);
    return [];
  }
}

export function getSessionDelivery(sessionId: string): CourseSessionDelivery | null {
  const sessions = getAllSessions();
  return sessions.find(s => s.id === sessionId) || null;
}

export function createSession(sessionData: Omit<CourseSessionDelivery, 'id' | 'created_at'>): CourseSessionDelivery {
  const sessions = getAllSessions();
  const newSession: CourseSessionDelivery = {
    ...sessionData,
    id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    created_at: new Date().toISOString(),
  };
  sessions.push(newSession);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  return newSession;
}

export function updateSessionProgress(
  sessionId: string, 
  contentId: string, 
  moduleId: string
): void {
  const sessions = getAllSessions();
  const sessionIndex = sessions.findIndex(s => s.id === sessionId);
  
  if (sessionIndex !== -1) {
    const session = sessions[sessionIndex];
    
    // Add content to completed list if not already there
    if (!session.content_completed.includes(contentId)) {
      session.content_completed.push(contentId);
    }
    
    // Update current module
    session.current_module_id = moduleId;
    
    // Check if module is completed
    const moduleContent = mockModules.find(m => m.id === moduleId);
    if (moduleContent && !session.modules_covered.includes(moduleId)) {
      // Add to covered modules (you might want more sophisticated logic here)
      session.modules_covered.push(moduleId);
    }
    
    // Record completion for all students present in the session
    if (session.students_present.length > 0) {
      recordStudentCompletions(
        sessionId,
        contentId,
        moduleId,
        session.course_id,
        session.officer_id,
        session.students_present
      );
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  }
}

export function updateSessionAttendance(
  sessionId: string,
  studentIds: string[],
  totalStudents: number
): void {
  const sessions = getAllSessions();
  const sessionIndex = sessions.findIndex(s => s.id === sessionId);
  
  if (sessionIndex !== -1) {
    sessions[sessionIndex].students_present = studentIds;
    sessions[sessionIndex].total_students = totalStudents;
    sessions[sessionIndex].attendance_percentage = 
      totalStudents > 0 ? (studentIds.length / totalStudents) * 100 : 0;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  }
}

export function completeSession(sessionId: string): void {
  const sessions = getAllSessions();
  const sessionIndex = sessions.findIndex(s => s.id === sessionId);
  
  if (sessionIndex !== -1) {
    sessions[sessionIndex].status = 'completed';
    sessions[sessionIndex].completed_at = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  }
}

export function getSessionProgressByClass(
  courseId: string, 
  className: string
): SessionProgress | null {
  const sessions = getAllSessions();
  const classSessions = sessions.filter(s => 
    s.course_id === courseId && s.class_name === className
  );
  
  if (classSessions.length === 0) return null;
  
  // Get total modules for this course
  const courseModules = mockModules.filter(m => m.course_id === courseId);
  const totalModules = courseModules.length;
  
  // Get unique completed modules across all sessions
  const allModulesCovered = new Set<string>();
  classSessions.forEach(s => s.modules_covered.forEach(m => allModulesCovered.add(m)));
  
  // Find most recent session
  const sortedSessions = classSessions.sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const latestSession = sortedSessions[0];
  
  // Calculate average attendance
  const totalAttendance = classSessions.reduce((sum, s) => sum + s.attendance_percentage, 0);
  const avgAttendance = classSessions.length > 0 ? totalAttendance / classSessions.length : 0;
  
  return {
    class_name: className,
    course_id: courseId,
    total_modules: totalModules,
    completed_modules: allModulesCovered.size,
    current_module_id: latestSession.current_module_id,
    last_session_date: latestSession.date,
    total_sessions: classSessions.length,
    average_attendance: avgAttendance,
  };
}

export function getAllSessionProgressForCourse(courseId: string): SessionProgress[] {
  const sessions = getAllSessions();
  const courseSessions = sessions.filter(s => s.course_id === courseId);
  
  // Group by class name
  const classesByName = new Map<string, CourseSessionDelivery[]>();
  courseSessions.forEach(session => {
    const existing = classesByName.get(session.class_name) || [];
    classesByName.set(session.class_name, [...existing, session]);
  });
  
  // Calculate progress for each class
  const progressList: SessionProgress[] = [];
  classesByName.forEach((classSessions, className) => {
    const progress = getSessionProgressByClass(courseId, className);
    if (progress) {
      progressList.push(progress);
    }
  });
  
  return progressList;
}
