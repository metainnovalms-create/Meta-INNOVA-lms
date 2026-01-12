import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { assessmentService } from '@/services/assessment.service';
import { Assessment, AssessmentQuestion, AssessmentAttempt } from '@/types/assessment';
import { formatTimeRemaining } from '@/utils/assessmentHelpers';
import { Clock, AlertTriangle, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export default function TakeAssessment() {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [attempt, setAttempt] = useState<AssessmentAttempt | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, string>>(new Map());
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showTimeWarning, setShowTimeWarning] = useState(false);
  
  // Time tracking per question
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [questionTimeSpent, setQuestionTimeSpent] = useState<Map<string, number>>(new Map());

  // Refs for stable references in callbacks
  const attemptRef = useRef<AssessmentAttempt | null>(null);
  const isAutoSubmittingRef = useRef(false);
  const hasLoadedRef = useRef(false);

  const studentId = user?.id || '';
  const classId = user?.class_id || '';
  const institutionId = user?.institution_id || user?.tenant_id || '';

  // Get tenant slug for navigation
  const getTenantPath = () => {
    try {
      const tenant = localStorage.getItem('tenant');
      if (tenant) {
        const parsed = JSON.parse(tenant);
        return `/tenant/${parsed.slug}`;
      }
    } catch {}
    return '/student';
  };

  // Update attempt ref when state changes
  useEffect(() => {
    attemptRef.current = attempt;
  }, [attempt]);

  // Auto-submit handler with stable ref
  const handleAutoSubmit = useCallback(async () => {
    if (isAutoSubmittingRef.current || !attemptRef.current) return;
    isAutoSubmittingRef.current = true;
    toast.info('Time is up! Assessment auto-submitted.');
    
    try {
      const success = await assessmentService.submitAttempt(attemptRef.current.id, true);
      if (success) {
        toast.success('Assessment submitted successfully!');
        navigate(`${getTenantPath()}/student/assessments`);
      } else {
        toast.error('Failed to submit assessment');
        isAutoSubmittingRef.current = false;
      }
    } catch (error) {
      console.error('Error auto-submitting:', error);
      toast.error('Failed to submit assessment');
      isAutoSubmittingRef.current = false;
    }
  }, [navigate]);

  // Reload warning - prevent accidental navigation during assessment
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (attempt && attempt.status === 'in_progress') {
        e.preventDefault();
        e.returnValue = 'You have an assessment in progress. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [attempt]);

  // Load assessment and start/resume attempt
  useEffect(() => {
    if (hasLoadedRef.current) return;
    
    const loadAssessment = async () => {
      if (!assessmentId || !studentId) return;

      setIsLoading(true);
      try {
        const loadedAssessment = await assessmentService.getAssessmentById(assessmentId);
        if (!loadedAssessment) {
          toast.error('Assessment not found');
          navigate(`${getTenantPath()}/student/assessments`);
          return;
        }

        setAssessment(loadedAssessment);

        // Start or resume attempt
        const attemptResult = await assessmentService.startAttempt(
          assessmentId,
          studentId,
          classId,
          institutionId
        );

        if (!attemptResult) {
          toast.error('Failed to start assessment');
          navigate(`${getTenantPath()}/student/assessments`);
          return;
        }

        setAttempt(attemptResult);
        attemptRef.current = attemptResult;
        hasLoadedRef.current = true;

        // Load questions - use stored order if available, otherwise load fresh
        let loadedQuestions = await assessmentService.getQuestions(assessmentId);
        
        // Check if we have a stored question order (for shuffle persistence)
        if (attemptResult.question_order && Array.isArray(attemptResult.question_order)) {
          // Reorder questions based on stored order
          const orderMap = new Map(attemptResult.question_order.map((id: string, idx: number) => [id, idx]));
          loadedQuestions = [...loadedQuestions].sort((a, b) => {
            const aIdx = orderMap.get(a.id) ?? 999;
            const bIdx = orderMap.get(b.id) ?? 999;
            return aIdx - bIdx;
          });
        } else if (loadedAssessment.shuffle_questions) {
          // First time loading with shuffle - shuffle and save the order
          loadedQuestions = [...loadedQuestions].sort(() => Math.random() - 0.5);
          const questionOrder = loadedQuestions.map(q => q.id);
          // Save the shuffled order to the attempt
          await assessmentService.updateAttemptQuestionOrder(attemptResult.id, questionOrder);
        }
        
        setQuestions(loadedQuestions);

        // Load existing answers if resuming
        const existingAnswers = await assessmentService.getAttemptAnswers(attemptResult.id);
        if (existingAnswers.length > 0) {
          const answersMap = new Map<string, string>();
          existingAnswers.forEach(a => {
            if (a.selected_option_id) {
              answersMap.set(a.question_id, a.selected_option_id);
            }
          });
          setAnswers(answersMap);
        }

        // Calculate remaining time from attempt started_at
        const startedAt = new Date(attemptResult.started_at).getTime();
        const durationMs = loadedAssessment.duration_minutes * 60 * 1000;
        const elapsedMs = Date.now() - startedAt;
        const remainingSeconds = Math.max(0, Math.floor((durationMs - elapsedMs) / 1000));

        // If time already expired, auto-submit
        if (remainingSeconds <= 0) {
          handleAutoSubmit();
          return;
        }

        setTimeRemaining(remainingSeconds);
      } catch (error) {
        console.error('Error loading assessment:', error);
        toast.error('Failed to load assessment');
      } finally {
        setIsLoading(false);
      }
    };

    loadAssessment();
  }, [assessmentId, studentId, classId, institutionId, navigate, handleAutoSubmit]);

  // Timer countdown
  useEffect(() => {
    if (!attempt || timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleAutoSubmit();
          return 0;
        }
        // Show warning at 5 minutes and 1 minute
        if (prev === 300 || prev === 60) {
          setShowTimeWarning(true);
          setTimeout(() => setShowTimeWarning(false), 5000);
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [attempt, timeRemaining, handleAutoSubmit]);

  const handleAnswerSelect = async (optionId: string) => {
    if (!attempt || !currentQuestion) return;

    // Calculate time spent on this question
    const timeSpentOnQuestion = Math.floor((Date.now() - questionStartTime) / 1000);
    const existingTime = questionTimeSpent.get(currentQuestion.id) || 0;
    const totalTimeSpent = existingTime + timeSpentOnQuestion;
    
    // Update the time spent map
    const newTimeSpent = new Map(questionTimeSpent);
    newTimeSpent.set(currentQuestion.id, totalTimeSpent);
    setQuestionTimeSpent(newTimeSpent);
    
    // Reset timer for next interaction on this question
    setQuestionStartTime(Date.now());

    const newAnswers = new Map(answers);
    newAnswers.set(currentQuestion.id, optionId);
    setAnswers(newAnswers);

    // Save answer to database
    const isCorrect = optionId === currentQuestion.correct_option_id;
    const pointsEarned = isCorrect ? currentQuestion.points : 0;
    
    await assessmentService.saveAnswer(
      attempt.id,
      currentQuestion.id,
      optionId,
      isCorrect,
      pointsEarned,
      totalTimeSpent
    );
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      // Save time spent on current question before navigating
      if (currentQuestion) {
        const timeSpentOnQuestion = Math.floor((Date.now() - questionStartTime) / 1000);
        const existingTime = questionTimeSpent.get(currentQuestion.id) || 0;
        const newTimeSpent = new Map(questionTimeSpent);
        newTimeSpent.set(currentQuestion.id, existingTime + timeSpentOnQuestion);
        setQuestionTimeSpent(newTimeSpent);
      }
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setQuestionStartTime(Date.now());
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      // Save time spent on current question before navigating
      if (currentQuestion) {
        const timeSpentOnQuestion = Math.floor((Date.now() - questionStartTime) / 1000);
        const existingTime = questionTimeSpent.get(currentQuestion.id) || 0;
        const newTimeSpent = new Map(questionTimeSpent);
        newTimeSpent.set(currentQuestion.id, existingTime + timeSpentOnQuestion);
        setQuestionTimeSpent(newTimeSpent);
      }
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setQuestionStartTime(Date.now());
    }
  };

  const handleQuestionJump = (index: number) => {
    // Save time spent on current question before jumping
    if (currentQuestion) {
      const timeSpentOnQuestion = Math.floor((Date.now() - questionStartTime) / 1000);
      const existingTime = questionTimeSpent.get(currentQuestion.id) || 0;
      const newTimeSpent = new Map(questionTimeSpent);
      newTimeSpent.set(currentQuestion.id, existingTime + timeSpentOnQuestion);
      setQuestionTimeSpent(newTimeSpent);
    }
    setCurrentQuestionIndex(index);
    setQuestionStartTime(Date.now());
  };

  const handleSubmit = async (isAutoSubmit: boolean = false) => {
    if (!attempt) return;

    setIsSubmitting(true);
    setShowSubmitDialog(false);

    try {
      const success = await assessmentService.submitAttempt(attempt.id, isAutoSubmit);
      
      if (success) {
        toast.success('Assessment submitted successfully!');
        navigate(`${getTenantPath()}/student/assessments`);
      } else {
        toast.error('Failed to submit assessment');
      }
    } catch (error) {
      console.error('Error submitting assessment:', error);
      toast.error('Failed to submit assessment');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading assessment...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!assessment || questions.length === 0) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Assessment Not Found</h2>
            <p className="text-muted-foreground">The assessment you're looking for doesn't exist or has no questions.</p>
            <Button className="mt-4" onClick={() => navigate(`${getTenantPath()}/student/assessments`)}>
              Back to Assessments
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const answeredCount = answers.size;
  const progress = (answeredCount / questions.length) * 100;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{assessment.title}</h1>
            <p className="text-muted-foreground">{assessment.description}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              <Badge variant={timeRemaining < 300 ? 'destructive' : 'secondary'} className="text-lg font-mono">
                {formatTimeRemaining(timeRemaining)}
              </Badge>
            </div>
          </div>
        </div>

        {/* Time Warning */}
        {showTimeWarning && (
          <div className="bg-amber-100 border border-amber-300 text-amber-900 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-medium">
              {timeRemaining <= 60 ? '1 minute' : '5 minutes'} remaining!
            </span>
          </div>
        )}

        {/* Progress */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{answeredCount} / {questions.length} answered</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-4 gap-6">
          {/* Question Navigation Sidebar */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle className="text-sm">Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-2">
                {questions.map((q, index) => {
                  const isAnswered = answers.has(q.id);
                  const isCurrent = index === currentQuestionIndex;
                  return (
                    <button
                      key={q.id}
                      onClick={() => handleQuestionJump(index)}
                      className={`
                        aspect-square rounded-md flex items-center justify-center text-sm font-medium
                        transition-colors
                        ${isCurrent ? 'bg-primary text-primary-foreground' : ''}
                        ${!isCurrent && isAnswered ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : ''}
                        ${!isCurrent && !isAnswered ? 'bg-muted hover:bg-muted/80' : ''}
                      `}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Question Display */}
          <div className="col-span-3 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    Question {currentQuestionIndex + 1} of {questions.length}
                  </CardTitle>
                  <Badge variant="outline">{currentQuestion.points} points</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-lg">{currentQuestion.question_text}</p>

                {/* Display question image if available */}
                {currentQuestion.image_url && (
                  <div className="my-4">
                    <img 
                      src={currentQuestion.image_url} 
                      alt="Question image"
                      className="max-w-full max-h-96 object-contain rounded-lg border"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}

                {currentQuestion.code_snippet && (
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                    <code>{currentQuestion.code_snippet}</code>
                  </pre>
                )}

                <RadioGroup
                  key={currentQuestion.id}
                  value={answers.get(currentQuestion.id) || ''}
                  onValueChange={handleAnswerSelect}
                  className="space-y-3"
                >
                  {currentQuestion.options.map((option) => {
                    const uniqueOptionId = `${currentQuestion.id}-${option.id}`;
                    return (
                      <div
                        key={uniqueOptionId}
                        className={`
                          flex items-center space-x-3 p-4 rounded-lg border-2 transition-colors cursor-pointer
                          ${answers.get(currentQuestion.id) === option.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                          }
                        `}
                      >
                        <RadioGroupItem value={option.id} id={uniqueOptionId} />
                        <Label htmlFor={uniqueOptionId} className="flex-1 cursor-pointer">
                          <span className="font-medium mr-2">{option.option_label}.</span>
                          {option.option_text}
                        </Label>
                      </div>
                    );
                  })}
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
              >
                Previous
              </Button>
              
              <div className="flex gap-2">
                {currentQuestionIndex === questions.length - 1 ? (
                  <Button onClick={() => setShowSubmitDialog(true)} disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                    Submit Assessment
                  </Button>
                ) : (
                  <Button onClick={handleNext}>
                    Next
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Dialog */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Assessment?</AlertDialogTitle>
            <AlertDialogDescription>
              You have answered {answeredCount} out of {questions.length} questions.
              {answeredCount < questions.length && (
                <span className="block mt-2 text-amber-600 font-medium">
                  {questions.length - answeredCount} questions are unanswered and will be marked as incorrect.
                </span>
              )}
              <span className="block mt-2">
                Are you sure you want to submit? This action cannot be undone.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Review Answers</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleSubmit(false)} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Submit Assessment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}