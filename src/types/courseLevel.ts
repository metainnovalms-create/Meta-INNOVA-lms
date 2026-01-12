// Course Level Type Definitions (formerly Module)
// Level = Module renamed for better clarity in the learning hierarchy

export interface CourseLevel {
  id: string;
  course_id: string;
  title: string;
  description: string;
  order: number;
  created_at: string;
}

// Level access control per class
export interface LevelClassAccess {
  level_id: string;
  min_class: number; // Minimum class that can access (e.g., 4 for Class 4+)
  max_class: number; // Maximum class that can access (e.g., 12)
}

// Course level assignment to institution with class-based access
export interface CourseLevelAssignment {
  id: string;
  course_id: string;
  institution_id: string;
  level_access: LevelClassAccess[];
  created_at: string;
  updated_at: string;
}

// Student content completion with officer teaching context
export interface StudentContentCompletionWithContext {
  id: string;
  student_id: string;
  student_name: string;
  content_id: string;
  content_title: string;
  level_id: string;
  level_title: string;
  session_id: string;
  course_id: string;
  course_name: string;
  officer_id: string;
  officer_name: string;
  completed_at: string;
  class_name: string;
  content_type: 'pdf' | 'ppt' | 'video' | 'youtube' | 'simulation' | 'link';
  completion_source: 'officer_teaching' | 'self_study';
}

// Course progress tracking
export interface CourseProgressTracking {
  course_id: string;
  institution_id: string;
  class_id: string;
  total_levels: number;
  accessible_levels: number;
  completed_levels: number;
  total_content: number;
  completed_content: number;
  percentage: number;
  last_updated: string;
}

// Institution course enrollment stats
export interface InstitutionCourseStats {
  institution_id: string;
  institution_name: string;
  course_id: string;
  course_title: string;
  total_enrolled: number;
  active_students: number;
  completed_students: number;
  average_progress: number;
  class_breakdown: {
    class_id: string;
    class_name: string;
    enrolled: number;
    average_progress: number;
    completed: number;
  }[];
}

// Default level access mappings per class
export const DEFAULT_LEVEL_ACCESS: Record<number, number> = {
  4: 7,   // Class 4: Levels 1-7
  5: 8,   // Class 5: Levels 1-8
  6: 11,  // Class 6: Levels 1-11
  7: 13,  // Class 7: Levels 1-13
  8: 15,  // Class 8: Levels 1-15
  9: 18,  // Class 9: Levels 1-18
  10: 20, // Class 10: Levels 1-20
  11: 22, // Class 11: Levels 1-22
  12: 25, // Class 12: All levels (1-25)
};

// Helper to get accessible level count for a class
export function getAccessibleLevelCount(classNumber: number): number {
  return DEFAULT_LEVEL_ACCESS[classNumber] || 25;
}

// Helper to check if a level is accessible to a class
export function isLevelAccessibleToClass(levelOrder: number, classNumber: number): boolean {
  const maxAccessibleLevel = getAccessibleLevelCount(classNumber);
  return levelOrder <= maxAccessibleLevel;
}
