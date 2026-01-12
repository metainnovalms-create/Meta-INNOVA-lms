// Centralized localStorage helpers for Course Management
// Enables bidirectional sync across System Admin, Management, Officer, and Student dashboards

import { 
  Course, 
  CourseModule, 
  CourseSession, 
  CourseContent,
  CourseAssignment,
  Assignment,
  Quiz,
  CourseEnrollment
} from '@/types/course';
import { 
  mockCourses, 
  mockModules, 
  mockSessions, 
  mockContent,
  mockCourseAssignments,
  mockAssignments,
  mockQuizzes,
  mockEnrollments
} from '@/data/mockCourseData';
import { CourseLevelAssignment, isLevelAccessibleToClass } from '@/types/courseLevel';

// localStorage keys
const COURSES_KEY = 'stem_courses';
const LEVELS_KEY = 'course_levels'; // formerly modules
const SESSIONS_KEY = 'course_sessions';
const CONTENT_KEY = 'course_content';
const LEVEL_ACCESS_KEY = 'course_level_access';
const COURSE_ASSIGNMENTS_KEY = 'course_assignments';
const ASSIGNMENTS_KEY = 'course_assignments_items';
const QUIZZES_KEY = 'course_quizzes';
const ENROLLMENTS_KEY = 'course_enrollments';
const STUDENT_COMPLETIONS_KEY = 'student_content_completions';

// ========== COURSES ==========
export function loadCourses(): Course[] {
  try {
    const stored = localStorage.getItem(COURSES_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load courses:', e);
  }
  // Initialize with mock data
  saveCourses(mockCourses);
  return mockCourses;
}

export function saveCourses(courses: Course[]): void {
  localStorage.setItem(COURSES_KEY, JSON.stringify(courses));
}

export function getCourseById(courseId: string): Course | undefined {
  const courses = loadCourses();
  return courses.find(c => c.id === courseId);
}

export function addCourse(course: Course): void {
  const courses = loadCourses();
  courses.push(course);
  saveCourses(courses);
}

export function updateCourse(courseId: string, updates: Partial<Course>): void {
  const courses = loadCourses();
  const index = courses.findIndex(c => c.id === courseId);
  if (index !== -1) {
    courses[index] = { ...courses[index], ...updates, updated_at: new Date().toISOString() };
    saveCourses(courses);
  }
}

export function deleteCourse(courseId: string): void {
  const courses = loadCourses();
  saveCourses(courses.filter(c => c.id !== courseId));
}

// ========== LEVELS (formerly MODULES) ==========
export function loadLevels(): CourseModule[] {
  try {
    const stored = localStorage.getItem(LEVELS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load levels:', e);
  }
  saveLevels(mockModules);
  return mockModules;
}

export function saveLevels(levels: CourseModule[]): void {
  localStorage.setItem(LEVELS_KEY, JSON.stringify(levels));
}

export function getLevelsByCourse(courseId: string): CourseModule[] {
  const levels = loadLevels();
  return levels.filter(l => l.course_id === courseId).sort((a, b) => a.order - b.order);
}

export function addLevel(level: CourseModule): void {
  const levels = loadLevels();
  levels.push(level);
  saveLevels(levels);
}

export function updateLevel(levelId: string, updates: Partial<CourseModule>): void {
  const levels = loadLevels();
  const index = levels.findIndex(l => l.id === levelId);
  if (index !== -1) {
    levels[index] = { ...levels[index], ...updates };
    saveLevels(levels);
  }
}

export function deleteLevel(levelId: string): void {
  const levels = loadLevels();
  saveLevels(levels.filter(l => l.id !== levelId));
}

// Get levels accessible to a specific class
export function getLevelsForClass(courseId: string, classNumber: number): CourseModule[] {
  const levels = getLevelsByCourse(courseId);
  return levels.filter(level => isLevelAccessibleToClass(level.order, classNumber));
}

// ========== SESSIONS ==========
export function loadSessions(): CourseSession[] {
  try {
    const stored = localStorage.getItem(SESSIONS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load sessions:', e);
  }
  saveSessions(mockSessions);
  return mockSessions;
}

export function saveSessions(sessions: CourseSession[]): void {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

export function getSessionsByLevel(levelId: string): CourseSession[] {
  const sessions = loadSessions();
  return sessions.filter(s => s.module_id === levelId).sort((a, b) => a.order - b.order);
}

export function addSession(session: CourseSession): void {
  const sessions = loadSessions();
  sessions.push(session);
  saveSessions(sessions);
}

export function updateSession(sessionId: string, updates: Partial<CourseSession>): void {
  const sessions = loadSessions();
  const index = sessions.findIndex(s => s.id === sessionId);
  if (index !== -1) {
    sessions[index] = { ...sessions[index], ...updates };
    saveSessions(sessions);
  }
}

export function deleteSession(sessionId: string): void {
  const sessions = loadSessions();
  saveSessions(sessions.filter(s => s.id !== sessionId));
}

// ========== CONTENT ==========
export function loadContent(): CourseContent[] {
  try {
    const stored = localStorage.getItem(CONTENT_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load content:', e);
  }
  saveContent(mockContent);
  return mockContent;
}

export function saveContent(content: CourseContent[]): void {
  localStorage.setItem(CONTENT_KEY, JSON.stringify(content));
}

export function getContentBySession(sessionId: string): CourseContent[] {
  const content = loadContent();
  return content.filter(c => c.session_id === sessionId).sort((a, b) => a.order - b.order);
}

export function getContentByCourse(courseId: string): CourseContent[] {
  const content = loadContent();
  return content.filter(c => c.course_id === courseId).sort((a, b) => a.order - b.order);
}

export function addContent(contentItem: CourseContent): void {
  const content = loadContent();
  content.push(contentItem);
  saveContent(content);
}

export function updateContent(contentId: string, updates: Partial<CourseContent>): void {
  const content = loadContent();
  const index = content.findIndex(c => c.id === contentId);
  if (index !== -1) {
    content[index] = { ...content[index], ...updates };
    saveContent(content);
  }
}

export function deleteContent(contentId: string): void {
  const content = loadContent();
  saveContent(content.filter(c => c.id !== contentId));
}

// ========== LEVEL ACCESS ==========
export function loadLevelAccess(): CourseLevelAssignment[] {
  try {
    const stored = localStorage.getItem(LEVEL_ACCESS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load level access:', e);
  }
  return [];
}

export function saveLevelAccess(access: CourseLevelAssignment[]): void {
  localStorage.setItem(LEVEL_ACCESS_KEY, JSON.stringify(access));
}

// ========== COURSE ASSIGNMENTS (to Institutions) ==========
export function loadCourseAssignments(): CourseAssignment[] {
  try {
    const stored = localStorage.getItem(COURSE_ASSIGNMENTS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load course assignments:', e);
  }
  saveCourseAssignments(mockCourseAssignments);
  return mockCourseAssignments;
}

export function saveCourseAssignments(assignments: CourseAssignment[]): void {
  localStorage.setItem(COURSE_ASSIGNMENTS_KEY, JSON.stringify(assignments));
}

export function getCourseAssignmentsByInstitution(institutionId: string): CourseAssignment[] {
  const assignments = loadCourseAssignments();
  return assignments.filter(a => a.institution_id === institutionId);
}

// ========== ASSIGNMENTS & QUIZZES ==========
export function loadAssignments(): Assignment[] {
  try {
    const stored = localStorage.getItem(ASSIGNMENTS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load assignments:', e);
  }
  saveAssignments(mockAssignments);
  return mockAssignments;
}

export function saveAssignments(assignments: Assignment[]): void {
  localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(assignments));
}

export function loadQuizzes(): Quiz[] {
  try {
    const stored = localStorage.getItem(QUIZZES_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load quizzes:', e);
  }
  saveQuizzes(mockQuizzes);
  return mockQuizzes;
}

export function saveQuizzes(quizzes: Quiz[]): void {
  localStorage.setItem(QUIZZES_KEY, JSON.stringify(quizzes));
}

// ========== ENROLLMENTS ==========
export function loadEnrollments(): CourseEnrollment[] {
  try {
    const stored = localStorage.getItem(ENROLLMENTS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load enrollments:', e);
  }
  saveEnrollments(mockEnrollments);
  return mockEnrollments;
}

export function saveEnrollments(enrollments: CourseEnrollment[]): void {
  localStorage.setItem(ENROLLMENTS_KEY, JSON.stringify(enrollments));
}

export function getEnrollmentsByStudent(studentId: string): CourseEnrollment[] {
  const enrollments = loadEnrollments();
  return enrollments.filter(e => e.student_id === studentId);
}

export function getEnrollmentsByCourse(courseId: string): CourseEnrollment[] {
  const enrollments = loadEnrollments();
  return enrollments.filter(e => e.course_id === courseId);
}

export function getEnrollmentsByInstitution(institutionId: string): CourseEnrollment[] {
  const enrollments = loadEnrollments();
  return enrollments.filter(e => e.institution_id === institutionId);
}

// ========== ANALYTICS HELPERS ==========
export interface CourseAnalyticsData {
  course_id: string;
  course_title: string;
  total_enrollments: number;
  active_students: number;
  completed_students: number;
  average_progress: number;
  completion_rate: number;
  institutions: {
    institution_id: string;
    institution_name: string;
    enrollments: number;
    average_progress: number;
  }[];
}

export function getCourseAnalytics(courseId?: string): CourseAnalyticsData[] {
  const courses = loadCourses();
  const enrollments = loadEnrollments();
  
  const coursesToAnalyze = courseId 
    ? courses.filter(c => c.id === courseId)
    : courses;
  
  return coursesToAnalyze.map(course => {
    const courseEnrollments = enrollments.filter(e => e.course_id === course.id);
    const activeStudents = courseEnrollments.filter(e => e.status === 'active').length;
    const completedStudents = courseEnrollments.filter(e => e.status === 'completed').length;
    const avgProgress = courseEnrollments.length > 0
      ? courseEnrollments.reduce((sum, e) => sum + e.progress_percentage, 0) / courseEnrollments.length
      : 0;
    
    // Group by institution
    const institutionMap = new Map<string, { name: string; enrollments: number; progress: number[] }>();
    courseEnrollments.forEach(e => {
      const existing = institutionMap.get(e.institution_id);
      if (existing) {
        existing.enrollments++;
        existing.progress.push(e.progress_percentage);
      } else {
        institutionMap.set(e.institution_id, {
          name: e.institution_id, // Would need institution lookup
          enrollments: 1,
          progress: [e.progress_percentage]
        });
      }
    });
    
    const institutions = Array.from(institutionMap.entries()).map(([id, data]) => ({
      institution_id: id,
      institution_name: data.name,
      enrollments: data.enrollments,
      average_progress: data.progress.reduce((a, b) => a + b, 0) / data.progress.length
    }));
    
    return {
      course_id: course.id,
      course_title: course.title,
      total_enrollments: courseEnrollments.length,
      active_students: activeStudents,
      completed_students: completedStudents,
      average_progress: Math.round(avgProgress),
      completion_rate: courseEnrollments.length > 0 
        ? Math.round((completedStudents / courseEnrollments.length) * 100) 
        : 0,
      institutions
    };
  });
}

// Get student completions for analytics
export function getStudentCompletionStats(courseId: string, institutionId?: string): {
  totalContent: number;
  averageCompletion: number;
  studentStats: { studentId: string; studentName: string; completedCount: number; percentage: number }[];
} {
  const content = getContentByCourse(courseId);
  const enrollments = getEnrollmentsByCourse(courseId);
  const filteredEnrollments = institutionId 
    ? enrollments.filter(e => e.institution_id === institutionId)
    : enrollments;
  
  // Get completions from localStorage
  let completions: any[] = [];
  try {
    const stored = localStorage.getItem(STUDENT_COMPLETIONS_KEY);
    if (stored) {
      completions = JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load student completions:', e);
  }
  
  const studentStats = filteredEnrollments.map(enrollment => {
    const studentCompletions = completions.filter(
      c => c.student_id === enrollment.student_id && c.course_id === courseId
    );
    return {
      studentId: enrollment.student_id,
      studentName: enrollment.student_name,
      completedCount: studentCompletions.length,
      percentage: content.length > 0 
        ? Math.round((studentCompletions.length / content.length) * 100)
        : 0
    };
  });
  
  const averageCompletion = studentStats.length > 0
    ? studentStats.reduce((sum, s) => sum + s.percentage, 0) / studentStats.length
    : 0;
  
  return {
    totalContent: content.length,
    averageCompletion: Math.round(averageCompletion),
    studentStats
  };
}
