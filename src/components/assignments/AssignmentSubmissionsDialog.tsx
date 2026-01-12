import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { assignmentService, AssignmentWithClasses, AssignmentSubmission } from '@/services/assignment.service';
import { supabase } from '@/integrations/supabase/client';
import { gamificationDbService } from '@/services/gamification-db.service';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Loader2, FileText, ExternalLink, User, CheckCircle, Clock, Award } from 'lucide-react';

interface StudentInfo {
  id: string;
  name: string;
  email: string;
}

interface SubmissionWithStudent extends AssignmentSubmission {
  student?: StudentInfo;
}

interface AssignmentSubmissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignment: AssignmentWithClasses | null;
}

export function AssignmentSubmissionsDialog({
  open,
  onOpenChange,
  assignment,
}: AssignmentSubmissionsDialogProps) {
  const [loading, setLoading] = useState(false);
  const [submissions, setSubmissions] = useState<SubmissionWithStudent[]>([]);
  const [gradingSubmission, setGradingSubmission] = useState<string | null>(null);
  const [gradeData, setGradeData] = useState<{ marks: number; feedback: string }>({ marks: 0, feedback: '' });
  const [savingGrade, setSavingGrade] = useState(false);

  useEffect(() => {
    if (open && assignment) {
      loadSubmissions();
    }
  }, [open, assignment]);

  const loadSubmissions = async () => {
    if (!assignment) return;
    
    setLoading(true);
    try {
      const data = await assignmentService.getSubmissions(assignment.id);
      
      // Fetch student details
      const studentIds = data.map(s => s.student_id);
      if (studentIds.length > 0) {
        const { data: students } = await supabase
          .from('profiles')
          .select('id, name, email')
          .in('id', studentIds);
        
        const submissionsWithStudents = data.map(submission => ({
          ...submission,
          student: students?.find(s => s.id === submission.student_id)
        }));
        
        setSubmissions(submissionsWithStudents);
      } else {
        setSubmissions([]);
      }
    } catch (error) {
      console.error('Error loading submissions:', error);
      toast.error('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleStartGrading = (submission: SubmissionWithStudent) => {
    setGradingSubmission(submission.id);
    setGradeData({
      marks: submission.marks_obtained || 0,
      feedback: submission.feedback || ''
    });
  };

  const handleSaveGrade = async () => {
    if (!gradingSubmission || !assignment) return;
    
    if (gradeData.marks < 0 || gradeData.marks > assignment.total_marks) {
      toast.error(`Marks must be between 0 and ${assignment.total_marks}`);
      return;
    }
    
    setSavingGrade(true);
    try {
      await assignmentService.gradeSubmission(gradingSubmission, gradeData.marks, gradeData.feedback);
      
      // Trigger badge check for the student after grading
      const submission = submissions.find(s => s.id === gradingSubmission);
      if (submission) {
        try {
          await gamificationDbService.checkAndAwardBadges(
            submission.student_id, 
            submission.institution_id
          );
        } catch (badgeError) {
          console.error('Error checking badges:', badgeError);
        }
      }
      
      toast.success('Grade saved successfully! XP awarded to student.');
      setGradingSubmission(null);
      loadSubmissions();
    } catch (error) {
      console.error('Error saving grade:', error);
      toast.error('Failed to save grade');
    } finally {
      setSavingGrade(false);
    }
  };

  const handleCancelGrading = () => {
    setGradingSubmission(null);
    setGradeData({ marks: 0, feedback: '' });
  };

  const openPDF = async (url: string) => {
    try {
      // Fetch the PDF as a blob to bypass ad blockers
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
      
      // Clean up the blob URL after a delay
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    } catch (error) {
      console.error('Error opening PDF:', error);
      toast.error('Failed to open PDF. Try disabling ad blocker.');
      // Fallback to direct URL
      window.open(url, '_blank');
    }
  };

  if (!assignment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Submissions: {assignment.title}
          </DialogTitle>
          <DialogDescription>
            View and grade student submissions. Total Marks: {assignment.total_marks}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No submissions yet</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 pr-4">
              {submissions.map((submission) => (
                <Card key={submission.id} className="relative">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">
                            {submission.student?.name || 'Unknown Student'}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {submission.student?.email || 'No email'}
                          </p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(submission.submitted_at), 'MMM d, yyyy HH:mm')}
                            </span>
                            {submission.status === 'graded' && (
                              <Badge className="bg-green-500/10 text-green-700">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Graded
                              </Badge>
                            )}
                            {submission.status === 'submitted' && (
                              <Badge variant="secondary">
                                <Clock className="h-3 w-3 mr-1" />
                                Pending
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openPDF(submission.submission_pdf_url)}
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          View PDF
                        </Button>
                        {gradingSubmission !== submission.id && (
                          <Button
                            size="sm"
                            onClick={() => handleStartGrading(submission)}
                          >
                            <Award className="h-4 w-4 mr-1" />
                            {submission.status === 'graded' ? 'Re-grade' : 'Grade'}
                          </Button>
                        )}
                      </div>
                    </div>

                    {submission.status === 'graded' && gradingSubmission !== submission.id && (
                      <div className="mt-4 p-3 bg-muted/50 rounded-md">
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Score</p>
                            <p className="text-2xl font-bold text-primary">
                              {submission.marks_obtained}/{assignment.total_marks}
                            </p>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-muted-foreground">Percentage</p>
                            <p className="text-lg font-semibold">
                              {Math.round((submission.marks_obtained || 0) / assignment.total_marks * 100)}%
                            </p>
                          </div>
                        </div>
                        {submission.feedback && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-sm text-muted-foreground">Feedback</p>
                            <p className="text-sm mt-1">{submission.feedback}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {gradingSubmission === submission.id && (
                      <div className="mt-4 p-4 border rounded-md space-y-4 bg-muted/30">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="marks">Marks (0 - {assignment.total_marks})</Label>
                            <Input
                              id="marks"
                              type="number"
                              min={0}
                              max={assignment.total_marks}
                              value={gradeData.marks}
                              onChange={(e) => setGradeData({ ...gradeData, marks: parseInt(e.target.value) || 0 })}
                            />
                          </div>
                          <div className="flex items-end">
                            <p className="text-2xl font-bold text-primary">
                              {Math.round(gradeData.marks / assignment.total_marks * 100)}%
                            </p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="feedback">Feedback (optional)</Label>
                          <Textarea
                            id="feedback"
                            rows={3}
                            placeholder="Provide feedback for the student..."
                            value={gradeData.feedback}
                            onChange={(e) => setGradeData({ ...gradeData, feedback: e.target.value })}
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCancelGrading}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleSaveGrade}
                            disabled={savingGrade}
                          >
                            {savingGrade && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Save Grade
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
