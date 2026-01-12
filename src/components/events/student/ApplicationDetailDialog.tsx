import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { mockEventApplications, mockActivityEvents } from '@/data/mockEventsData';
import { ApplicationStatusBadge } from '../ApplicationStatusBadge';
import { Separator } from '@/components/ui/separator';
import { Calendar, Users, FileText, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';

interface ApplicationDetailDialogProps {
  applicationId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ApplicationDetailDialog({ applicationId, open, onOpenChange }: ApplicationDetailDialogProps) {
  const application = mockEventApplications.find(a => a.id === applicationId);
  const event = application ? mockActivityEvents.find(e => e.id === application.event_id) : null;

  if (!application || !event) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="space-y-2">
            <DialogTitle className="text-2xl">Application Details</DialogTitle>
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

        <div className="space-y-6 py-4">
          {/* Event Info */}
          <div>
            <h3 className="font-semibold text-lg mb-2">Event</h3>
            <p className="text-xl font-medium text-primary">{event.title}</p>
            <p className="text-sm text-muted-foreground capitalize">{event.event_type.replace('_', ' ')}</p>
          </div>

          <Separator />

          {/* Idea Details */}
          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Your Idea
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Title</p>
                <p className="font-medium">{application.idea_title}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Description</p>
                <p className="text-sm whitespace-pre-wrap">{application.idea_description}</p>
              </div>
            </div>
          </div>

          {/* Team Members */}
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
                        <p className="font-medium">{member.name}</p>
                        {member.class && (
                          <p className="text-sm text-muted-foreground">{member.class}</p>
                        )}
                      </div>
                      {member.role && (
                        <span className="text-sm text-muted-foreground">{member.role}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Application Timeline */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Timeline
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                <div>
                  <p className="text-sm font-medium">Application Submitted</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(application.applied_at), 'PPP')}
                  </p>
                </div>
              </div>
              {application.reviewed_at && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                  <div>
                    <p className="text-sm font-medium">Application Reviewed</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(application.reviewed_at), 'PPP')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Officer Feedback */}
          {application.review_notes && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Feedback from Reviewer
                </h3>
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-sm">{application.review_notes}</p>
                </div>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            {application.status === 'pending' && (
              <Button variant="secondary">
                Edit Application
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
