import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText, Calendar, Clock, Search, Upload, CheckCircle, Eye } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { assignmentService, AssignmentWithClasses, AssignmentSubmission } from '@/services/assignment.service';
import { format, isPast, isFuture } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { AssignmentSubmitDialog } from '@/components/assignments/AssignmentSubmitDialog';
import { SubmissionViewDialog } from '@/components/assignments/SubmissionViewDialog';

export default function StudentAssignments() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<AssignmentWithClasses[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, AssignmentSubmission>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentWithClasses | null>(null);

  useEffect(() => {
    if (user?.institution_id) {
      loadAssignments();
    }
  }, [user?.institution_id]);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      const data = await assignmentService.getAssignments(user?.institution_id);
      setAssignments(data);

      // Load submissions for each assignment
      const submissionMap: Record<string, AssignmentSubmission> = {};
      for (const assignment of data) {
        const submission = await assignmentService.getStudentSubmission(assignment.id, user!.id);
        if (submission) {
          submissionMap[assignment.id] = submission;
        }
      }
      setSubmissions(submissionMap);
    } catch (error) {
      console.error('Error loading assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAssignments = assignments.filter(a =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getAssignmentStatus = (assignment: AssignmentWithClasses) => {
    const submission = submissions[assignment.id];
    if (submission) {
      if (submission.status === 'graded') {
        return { label: 'Graded', variant: 'default' as const, color: 'bg-green-500/10 text-green-700' };
      }
      return { label: 'Submitted', variant: 'secondary' as const, color: 'bg-blue-500/10 text-blue-700' };
    }
    if (isPast(new Date(assignment.submission_end_date))) {
      return { label: 'Overdue', variant: 'destructive' as const, color: 'bg-red-500/10 text-red-700' };
    }
    if (isFuture(new Date(assignment.start_date))) {
      return { label: 'Upcoming', variant: 'outline' as const, color: '' };
    }
    return { label: 'Pending', variant: 'secondary' as const, color: 'bg-orange-500/10 text-orange-700' };
  };

  const handleSubmitClick = (assignment: AssignmentWithClasses) => {
    setSelectedAssignment(assignment);
    setSubmitDialogOpen(true);
  };

  const handleViewSubmission = (assignment: AssignmentWithClasses) => {
    setSelectedAssignment(assignment);
    setViewDialogOpen(true);
  };

  if (loading) {
    return (
      <Layout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-40" />)}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Assignments</h1>
          <p className="text-muted-foreground">View and submit your assignments</p>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search assignments..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="grid gap-4">
          {filteredAssignments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No assignments found</p>
              </CardContent>
            </Card>
          ) : (
            filteredAssignments.map((assignment) => {
              const status = getAssignmentStatus(assignment);
              const submission = submissions[assignment.id];

              return (
                <Card key={assignment.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {assignment.title}
                          <Badge className={status.color}>{status.label}</Badge>
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {assignment.description || 'No description provided'}
                        </CardDescription>
                      </div>
                      {submission?.status === 'graded' && (
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary">
                            {submission.marks_obtained}/{assignment.total_marks}
                          </p>
                          <p className="text-xs text-muted-foreground">Score</p>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-4 text-sm mb-4">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        Start: {format(new Date(assignment.start_date), 'MMM d, yyyy')}
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        Due: {format(new Date(assignment.submission_end_date), 'MMM d, yyyy HH:mm')}
                      </div>
                      <div className="text-muted-foreground">
                        Total Marks: {assignment.total_marks}
                      </div>
                    </div>

                    {submission ? (
                      <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-medium">Submitted</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(submission.submitted_at), 'MMM d, yyyy HH:mm')}
                          </p>
                        </div>
                        <div className="ml-auto flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewSubmission(assignment)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                          {assignment.allow_resubmit !== false && !isPast(new Date(assignment.submission_end_date)) && (
                            <Button 
                              variant="secondary" 
                              size="sm"
                              onClick={() => handleSubmitClick(assignment)}
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Resubmit
                            </Button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <Button 
                        disabled={isPast(new Date(assignment.submission_end_date))}
                        onClick={() => handleSubmitClick(assignment)}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Submit Assignment
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Submit Dialog */}
        {selectedAssignment && user && (
          <AssignmentSubmitDialog
            open={submitDialogOpen}
            onOpenChange={setSubmitDialogOpen}
            assignment={selectedAssignment}
            studentId={user.id}
            institutionId={user.institution_id || ''}
            classId={user.class_id || ''}
            onSubmitSuccess={loadAssignments}
          />
        )}

        {/* View Submission Dialog */}
        {selectedAssignment && submissions[selectedAssignment.id] && (
          <SubmissionViewDialog
            open={viewDialogOpen}
            onOpenChange={setViewDialogOpen}
            assignment={selectedAssignment}
            submission={submissions[selectedAssignment.id]}
          />
        )}
      </div>
    </Layout>
  );
}
