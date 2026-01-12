import { Assessment, AssessmentAttempt } from '@/types/assessment';
import { Student } from '@/types/student';
import { awardAssessmentCompletionCertificate } from './certificateAutoAward';

/**
 * Submit assessment and auto-grade, then award certificate if passed
 */
export async function submitAndGradeAssessment(
  attempt: AssessmentAttempt,
  assessment: Assessment,
  student: Student,
  institutionName: string
): Promise<void> {
  // Calculate final score
  const totalScore = attempt.answers.reduce((sum, answer) => sum + answer.points_earned, 0);
  const percentage = Math.round((totalScore / assessment.total_points) * 100);
  const passed = percentage >= assessment.pass_percentage;

  // Update attempt
  attempt.score = totalScore;
  attempt.percentage = percentage;
  attempt.passed = passed;
  attempt.status = 'evaluated';
  attempt.submitted_at = new Date().toISOString();

  // Auto-award certificate if student passed and assessment has certificate
  if (passed && assessment.certificate_template_id) {
    await awardAssessmentCompletionCertificate(
      student,
      assessment,
      institutionName,
      attempt.submitted_at,
      totalScore,
      percentage
    );
  }
}

/**
 * Calculate assessment result statistics
 */
export function calculateAssessmentStats(attempt: AssessmentAttempt): {
  correctAnswers: number;
  incorrectAnswers: number;
  skippedQuestions: number;
  accuracy: number;
} {
  const correctAnswers = attempt.answers.filter(a => a.is_correct).length;
  const incorrectAnswers = attempt.answers.filter(a => !a.is_correct).length;
  const skippedQuestions = attempt.answers.length - (correctAnswers + incorrectAnswers);
  const accuracy = attempt.answers.length > 0 
    ? Math.round((correctAnswers / attempt.answers.length) * 100) 
    : 0;

  return {
    correctAnswers,
    incorrectAnswers,
    skippedQuestions,
    accuracy
  };
}
