import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { mockEventApplications, mockActivityEvents } from '@/data/mockEventsData';
import { ApplicationStatusBadge } from '../ApplicationStatusBadge';
import { ApplicationStatus } from '@/types/events';
import { useToast } from '@/hooks/use-toast';
import { FileText, Users, Calendar, CheckCircle, XCircle, Star, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface ReviewApplicationDialogProps {
  applicationId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReviewApplicationDialog({ applicationId, open, onOpenChange }: ReviewApplicationDialogProps) {
  const application = mockEventApplications.find(a => a.id === applicationId);
  const event = application ? mockActivityEvents.find(e => e.id === application.event_id) : null;
  const [reviewStatus, setReviewStatus] = useState<ApplicationStatus>(application?.status || 'pending');
  const [reviewNotes, setReviewNotes] = useState(application?.review_notes || '');
  const { toast } = useToast();

  if (!application || !event) return null;

  const handleSubmitReview = () => {
    if (!reviewNotes.trim() && reviewStatus !== 'pending') {
      toast({
        title: 'Review Notes Required',
        description: 'Please provide feedback for the student.',
        variant: 'destructive',
      });
      return;
    }

    // In real app, update backend/localStorage
    const updatedApplication = {
      ...application,
      status: reviewStatus,
      review_notes: reviewNotes,
      reviewed_by: 'officer-001',
      reviewed_at: new Date().toISOString(),
    };

    console.log('Updated Application:', updatedApplication);

    const statusMessages = {
      approved: '✅ Application Approved',
      rejected: '❌ Application Rejected',
      shortlisted: '⭐ Application Shortlisted',
      pending: 'Application Updated',
    };

    toast({
      title: statusMessages[reviewStatus],
      description: `Your review for ${application.student_name}'s application has been submitted.`,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="space-y-2">
            <DialogTitle className="text-2xl">Review Application</DialogTitle>
            <div className="flex items-center gap-2">
              <ApplicationStatusBadge status={application.status} />
              {application.is_team_application && (
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  Team Application
                </span>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6 py-4">
          {/* Left Column - Application Details */}
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-2">Student Information</h3>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{application.student_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Class</p>
                  <p className="font-medium">{application.class_id}</p>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-2">Event</h3>
              <p className="text-lg font-medium text-primary">{event.title}</p>
              <p className="text-sm text-muted-foreground capitalize">{event.event_type.replace('_', ' ')}</p>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Idea Details
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Title</p>
                  <p className="font-medium">{application.idea_title}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Description</p>
                  <div className="mt-1 p-3 rounded-lg bg-muted max-h-[200px] overflow-y-auto">
                    <p className="text-sm whitespace-pre-wrap">{application.idea_description}</p>
                  </div>
                </div>
              </div>
            </div>

            {application.is_team_application && application.team_members && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Team Members ({application.team_members.length})
                  </h3>
                  <div className="space-y-2">
                    {application.team_members.map((member, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                        <div>
                          <p className="font-medium text-sm">{member.name}</p>
                          {member.class && (
                            <p className="text-xs text-muted-foreground">{member.class}</p>
                          )}
                        </div>
                        {member.role && (
                          <span className="text-xs text-muted-foreground">{member.role}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <Separator />

            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Timeline
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-muted-foreground">
                    Submitted on {format(new Date(application.applied_at), 'PPP')}
                  </span>
                </div>
                {application.reviewed_at && (
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-muted-foreground">
                      Reviewed on {format(new Date(application.reviewed_at), 'PPP')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Review Form */}
          <div className="space-y-6">
            <div className="p-4 rounded-lg border-2 border-dashed">
              <h3 className="font-semibold mb-4">Review & Decision</h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="review-status">Decision *</Label>
                  <Select value={reviewStatus} onValueChange={(value) => setReviewStatus(value as ApplicationStatus)}>
                    <SelectTrigger id="review-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">
                        <span className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Pending Review
                        </span>
                      </SelectItem>
                      <SelectItem value="shortlisted">
                        <span className="flex items-center gap-2">
                          <Star className="h-4 w-4" />
                          Shortlist
                        </span>
                      </SelectItem>
                      <SelectItem value="approved">
                        <span className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          Approve
                        </span>
                      </SelectItem>
                      <SelectItem value="rejected">
                        <span className="flex items-center gap-2">
                          <XCircle className="h-4 w-4" />
                          Reject
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="review-notes">Feedback for Student *</Label>
                  <Textarea
                    id="review-notes"
                    placeholder="Provide constructive feedback on their idea, implementation plan, and suggestions for improvement..."
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    rows={8}
                  />
                  <p className="text-xs text-muted-foreground">
                    This feedback will be visible to the student
                  </p>
                </div>

                {/* Decision Guidance */}
                <div className="p-3 rounded-lg bg-muted space-y-2">
                  <p className="text-sm font-medium">Decision Guidelines:</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li><strong>Approve:</strong> Idea is innovative, feasible, and well-presented</li>
                    <li><strong>Shortlist:</strong> Strong potential but needs refinement</li>
                    <li><strong>Reject:</strong> Does not meet criteria or lacks depth</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Previous Review (if exists) */}
            {application.review_notes && application.reviewed_at && (
              <div className="p-4 rounded-lg bg-muted">
                <h4 className="font-semibold text-sm mb-2">Previous Review</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  By {application.reviewed_by} on {format(new Date(application.reviewed_at), 'PPP')}
                </p>
                <p className="text-sm">{application.review_notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmitReview}>
            Submit Review
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
