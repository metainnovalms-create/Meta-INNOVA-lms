import { CourseContent, Assignment, Quiz, AssignmentSubmission, QuizAttempt } from '@/types/course';
import { awardCourseCompletionCertificate } from './certificateAutoAward';
import { Student } from '@/types/student';
import { Course } from '@/types/course';

export interface CompletionRequirements {
  allContentViewed: boolean;
  allAssignmentsGraded: boolean;
  allAssignmentsPassed: boolean;
  allQuizzesPassed: boolean;
}

export interface CourseCompletionResult {
  completed: boolean;
  requirements: CompletionRequirements;
  progressPercentage: number;
}

export function checkCourseCompletion(
  courseId: string,
  studentId: string,
  contentProgress: string[],
  allContent: CourseContent[],
  submissions: AssignmentSubmission[],
  assignments: Assignment[],
  quizAttempts: QuizAttempt[],
  quizzes: Quiz[]
): CourseCompletionResult {
  // Check all content viewed
  const courseContent = allContent.filter(c => c.course_id === courseId);
  const allContentViewed = courseContent.length === 0 || 
    courseContent.every(c => contentProgress.includes(c.id));

  // Check all assignments submitted and graded
  const courseAssignments = assignments.filter(a => a.course_id === courseId);
  const allAssignmentsGraded = courseAssignments.length === 0 || 
    courseAssignments.every(a => 
      submissions.some(s => 
        s.assignment_id === a.id && 
        s.student_id === studentId && 
        s.status === 'graded'
      )
    );

  // Check all assignments passed (grade >= 60%)
  const allAssignmentsPassed = courseAssignments.length === 0 || 
    courseAssignments.every(a => {
      const submission = submissions.find(s => 
        s.assignment_id === a.id && 
        s.student_id === studentId &&
        s.status === 'graded'
      );
      if (!submission || !submission.grade) return false;
      return (submission.grade / submission.total_points) >= 0.6;
    });

  // Check all quizzes passed
  const courseQuizzes = quizzes.filter(q => q.course_id === courseId);
  const allQuizzesPassed = courseQuizzes.length === 0 || 
    courseQuizzes.every(q => {
      const studentAttempts = quizAttempts
        .filter(qa => qa.quiz_id === q.id && qa.student_id === studentId && qa.status === 'graded')
        .sort((a, b) => (b.percentage || 0) - (a.percentage || 0));
      
      const bestAttempt = studentAttempts[0];
      return bestAttempt && 
        bestAttempt.percentage !== undefined && 
        bestAttempt.percentage >= q.pass_percentage;
    });

  const requirements = {
    allContentViewed,
    allAssignmentsGraded,
    allAssignmentsPassed,
    allQuizzesPassed
  };

  const completed = allContentViewed && allAssignmentsGraded && 
    allAssignmentsPassed && allQuizzesPassed;

  // Calculate progress percentage
  const totalItems = courseContent.length + courseAssignments.length + courseQuizzes.length;
  if (totalItems === 0) {
    return { completed: false, requirements, progressPercentage: 0 };
  }

  const completedContent = contentProgress.filter(id => 
    courseContent.some(c => c.id === id)
  ).length;
  
  const completedAssignments = courseAssignments.filter(a => 
    submissions.some(s => 
      s.assignment_id === a.id && 
      s.student_id === studentId && 
      s.status === 'graded'
    )
  ).length;

  const completedQuizzes = courseQuizzes.filter(q => 
    quizAttempts.some(qa => 
      qa.quiz_id === q.id && 
      qa.student_id === studentId && 
      qa.status === 'graded' &&
      (qa.percentage || 0) >= q.pass_percentage
    )
  ).length;

  const progressPercentage = Math.round(
    ((completedContent + completedAssignments + completedQuizzes) / totalItems) * 100
  );

  return { completed, requirements, progressPercentage };
}

/**
 * Award certificate when course is completed (call this after checkCourseCompletion returns completed: true)
 */
export async function awardCertificateOnCourseCompletion(
  student: Student,
  course: Course,
  institutionName: string,
  completionDate: string = new Date().toISOString()
): Promise<void> {
  await awardCourseCompletionCertificate(student, course, institutionName, completionDate);
}
