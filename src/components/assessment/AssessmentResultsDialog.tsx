import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Assessment, AssessmentAttempt, AssessmentQuestion, AssessmentAnswer } from '@/types/assessment';
import { assessmentService } from '@/services/assessment.service';
import { CheckCircle, XCircle, Clock, Award, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AssessmentResultsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assessment: Assessment;
  attempt: AssessmentAttempt;
}

export const AssessmentResultsDialog = ({
  open,
  onOpenChange,
  assessment,
  attempt
}: AssessmentResultsDialogProps) => {
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [answers, setAnswers] = useState<AssessmentAnswer[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!open || !assessment?.id || !attempt?.id) return;
      
      setIsLoading(true);
      try {
        const [loadedQuestions, loadedAnswers] = await Promise.all([
          assessmentService.getQuestions(assessment.id),
          assessmentService.getAttemptAnswers(attempt.id)
        ]);
        setQuestions(loadedQuestions);
        setAnswers(loadedAnswers);
      } catch (error) {
        console.error('Error loading results:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [open, assessment?.id, attempt?.id]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Assessment Results: {assessment.title}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <div className="space-y-6 p-6">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="h-5 w-5 text-primary" />
                    <span className="text-sm text-muted-foreground">Score</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {attempt.score}/{attempt.total_points}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {attempt.percentage.toFixed(1)}%
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    {attempt.passed ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <span className="text-sm text-muted-foreground">Status</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {attempt.passed ? 'Passed' : 'Failed'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Required: {assessment.pass_percentage}%
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-5 w-5 text-primary" />
                    <span className="text-sm text-muted-foreground">Time Taken</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {formatTime(attempt.time_taken_seconds || 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Allowed: {assessment.duration_minutes}m
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Overall Performance</span>
                <span className="font-medium">{attempt.percentage.toFixed(1)}%</span>
              </div>
              <Progress value={attempt.percentage} className="h-3" />
            </div>

            {/* Question-wise breakdown */}
            {assessment.allow_review_after_submission && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Question-wise Breakdown</h3>
                
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">Loading questions...</span>
                  </div>
                ) : questions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No questions found for this assessment.
                  </div>
                ) : (
                  questions.map((question, index) => {
                    // Find answer by question ID
                    const answer = answers.find(a => a.question_id === question.id);
                    const isCorrect = answer?.is_correct || false;
                    const selectedOption = question.options.find(o => o.id === answer?.selected_option_id);
                    const correctOption = question.options.find(o => o.id === question.correct_option_id);

                    return (
                      <Card key={question.id} className={isCorrect ? 'border-green-200' : 'border-red-200'}>
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant={isCorrect ? 'default' : 'destructive'}>
                                  Question {index + 1}
                                </Badge>
                                {isCorrect ? (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-600" />
                                )}
                              </div>
                              <p className="text-sm font-medium mb-2">{question.question_text}</p>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium">
                                {answer?.points_earned || 0}/{question.points}
                              </div>
                              <div className="text-xs text-muted-foreground">points</div>
                            </div>
                          </div>

                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">Your Answer: </span>
                              <span className={isCorrect ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                                {selectedOption ? `${selectedOption.option_label}. ${selectedOption.option_text}` : 'Not answered'}
                              </span>
                            </div>
                            {!isCorrect && correctOption && (
                              <div>
                                <span className="text-muted-foreground">Correct Answer: </span>
                                <span className="text-green-600 font-medium">
                                  {correctOption.option_label}. {correctOption.option_text}
                                </span>
                              </div>
                            )}
                            {question.explanation && (
                              <div className="mt-2 p-3 bg-muted rounded-md">
                                <span className="font-medium">Explanation: </span>
                                <span>{question.explanation}</span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
