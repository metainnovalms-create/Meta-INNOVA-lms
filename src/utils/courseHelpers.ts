import { 
  Course, 
  CourseEnrollment, 
  AssignmentSubmission, 
  QuizAttempt,
  Assignment,
  Quiz,
  CourseAssignment
} from '@/types/course';

export interface CourseWithEnrollments extends Course {
  total_enrollments: number;
  current_enrollments: number;
  avg_progress: number;
  classes: string[];
}

export interface StudentPerformance {
  student_id: string;
  student_name: string;
  roll_no: string;
  class_level: string;
  progress_percentage: number;
  assignment_avg: number;
  assignment_completed: number;
  assignment_total: number;
  quiz_avg: number;
  status: 'active' | 'at_risk' | 'struggling' | 'completed';
  last_activity: string;
}

export interface ClassBreakdown {
  class_level: string;
  student_count: number;
  avg_progress: number;
  avg_assignment_score: number;
  avg_quiz_score: number;
}

export interface CoursePerformanceData {
  course: Course;
  total_students: number;
  active_students: number;
  completed_students: number;
  completion_rate: number;
  avg_progress: number;
  class_breakdown: ClassBreakdown[];
  student_performance: StudentPerformance[];
  assignments: Assignment[];
  quizzes: Quiz[];
  at_risk_count: number;
}

/**
 * Get courses assigned to a specific institution
 */
export const getCoursesByInstitution = (
  courses: Course[],
  courseAssignments: CourseAssignment[],
  enrollments: CourseEnrollment[],
  institutionId: string
): CourseWithEnrollments[] => {
  // Get course IDs assigned to this institution
  const institutionAssignments = courseAssignments.filter(
    ca => ca.institution_id === institutionId
  );

  return institutionAssignments.map(assignment => {
    const course = courses.find(c => c.id === assignment.course_id);
    if (!course) return null;

    // Get enrollments for this course and institution
    const courseEnrollments = enrollments.filter(
      e => e.course_id === course.id && e.institution_id === institutionId
    );

    // Calculate averages
    const avgProgress = courseEnrollments.length > 0
      ? courseEnrollments.reduce((sum, e) => sum + e.progress_percentage, 0) / courseEnrollments.length
      : 0;

    // Get unique classes
    const classes = [...new Set(courseEnrollments.map(e => e.class_level))];

    return {
      ...course,
      total_enrollments: courseEnrollments.length,
      current_enrollments: courseEnrollments.filter(e => e.status === 'active').length,
      avg_progress: Math.round(avgProgress),
      classes,
    };
  }).filter(Boolean) as CourseWithEnrollments[];
};

/**
 * Get detailed performance data for a specific course and institution
 */
export const getCoursePerformanceData = (
  courseId: string,
  institutionId: string,
  courses: Course[],
  enrollments: CourseEnrollment[],
  submissions: AssignmentSubmission[],
  quizAttempts: QuizAttempt[],
  assignments: Assignment[],
  quizzes: Quiz[]
): CoursePerformanceData | null => {
  const course = courses.find(c => c.id === courseId);
  if (!course) return null;

  // Get enrollments for this course and institution
  const courseEnrollments = enrollments.filter(
    e => e.course_id === courseId && e.institution_id === institutionId
  );

  if (courseEnrollments.length === 0) {
    return {
      course,
      total_students: 0,
      active_students: 0,
      completed_students: 0,
      completion_rate: 0,
      avg_progress: 0,
      class_breakdown: [],
      student_performance: [],
      assignments: assignments.filter(a => a.course_id === courseId),
      quizzes: quizzes.filter(q => q.course_id === courseId),
      at_risk_count: 0,
    };
  }

  // Calculate statistics
  const activeStudents = courseEnrollments.filter(e => e.status === 'active').length;
  const completedStudents = courseEnrollments.filter(e => e.status === 'completed').length;
  const avgProgress = courseEnrollments.reduce((sum, e) => sum + e.progress_percentage, 0) / courseEnrollments.length;

  // Class-wise breakdown
  const classeMap = new Map<string, CourseEnrollment[]>();
  courseEnrollments.forEach(enrollment => {
    if (!classeMap.has(enrollment.class_level)) {
      classeMap.set(enrollment.class_level, []);
    }
    classeMap.get(enrollment.class_level)!.push(enrollment);
  });

  const class_breakdown: ClassBreakdown[] = Array.from(classeMap.entries()).map(([class_level, students]) => {
    const classAvgProgress = students.reduce((sum, s) => sum + s.progress_percentage, 0) / students.length;
    
    // Calculate assignment and quiz averages for this class
    const classStudentIds = students.map(s => s.student_id);
    const classSubmissions = submissions.filter(sub => classStudentIds.includes(sub.student_id));
    const classQuizAttempts = quizAttempts.filter(qa => classStudentIds.includes(qa.student_id));
    
    const avgAssignmentScore = classSubmissions.filter(s => s.grade !== undefined).length > 0
      ? classSubmissions.filter(s => s.grade !== undefined).reduce((sum, s) => sum + (s.grade || 0), 0) / classSubmissions.filter(s => s.grade !== undefined).length
      : 0;
    
    const avgQuizScore = classQuizAttempts.filter(qa => qa.percentage !== undefined).length > 0
      ? classQuizAttempts.filter(qa => qa.percentage !== undefined).reduce((sum, qa) => sum + (qa.percentage || 0), 0) / classQuizAttempts.filter(qa => qa.percentage !== undefined).length
      : 0;

    return {
      class_level,
      student_count: students.length,
      avg_progress: Math.round(classAvgProgress),
      avg_assignment_score: Math.round(avgAssignmentScore * 10) / 10,
      avg_quiz_score: Math.round(avgQuizScore * 10) / 10,
    };
  });

  // Student performance
  const courseAssignments = assignments.filter(a => a.course_id === courseId);
  const courseQuizzes = quizzes.filter(q => q.course_id === courseId);

  const student_performance: StudentPerformance[] = courseEnrollments.map(enrollment => {
    // Get student submissions
    const studentSubmissions = submissions.filter(
      sub => sub.student_id === enrollment.student_id && 
      courseAssignments.some(a => a.id === sub.assignment_id)
    );
    
    // Get student quiz attempts
    const studentQuizAttempts = quizAttempts.filter(
      qa => qa.student_id === enrollment.student_id && 
      courseQuizzes.some(q => q.id === qa.quiz_id)
    );

    // Calculate assignment average
    const gradedSubmissions = studentSubmissions.filter(s => s.grade !== undefined);
    const assignmentAvg = gradedSubmissions.length > 0
      ? gradedSubmissions.reduce((sum, s) => sum + (s.grade || 0), 0) / gradedSubmissions.length
      : 0;

    // Calculate quiz average
    const completedQuizzes = studentQuizAttempts.filter(qa => qa.percentage !== undefined);
    const quizAvg = completedQuizzes.length > 0
      ? completedQuizzes.reduce((sum, qa) => sum + (qa.percentage || 0), 0) / completedQuizzes.length
      : 0;

    // Determine status
    let status: 'active' | 'at_risk' | 'struggling' | 'completed' = 'active';
    if (enrollment.status === 'completed') {
      status = 'completed';
    } else if (enrollment.progress_percentage < 30 || assignmentAvg < 60) {
      status = 'struggling';
    } else if (enrollment.progress_percentage < 50 || assignmentAvg < 70) {
      status = 'at_risk';
    }

    return {
      student_id: enrollment.student_id,
      student_name: enrollment.student_name,
      roll_no: enrollment.student_id.split('-').pop() || '000',
      class_level: enrollment.class_level,
      progress_percentage: enrollment.progress_percentage,
      assignment_avg: Math.round(assignmentAvg * 10) / 10,
      assignment_completed: studentSubmissions.length,
      assignment_total: courseAssignments.length,
      quiz_avg: Math.round(quizAvg * 10) / 10,
      status,
      last_activity: enrollment.last_activity_at,
    };
  });

  const at_risk_count = student_performance.filter(
    sp => sp.status === 'at_risk' || sp.status === 'struggling'
  ).length;

  return {
    course,
    total_students: courseEnrollments.length,
    active_students: activeStudents,
    completed_students: completedStudents,
    completion_rate: courseEnrollments.length > 0 
      ? Math.round((completedStudents / courseEnrollments.length) * 1000) / 10 
      : 0,
    avg_progress: Math.round(avgProgress),
    class_breakdown,
    student_performance,
    assignments: courseAssignments,
    quizzes: courseQuizzes,
    at_risk_count,
  };
};
