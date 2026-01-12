import { QuizAttempt, QuizQuestion } from '@/types/course';

export function autoGradeQuiz(
  attempt: QuizAttempt,
  questions: QuizQuestion[]
): QuizAttempt {
  let totalScore = 0;
  let totalPoints = 0;
  let needsManualGrading = false;

  const gradedAnswers = attempt.answers.map(answer => {
    const question = questions.find(q => q.id === answer.question_id);
    if (!question) return answer;
    
    totalPoints += question.points;

    // Auto-skipped questions get 0 points automatically
    if (answer.auto_skipped) {
      return {
        ...answer,
        is_correct: false,
        points_earned: 0
      };
    }

    // Auto-grade MCQ and True/False questions
    if (question.question_type === 'mcq' || question.question_type === 'true_false') {
      const isCorrect = String(answer.student_answer).trim().toLowerCase() === 
                        String(question.correct_answer).trim().toLowerCase();
      const points = isCorrect ? question.points : 0;
      totalScore += points;
      return { 
        ...answer, 
        is_correct: isCorrect, 
        points_earned: points 
      };
    } else {
      // Short answer and fill blank need manual grading
      needsManualGrading = true;
      return { 
        ...answer, 
        is_correct: undefined, 
        points_earned: 0 
      };
    }
  });

  return {
    ...attempt,
    answers: gradedAnswers,
    score: totalScore,
    percentage: totalPoints > 0 ? Math.round((totalScore / totalPoints) * 100) : 0,
    status: needsManualGrading ? 'submitted' : 'graded',
    submitted_at: new Date().toISOString()
  };
}

export function calculateQuizScore(attempt: QuizAttempt): number {
  return attempt.answers.reduce((sum, answer) => {
    return sum + (answer.points_earned || 0);
  }, 0);
}

export function hasPassedQuiz(attempt: QuizAttempt, passPercentage: number): boolean {
  return (attempt.percentage || 0) >= passPercentage;
}
