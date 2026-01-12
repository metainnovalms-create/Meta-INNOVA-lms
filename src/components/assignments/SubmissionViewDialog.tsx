import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Download, FileText, CheckCircle, Clock, MessageSquare } from 'lucide-react';
import { AssignmentSubmission, AssignmentWithClasses } from '@/services/assignment.service';
import { format } from 'date-fns';

interface SubmissionViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignment: AssignmentWithClasses;
  submission: AssignmentSubmission;
}

export function SubmissionViewDialog({
  open,
  onOpenChange,
  assignment,
  submission,
}: SubmissionViewDialogProps) {
  const isGraded = submission.status === 'graded';
  const percentage = isGraded && submission.marks_obtained !== null
    ? Math.round((submission.marks_obtained / assignment.total_marks) * 100)
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Submission Details</DialogTitle>
          <DialogDescription>
            Your submission for "{assignment.title}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status badge */}
          <div className="flex items-center gap-2">
            {isGraded ? (
              <Badge className="bg-green-500/10 text-green-700">
                <CheckCircle className="h-3 w-3 mr-1" />
                Graded
              </Badge>
            ) : (
              <Badge className="bg-blue-500/10 text-blue-700">
                <Clock className="h-3 w-3 mr-1" />
                Pending Review
              </Badge>
            )}
          </div>

          {/* Submission info */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Submitted At:</span>
              <span className="font-medium">
                {format(new Date(submission.submitted_at), 'MMM d, yyyy HH:mm')}
              </span>
            </div>
            
            {/* PDF download */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                  <FileText className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Submission PDF</p>
                  <p className="text-xs text-muted-foreground">Click to download</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                asChild
              >
                <a
                  href={submission.submission_pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </a>
              </Button>
            </div>
          </div>

          {/* Grading info */}
          {isGraded && (
            <>
              <Separator />
              
              <div className="space-y-4">
                <h4 className="font-medium">Grading Results</h4>
                
                {/* Score display */}
                <div className="bg-primary/5 p-4 rounded-lg text-center">
                  <div className="text-4xl font-bold text-primary">
                    {submission.marks_obtained}/{assignment.total_marks}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {percentage}% Score
                  </div>
                  {submission.graded_at && (
                    <div className="text-xs text-muted-foreground mt-2">
                      Graded on {format(new Date(submission.graded_at), 'MMM d, yyyy')}
                    </div>
                  )}
                </div>

                {/* Feedback */}
                {submission.feedback && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <MessageSquare className="h-4 w-4" />
                      Feedback
                    </div>
                    <div className="bg-muted/50 p-3 rounded-lg text-sm">
                      {submission.feedback}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Close button */}
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
