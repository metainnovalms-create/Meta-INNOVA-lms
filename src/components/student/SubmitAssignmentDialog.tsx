import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Assignment, AssignmentSubmission } from '@/types/course';
import { useState } from 'react';
import { toast } from 'sonner';
import { Calendar } from 'lucide-react';
import { createNotification } from '@/hooks/useNotifications';

interface SubmitAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignment: Assignment;
  studentId: string;
  studentName: string;
  courseId: string;
  officerId: string;
  onSubmit: (submission: AssignmentSubmission) => void;
}

export function SubmitAssignmentDialog({
  open,
  onOpenChange,
  assignment,
  studentId,
  studentName,
  courseId,
  officerId,
  onSubmit
}: SubmitAssignmentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [fileUrl, setFileUrl] = useState('');
  const [textSubmission, setTextSubmission] = useState('');
  const [urlSubmission, setUrlSubmission] = useState('');

  const isLate = new Date() > new Date(assignment.due_date);

  const handleSubmit = async () => {
    setLoading(true);

    let submittedContent = '';
    switch (assignment.submission_type) {
      case 'file':
        if (!fileUrl) {
          toast.error('Please provide a file URL');
          setLoading(false);
          return;
        }
        submittedContent = fileUrl;
        break;
      case 'text':
        if (!textSubmission.trim()) {
          toast.error('Please enter your submission');
          setLoading(false);
          return;
        }
        submittedContent = textSubmission;
        break;
      case 'url':
        if (!urlSubmission.trim()) {
          toast.error('Please enter a URL');
          setLoading(false);
          return;
        }
        submittedContent = urlSubmission;
        break;
    }

    const submission: AssignmentSubmission = {
      id: `sub-${Date.now()}`,
      assignment_id: assignment.id,
      assignment_title: assignment.title,
      student_id: studentId,
      student_name: studentName,
      submitted_at: new Date().toISOString(),
      status: 'pending',
      submission_type: assignment.submission_type,
      file_url: assignment.submission_type === 'file' ? submittedContent : undefined,
      text_content: assignment.submission_type === 'text' ? submittedContent : undefined,
      url_content: assignment.submission_type === 'url' ? submittedContent : undefined,
      total_points: assignment.total_points,
      is_late: isLate,
      late_penalty_applied: isLate ? assignment.late_penalty_percent : 0
    };

    // Store in localStorage
    const key = `submissions_${courseId}`;
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    existing.push(submission);
    localStorage.setItem(key, JSON.stringify(existing));

    // Create notification for officer
    createNotification(
      officerId,
      'officer',
      'assignment_submission',
      'New Assignment Submission',
      `${studentName} submitted "${assignment.title}"${isLate ? ' (Late)' : ''}`,
      `/tenant/springfield/officer/grading`,
      {
        assignment_id: assignment.id,
        student_id: studentId,
        submission_id: submission.id,
        course_id: courseId
      }
    );

    onSubmit(submission);
    toast.success('Assignment submitted successfully!');
    setLoading(false);
    onOpenChange(false);
    
    // Reset form
    setFileUrl('');
    setTextSubmission('');
    setUrlSubmission('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Submit Assignment</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <h3 className="font-semibold">{assignment.title}</h3>
            <p className="text-sm text-muted-foreground">{assignment.description}</p>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Due: {new Date(assignment.due_date).toLocaleDateString()}</span>
              </div>
              <span>Points: {assignment.total_points}</span>
            </div>
            {isLate && (
              <p className="text-destructive text-sm font-medium">
                ⚠️ This submission will be marked as late
                {assignment.late_penalty_percent > 0 && ` (${assignment.late_penalty_percent}% penalty)`}
              </p>
            )}
          </div>

          {assignment.submission_type === 'file' && (
            <div className="space-y-2">
              <Label>File URL *</Label>
              <Input
                placeholder="Enter file URL (or upload file)"
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Accepted: PDF, DOCX, ZIP (max 10MB)
              </p>
            </div>
          )}

          {assignment.submission_type === 'text' && (
            <div className="space-y-2">
              <Label>Your Answer *</Label>
              <Textarea
                placeholder="Enter your answer here..."
                value={textSubmission}
                onChange={(e) => setTextSubmission(e.target.value)}
                rows={10}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                {textSubmission.length} characters
              </p>
            </div>
          )}

          {assignment.submission_type === 'url' && (
            <div className="space-y-2">
              <Label>URL *</Label>
              <Input
                type="url"
                placeholder="https://..."
                value={urlSubmission}
                onChange={(e) => setUrlSubmission(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Enter the URL to your project, document, or repository
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Assignment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
