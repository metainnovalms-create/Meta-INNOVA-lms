import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Assignment, AssignmentQuestion, AssignmentSubmission, AssignmentAnswer } from '@/types/course';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Clock, ChevronRight, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { autoGradeAssignment } from '@/utils/assignmentGrading';
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

interface TakeAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignment: Assignment;
  questions: AssignmentQuestion[];
  studentId: string;
  studentName: string;
  courseId: string;
  officerId: string;
  onSubmit: (submission: AssignmentSubmission) => void;
}

export function TakeAssignmentDialog({
  open,
  onOpenChange,
  assignment,
  questions,
  studentId,
  studentName,
  courseId,
  officerId,
  onSubmit
}: TakeAssignmentDialogProps) {
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
  const [gradedSubmission, setGradedSubmission] = useState<AssignmentSubmission | null>(null);

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
      setGradedSubmission(null);
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
    toast.info('Assignment completed! Submitting...');
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

    const assignmentAnswers: AssignmentAnswer[] = questions.map(q => ({
      question_id: q.id,
      answer: answers.get(q.id) || '',
      time_spent_seconds: questionTimings.get(q.id) || 0,
      auto_skipped: timedOutQuestions.has(q.id)
    }));

    const totalTimeSpent = Array.from(questionTimings.values()).reduce((sum, t) => sum + t, 0);

    const submission: AssignmentSubmission = {
      id: `submission-${Date.now()}`,
      assignment_id: assignment.id,
      assignment_title: assignment.title,
      student_id: studentId,
      student_name: studentName,
      submitted_at: new Date().toISOString(),
      status: 'pending',
      total_points: assignment.total_points,
      answers: assignmentAnswers,
      time_spent_seconds: totalTimeSpent
    };

    // Auto-grade the assignment
    const graded = autoGradeAssignment(submission, questions);
    
    // Store in localStorage
    const key = `submissions_${courseId}`;
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    existing.push(graded);
    localStorage.setItem(key, JSON.stringify(existing));

    // Create notification for officer if manual grading needed
    const needsManualGrading = graded.status === 'pending';
    if (needsManualGrading) {
      createNotification(
        officerId,
        'officer',
        'assignment_submission',
        'Assignment Needs Grading',
        `${studentName} completed "${assignment.title}" - Contains subjective questions`,
        `/tenant/springfield/officer/grading`,
        {
          assignment_id: assignment.id,
          student_id: studentId,
          submission_id: graded.id,
          course_id: courseId
        }
      );
    }

    setGradedSubmission(graded);
    setShowResults(true);
    onSubmit(graded);
    
    const skippedCount = timedOutQuestions.size;
    
    if (skippedCount > 0) {
      toast.success(`Assignment submitted! ${skippedCount} question(s) were auto-skipped.`);
    } else {
      toast.success('Assignment submitted! 🎉');
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
            <DialogTitle>{assignment.title} - Instructions</DialogTitle>
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
                <p className="text-sm text-muted-foreground">Total Points</p>
                <p className="text-2xl font-bold">{assignment.total_points}</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Assignment Type</p>
                <p className="text-xl font-bold">⏱️ Timed</p>
              </div>
            </div>

            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>⚠️ Important:</strong> Make sure you have a stable internet connection and won't be interrupted during the assignment.
              </p>
            </div>

            <Button onClick={() => setShowInstructions(false)} className="w-full" size="lg">
              Start Assessment
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Results screen
  if (showResults && gradedSubmission) {
    const skippedCount = timedOutQuestions.size;
    const autoGradedScore = gradedSubmission.grade || 0;
    const percentage = (autoGradedScore / assignment.total_points) * 100;
    
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assignment Results</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="p-6 rounded-lg bg-blue-50 border-2 border-blue-500">
              <h3 className="text-2xl font-bold mb-2">
                ✅ Submitted!
              </h3>
              <p className="text-4xl font-bold mb-4">
                {percentage.toFixed(1)}%
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Auto-Graded Score</p>
                  <p className="font-semibold">{autoGradedScore} / {assignment.total_points} points</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Time Spent</p>
                  <p className="font-semibold">{Math.round((gradedSubmission.time_spent_seconds || 0) / 60)} minutes</p>
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

            {gradedSubmission.status === 'pending' && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  ⏳ Some questions require manual grading by your instructor. Your final score may change.
                </p>
              </div>
            )}

            <Button onClick={() => onOpenChange(false)} className="w-full">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Assignment taking interface
  const answeredCount = questions.filter(q => isQuestionAnswered(q.id)).length;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{assignment.title}</span>
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
                    >
                      {idx + 1}
                      {status === 'answered' && <CheckCircle className="h-3 w-3 absolute -top-1 -right-1" />}
                      {status === 'timed-out' && <XCircle className="h-3 w-3 absolute -top-1 -right-1" />}
                    </Button>
                  );
                })}
              </div>
              <div className="mt-4 space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-primary rounded" />
                  <span>Current</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-secondary rounded" />
                  <span>Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-destructive rounded" />
                  <span>Timed Out</span>
                </div>
              </div>
            </div>

            {/* Question content */}
            <div className="flex-1 overflow-y-auto">
              <div className="space-y-6">
                <div>
                  <Label className="text-lg font-semibold mb-4 block">
                    Question {currentQuestionIndex + 1}
                  </Label>
                  <p className="text-base mb-4">{currentQuestion.question_text}</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Points: {currentQuestion.points} | Time: {formatTime(currentQuestion.time_limit_seconds)}
                  </p>
                </div>

                {/* Answer input based on question type */}
                {currentQuestion.question_type === 'mcq' && (
                  <RadioGroup
                    value={String(answers.get(currentQuestion.id) || '')}
                    onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
                  >
                    {currentQuestion.options?.map((option, idx) => (
                      <div key={idx} className="flex items-center space-x-2 p-3 border rounded hover:bg-accent">
                        <RadioGroupItem value={option} id={`option-${idx}`} />
                        <Label htmlFor={`option-${idx}`} className="flex-1 cursor-pointer">
                          {option}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}

                {currentQuestion.question_type === 'true_false' && (
                  <RadioGroup
                    value={String(answers.get(currentQuestion.id) || '')}
                    onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
                  >
                    <div className="flex items-center space-x-2 p-3 border rounded hover:bg-accent">
                      <RadioGroupItem value="true" id="true" />
                      <Label htmlFor="true" className="flex-1 cursor-pointer">True</Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border rounded hover:bg-accent">
                      <RadioGroupItem value="false" id="false" />
                      <Label htmlFor="false" className="flex-1 cursor-pointer">False</Label>
                    </div>
                  </RadioGroup>
                )}

                {currentQuestion.question_type === 'short_answer' && (
                  <Input
                    placeholder="Enter your answer..."
                    value={String(answers.get(currentQuestion.id) || '')}
                    onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                  />
                )}

                {currentQuestion.question_type === 'fill_blank' && (
                  <Textarea
                    placeholder="Enter your answer..."
                    rows={6}
                    value={String(answers.get(currentQuestion.id) || '')}
                    onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                  />
                )}

                <div className="flex justify-end">
                  <Button
                    onClick={handleNextQuestion}
                    disabled={!isQuestionAnswered(currentQuestion.id)}
                  >
                    {currentQuestionIndex < questions.length - 1 ? (
                      <>
                        Next Question
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </>
                    ) : (
                      'Submit Assignment'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showSubmitConfirm} onOpenChange={setShowSubmitConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Assignment?</AlertDialogTitle>
            <AlertDialogDescription>
              You've answered {answeredCount} out of {questions.length} questions.
              {answeredCount < questions.length && ` ${questions.length - answeredCount} question(s) will be marked as unanswered.`}
              {' '}Are you sure you want to submit?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Review</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit}>Submit</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
