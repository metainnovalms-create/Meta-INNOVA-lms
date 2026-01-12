import { AssignmentSubmission, AssignmentQuestion, AssignmentAnswer } from '@/types/course';

interface GradedAnswer extends AssignmentAnswer {
  is_correct?: boolean;
  points_earned?: number;
}

interface GradingResult {
  totalScore: number;
  maxScore: number;
  gradedAnswers: GradedAnswer[];
  needsManualGrading: boolean;
}

/**
 * Auto-grades objective questions in an assignment
 * MCQ and True/False questions are auto-graded
 * Short Answer and Fill Blank require manual grading
 */
export function autoGradeAssignment(
  submission: AssignmentSubmission,
  questions: AssignmentQuestion[]
): AssignmentSubmission {
  if (!submission.answers) {
    return submission;
  }

  let totalScore = 0;
  let maxScore = 0;
  let needsManualGrading = false;

  const gradedAnswers: GradedAnswer[] = submission.answers.map(answer => {
    const question = questions.find(q => q.id === answer.question_id);
    if (!question) return answer;

    maxScore += question.points;

    // Auto-skip or no answer
    if (answer.auto_skipped || !answer.answer || answer.answer === '') {
      return {
        ...answer,
        is_correct: false,
        points_earned: 0
      };
    }

    // Auto-grade objective questions
    if (question.question_type === 'mcq' || question.question_type === 'true_false') {
      const isCorrect = String(answer.answer).toLowerCase() === String(question.correct_answer).toLowerCase();
      const pointsEarned = isCorrect ? question.points : 0;
      totalScore += pointsEarned;

      return {
        ...answer,
        is_correct: isCorrect,
        points_earned: pointsEarned
      };
    }

    // Subjective questions need manual grading
    if (question.question_type === 'short_answer' || question.question_type === 'fill_blank') {
      needsManualGrading = true;

      // If correct answer is provided, try partial matching for short answers
      if (question.correct_answer && question.question_type === 'short_answer') {
        const studentAnswer = String(answer.answer).toLowerCase().trim();
        const correctAnswer = String(question.correct_answer).toLowerCase().trim();
        
        // Exact match
        if (studentAnswer === correctAnswer) {
          const pointsEarned = question.points;
          totalScore += pointsEarned;
          return {
            ...answer,
            is_correct: true,
            points_earned: pointsEarned
          };
        }
        
        // Partial match (contains the correct answer)
        if (studentAnswer.includes(correctAnswer) || correctAnswer.includes(studentAnswer)) {
          const partialPoints = Math.floor(question.points * 0.7); // 70% for partial match
          totalScore += partialPoints;
          return {
            ...answer,
            is_correct: false,
            points_earned: partialPoints
          };
        }
      }

      // Needs manual grading
      return {
        ...answer,
        is_correct: undefined,
        points_earned: 0 // Will be updated by instructor
      };
    }

    return answer;
  });

  return {
    ...submission,
    answers: gradedAnswers,
    grade: totalScore,
    status: needsManualGrading ? 'pending' : 'graded',
    feedback: needsManualGrading 
      ? 'Auto-graded. Some questions require manual review.' 
      : 'Auto-graded successfully.'
  };
}

/**
 * Calculate assignment statistics
 */
export function calculateAssignmentStats(
  submission: AssignmentSubmission,
  questions: AssignmentQuestion[]
): {
  totalQuestions: number;
  answeredQuestions: number;
  skippedQuestions: number;
  correctAnswers: number;
  percentage: number;
} {
  const totalQuestions = questions.length;
  const answers = submission.answers || [];
  
  const answeredQuestions = answers.filter(a => 
    !a.auto_skipped && a.answer && a.answer !== ''
  ).length;
  
  const skippedQuestions = answers.filter(a => a.auto_skipped).length;
  
  const correctAnswers = answers.filter(a => 
    'is_correct' in a && a.is_correct === true
  ).length;
  
  const maxScore = questions.reduce((sum, q) => sum + q.points, 0);
  const percentage = maxScore > 0 ? ((submission.grade || 0) / maxScore) * 100 : 0;

  return {
    totalQuestions,
    answeredQuestions,
    skippedQuestions,
    correctAnswers,
    percentage
  };
}
