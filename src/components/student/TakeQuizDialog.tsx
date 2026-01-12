import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Quiz, QuizQuestion, QuizAttempt, QuizAnswer } from '@/types/course';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Clock, ChevronRight, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { autoGradeQuiz } from '@/utils/quizGrading';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { createNotification } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';

interface TakeQuizDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quiz: Quiz;
  questions: QuizQuestion[];
  studentId: string;
  studentName: string;
  courseId: string;
  officerId: string;
  attemptNumber: number;
  onSubmit: (attempt: QuizAttempt) => void;
}

export function TakeQuizDialog({
  open,
  onOpenChange,
  quiz,
  questions,
  studentId,
  studentName,
  courseId,
  officerId,
  attemptNumber,
  onSubmit
}: TakeQuizDialogProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, string | number>>(new Map());
  const [questionTimeRemaining, setQuestionTimeRemaining] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [completedQuestions, setCompletedQuestions] = useState<Set<string>>(new Set());
  const [timedOutQuestions, setTimedOutQuestions] = useState<Set<string>>(new Set());
  const [questionTimings, setQuestionTimings] = useState<Map<string, number>>(new Map());
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [gradedAttempt, setGradedAttempt] = useState<QuizAttempt | null>(null);

  const currentQuestion = questions[currentQuestionIndex];
  const totalEstimatedTime = questions.reduce((sum, q) => sum + q.time_limit_seconds, 0);

  // Reset everything when dialog opens
  useEffect(() => {
    if (open) {
      setAnswers(new Map());
      setCurrentQuestionIndex(0);
      setCompletedQuestions(new Set());
      setTimedOutQuestions(new Set());
      setQuestionTimings(new Map());
      setShowResults(false);
      setShowInstructions(true);
      setGradedAttempt(null);
    }
  }, [open]);

  // Initialize timer for current question
  useEffect(() => {
    if (open && !showResults && !showInstructions && currentQuestion) {
      setQuestionTimeRemaining(currentQuestion.time_limit_seconds);
      setQuestionStartTime(Date.now());
    }
  }, [open, showResults, showInstructions, currentQuestionIndex, currentQuestion]);

  // Per-question countdown timer
  useEffect(() => {
    if (!open || showResults || showInstructions || !currentQuestion) return;

    const timer = setInterval(() => {
      setQuestionTimeRemaining((prev) => {
        if (prev <= 1) {
          handleQuestionTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [open, showResults, showInstructions, currentQuestionIndex]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleQuestionTimeout = () => {
    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
    const newTimings = new Map(questionTimings);
    newTimings.set(currentQuestion.id, timeSpent);
    setQuestionTimings(newTimings);

    const newCompleted = new Set(completedQuestions);
    newCompleted.add(currentQuestion.id);
    setCompletedQuestions(newCompleted);

    // If no answer selected, mark as timed out
    if (!answers.has(currentQuestion.id)) {
      const newTimedOut = new Set(timedOutQuestions);
      newTimedOut.add(currentQuestion.id);
      setTimedOutQuestions(newTimedOut);
      toast.warning(`Time's up for question ${currentQuestionIndex + 1}!`);
    }

    // Move to next question or submit
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleAutoSubmit();
    }
  };

  const handleAnswerChange = (questionId: string, answer: string | number) => {
    setAnswers(new Map(answers).set(questionId, answer));
  };

  const handleNextQuestion = () => {
    // Save time spent on current question
    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
    const newTimings = new Map(questionTimings);
    newTimings.set(currentQuestion.id, timeSpent);
    setQuestionTimings(newTimings);

    // Mark current question as completed
    const newCompleted = new Set(completedQuestions);
    newCompleted.add(currentQuestion.id);
    setCompletedQuestions(newCompleted);

    // Move to next
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setShowSubmitConfirm(true);
    }
  };

  const handleAutoSubmit = () => {
    toast.info('Quiz completed! Submitting...');
    handleSubmit();
  };

  const handleSubmit = () => {
    // Calculate time spent on last question if not already saved
    if (!questionTimings.has(currentQuestion.id)) {
      const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
      const newTimings = new Map(questionTimings);
      newTimings.set(currentQuestion.id, timeSpent);
      setQuestionTimings(newTimings);
    }

    const quizAnswers: QuizAnswer[] = questions.map(q => ({
      question_id: q.id,
      student_answer: answers.get(q.id) || '',
      is_correct: undefined,
      points_earned: undefined,
      time_spent_seconds: questionTimings.get(q.id) || 0,
      auto_skipped: timedOutQuestions.has(q.id)
    }));

    const totalTimeSpent = Array.from(questionTimings.values()).reduce((sum, t) => sum + t, 0);

    const attempt: QuizAttempt = {
      id: `attempt-${Date.now()}`,
      quiz_id: quiz.id,
      quiz_title: quiz.title,
      student_id: studentId,
      student_name: studentName,
      attempt_number: attemptNumber,
      started_at: new Date(Date.now() - totalTimeSpent * 1000).toISOString(),
      submitted_at: new Date().toISOString(),
      time_taken_minutes: Math.round(totalTimeSpent / 60),
      status: 'submitted',
      answers: quizAnswers
    };

    // Auto-grade the quiz
    const graded = autoGradeQuiz(attempt, questions);
    
    // Store in localStorage
    const key = `quiz_attempts_${courseId}`;
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    existing.push(graded);
    localStorage.setItem(key, JSON.stringify(existing));

    // Create notification for officer if manual grading needed
    const needsManualGrading = graded.status === 'submitted';
    if (needsManualGrading) {
      createNotification(
        officerId,
        'officer',
        'quiz_completion',
        'Quiz Needs Grading',
        `${studentName} completed "${quiz.title}" - Contains short answer questions`,
        `/tenant/springfield/officer/grading`,
        {
          quiz_id: quiz.id,
          student_id: studentId,
          attempt_id: graded.id,
          course_id: courseId
        }
      );
    }

    setGradedAttempt(graded);
    setShowResults(true);
    onSubmit(graded);
    
    const passed = (graded.percentage || 0) >= quiz.pass_percentage;
    const skippedCount = timedOutQuestions.size;
    
    if (skippedCount > 0) {
      toast.success(
        passed ? `Quiz passed! ${skippedCount} question(s) were auto-skipped.` : `Quiz submitted! ${skippedCount} question(s) were auto-skipped.`
      );
    } else {
      toast.success(passed ? 'Quiz passed! 🎉' : 'Quiz submitted!');
    }
  };

  const isQuestionAnswered = (questionId: string) => {
    return answers.has(questionId) && answers.get(questionId) !== '';
  };

  const getQuestionStatus = (questionId: string, index: number) => {
    if (index === currentQuestionIndex) return 'current';
    if (completedQuestions.has(questionId)) {
      if (timedOutQuestions.has(questionId)) return 'timed-out';
      if (isQuestionAnswered(questionId)) return 'answered';
      return 'skipped';
    }
    return 'upcoming';
  };

  const getTimerColor = () => {
    if (!currentQuestion) return 'text-foreground';
    const percentage = (questionTimeRemaining / currentQuestion.time_limit_seconds) * 100;
    if (percentage < 20) return 'text-destructive';
    if (percentage < 50) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getTimerProgress = () => {
    if (!currentQuestion) return 0;
    return (questionTimeRemaining / currentQuestion.time_limit_seconds) * 100;
  };

  // Instructions screen
  if (showInstructions && !showResults) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{quiz.title} - Instructions</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold mb-2">⏱️ Per-Question Timer System</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Each question has its own time limit</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>When time expires, you automatically move to the next question</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span><strong>You cannot return to previous questions</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Unanswered questions will be skipped if time runs out</span>
                </li>
              </ul>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Total Questions</p>
                <p className="text-2xl font-bold">{questions.length}</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Estimated Time</p>
                <p className="text-2xl font-bold">{formatTime(totalEstimatedTime)}</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Pass Percentage</p>
                <p className="text-2xl font-bold">{quiz.pass_percentage}%</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Attempts Allowed</p>
                <p className="text-2xl font-bold">{quiz.attempts_allowed}</p>
              </div>
            </div>

            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>⚠️ Important:</strong> Make sure you have a stable internet connection and won't be interrupted during the quiz.
              </p>
            </div>

            <Button onClick={() => setShowInstructions(false)} className="w-full" size="lg">
              Start Quiz
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Results screen
  if (showResults && gradedAttempt) {
    const passed = (gradedAttempt.percentage || 0) >= quiz.pass_percentage;
    const skippedCount = timedOutQuestions.size;
    
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Quiz Results</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className={cn(
              "p-6 rounded-lg",
              passed ? 'bg-green-50 border-2 border-green-500' : 'bg-red-50 border-2 border-red-500'
            )}>
              <h3 className="text-2xl font-bold mb-2">
                {passed ? '✅ Passed!' : '❌ Not Passed'}
              </h3>
              <p className="text-4xl font-bold mb-4">
                {gradedAttempt.percentage?.toFixed(1)}%
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Score</p>
                  <p className="font-semibold">{gradedAttempt.score} points</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Time Taken</p>
                  <p className="font-semibold">{gradedAttempt.time_taken_minutes} minutes</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Pass Mark</p>
                  <p className="font-semibold">{quiz.pass_percentage}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Attempt</p>
                  <p className="font-semibold">{attemptNumber} of {quiz.attempts_allowed}</p>
                </div>
              </div>
            </div>

            {skippedCount > 0 && (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm text-orange-800">
                  ⏱️ {skippedCount} question(s) were auto-skipped due to timeout
                </p>
              </div>
            )}

            {gradedAttempt.status === 'submitted' && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  ⏳ Some questions require manual grading by your instructor. Your final score may change.
                </p>
              </div>
            )}

            {!passed && attemptNumber < quiz.attempts_allowed && (
              <p className="text-sm text-muted-foreground">
                You have {quiz.attempts_allowed - attemptNumber} attempt(s) remaining.
              </p>
            )}

            <Button onClick={() => onOpenChange(false)} className="w-full">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Quiz taking interface
  const answeredCount = questions.filter(q => isQuestionAnswered(q.id)).length;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{quiz.title}</span>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-muted-foreground">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </span>
              </div>
            </DialogTitle>
          </DialogHeader>

          {/* Per-question timer */}
          <div className="space-y-2">
            <div className={cn("flex items-center justify-between font-mono text-lg", getTimerColor())}>
              <span className="text-sm text-muted-foreground">Time Remaining:</span>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                {formatTime(questionTimeRemaining)}
              </div>
            </div>
            <Progress value={getTimerProgress()} className="h-2" />
          </div>

          <div className="flex-1 flex gap-4 overflow-hidden">
            {/* Question navigation sidebar */}
            <div className="w-48 border-r pr-4 overflow-y-auto">
              <p className="text-sm font-medium mb-2">Questions</p>
              <div className="grid grid-cols-4 gap-2">
                {questions.map((q, idx) => {
                  const status = getQuestionStatus(q.id, idx);
                  const isCompleted = completedQuestions.has(q.id);
                  
                  return (
                    <Button
                      key={q.id}
                      size="sm"
                      variant={
                        status === 'current' ? 'default' : 
                        status === 'answered' ? 'secondary' : 
                        status === 'timed-out' ? 'destructive' : 
                        'outline'
                      }
                      className={cn(
                        "w-full relative",
                        isCompleted && "opacity-50 cursor-not-allowed"
                      )}
                      disabled={isCompleted}
                      onClick={() => !isCompleted && setCurrentQuestionIndex(idx)}
                      title={
                        isCompleted ? "Time expired - Cannot return" : 
                        status === 'answered' ? "Answered" :
                        status === 'timed-out' ? "Timed out" :
                        ""
                      }
                    >
                      {idx + 1}
                      {status === 'answered' && <CheckCircle className="absolute -top-1 -right-1 h-3 w-3" />}
                      {status === 'timed-out' && <XCircle className="absolute -top-1 -right-1 h-3 w-3" />}
                    </Button>
                  );
                })}
              </div>
              
              {/* Legend */}
              <div className="mt-4 space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-primary" />
                  <span>Current</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-secondary" />
                  <span>Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-destructive" />
                  <span>Timed out</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded border" />
                  <span>Upcoming</span>
                </div>
              </div>
            </div>

            {/* Question content */}
            <div className="flex-1 overflow-y-auto">
              {currentQuestion && (
                <div className="space-y-6">
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs text-muted-foreground">
                        {currentQuestion.question_type.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className="text-xs font-semibold">{currentQuestion.points} points</span>
                    </div>
                    <p className="font-medium text-lg">{currentQuestion.question_text}</p>
                  </div>

                  {/* MCQ */}
                  {currentQuestion.question_type === 'mcq' && currentQuestion.options && (
                    <RadioGroup
                      value={String(answers.get(currentQuestion.id) || '')}
                      onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
                    >
                      {currentQuestion.options.map((option, idx) => (
                        <div key={idx} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted cursor-pointer">
                          <RadioGroupItem value={option} id={`option-${idx}`} />
                          <Label htmlFor={`option-${idx}`} className="flex-1 cursor-pointer">
                            {option}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  )}

                  {/* True/False */}
                  {currentQuestion.question_type === 'true_false' && (
                    <div className="space-y-3">
                      <Button
                        variant={answers.get(currentQuestion.id) === 'true' ? 'default' : 'outline'}
                        className="w-full"
                        onClick={() => handleAnswerChange(currentQuestion.id, 'true')}
                      >
                        True
                      </Button>
                      <Button
                        variant={answers.get(currentQuestion.id) === 'false' ? 'default' : 'outline'}
                        className="w-full"
                        onClick={() => handleAnswerChange(currentQuestion.id, 'false')}
                      >
                        False
                      </Button>
                    </div>
                  )}

                  {/* Short Answer */}
                  {currentQuestion.question_type === 'short_answer' && (
                    <Textarea
                      placeholder="Enter your answer..."
                      value={String(answers.get(currentQuestion.id) || '')}
                      onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                      rows={6}
                    />
                  )}

                  {/* Fill in the Blank */}
                  {currentQuestion.question_type === 'fill_blank' && (
                    <Input
                      placeholder="Enter your answer..."
                      value={String(answers.get(currentQuestion.id) || '')}
                      onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                    />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {answeredCount} / {questions.length} answered
            </div>

            {currentQuestionIndex < questions.length - 1 ? (
              <Button onClick={handleNextQuestion}>
                Next Question
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={() => setShowSubmitConfirm(true)} variant="default">
                Finish Quiz
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showSubmitConfirm} onOpenChange={setShowSubmitConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Quiz?</AlertDialogTitle>
            <AlertDialogDescription>
              {answeredCount < questions.length && (
                <p className="text-destructive mb-2">
                  You have answered {answeredCount} of {questions.length} questions.
                </p>
              )}
              {timedOutQuestions.size > 0 && (
                <p className="text-orange-600 mb-2">
                  {timedOutQuestions.size} question(s) were auto-skipped due to timeout.
                </p>
              )}
              Once submitted, you cannot change your answers. Are you sure you want to submit?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Go Back</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit}>
              Submit Quiz
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
