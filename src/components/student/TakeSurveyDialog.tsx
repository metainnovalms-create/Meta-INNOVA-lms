import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { SurveyQuestion } from "./SurveyQuestion";
import { useState } from "react";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Check, Loader2 } from "lucide-react";

interface Question {
  id: string;
  question_text: string;
  question_type: 'mcq' | 'multiple_select' | 'rating' | 'text' | 'long_text' | 'linear_scale';
  options?: string[];
  required?: boolean;
  is_required?: boolean;
}

interface Survey {
  id: string;
  title: string;
  description?: string;
  questions: Question[];
}

interface TakeSurveyDialogProps {
  survey: Survey | null;
  open: boolean;
  onClose: () => void;
  onSubmit: (answers: Array<{ question_id: string; answer_text?: string; answer_number?: number; answer_options?: string[] }>) => void;
}

export function TakeSurveyDialog({ survey, open, onClose, onSubmit }: TakeSurveyDialogProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, string | string[] | number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!survey || !survey.questions || survey.questions.length === 0) return null;

  const currentQuestion = survey.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / survey.questions.length) * 100;
  const isLastQuestion = currentQuestionIndex === survey.questions.length - 1;
  const currentAnswer = responses[currentQuestion.id];
  const isRequired = currentQuestion.required ?? currentQuestion.is_required ?? false;
  const canProceed = !isRequired || (
    currentAnswer !== undefined && 
    currentAnswer !== '' && 
    (Array.isArray(currentAnswer) ? currentAnswer.length > 0 : true)
  );

  const handleNext = () => {
    if (isLastQuestion) {
      handleSubmit();
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleAnswerChange = (questionId: string, value: string | string[] | number) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleSubmit = () => {
    // Check if all required questions are answered
    const unansweredRequired = survey.questions.filter(q => {
      const answer = responses[q.id];
      const qRequired = q.required ?? q.is_required ?? false;
      return qRequired && (
        answer === undefined || 
        answer === '' ||
        (Array.isArray(answer) && answer.length === 0)
      );
    });

    if (unansweredRequired.length > 0) {
      toast.error("Please answer all required questions");
      return;
    }

    setIsSubmitting(true);

    // Format answers for submission
    const formattedAnswers = Object.entries(responses).map(([question_id, answer]) => {
      const question = survey.questions.find(q => q.id === question_id);
      
      if (question?.question_type === 'rating' || question?.question_type === 'linear_scale') {
        return {
          question_id,
          answer_number: typeof answer === 'number' ? answer : parseInt(answer as string),
        };
      } else if (question?.question_type === 'mcq' || question?.question_type === 'multiple_select') {
        return {
          question_id,
          answer_options: Array.isArray(answer) ? answer : [answer as string],
        };
      } else {
        return {
          question_id,
          answer_text: answer as string,
        };
      }
    });

    onSubmit(formattedAnswers);
    setSubmitted(true);
    setIsSubmitting(false);
    
    setTimeout(() => {
      handleClose();
    }, 2000);
  };

  const handleClose = () => {
    setCurrentQuestionIndex(0);
    setResponses({});
    setSubmitted(false);
    setIsSubmitting(false);
    onClose();
  };

  if (submitted) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mb-4">
              <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Thank You!</h3>
            <p className="text-muted-foreground">
              Your responses have been submitted successfully.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{survey.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-auto">
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Question {currentQuestionIndex + 1} of {survey.questions.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} />
          </div>

          <div className="py-6">
            <SurveyQuestion
              question={{
                ...currentQuestion,
                required: currentQuestion.required ?? currentQuestion.is_required ?? false
              }}
              questionNumber={currentQuestionIndex + 1}
              value={currentAnswer}
              onChange={(value) => handleAnswerChange(currentQuestion.id, value)}
            />
          </div>
        </div>

        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentQuestionIndex === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <Button
            onClick={handleNext}
            disabled={!canProceed || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : isLastQuestion ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Submit
              </>
            ) : (
              <>
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
