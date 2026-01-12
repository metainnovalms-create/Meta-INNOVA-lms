import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getEventById, hasStudentExpressedInterest, addEventInterest } from '@/data/mockEventsData';
import { getAllProjects } from '@/data/mockProjectData';
import { mockInstitutions } from '@/data/mockInstitutionData';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EventStatusBadge } from './EventStatusBadge';
import { RegistrationCountdown } from './RegistrationCountdown';
import { AssignProjectToEventDialog } from '@/components/events/officer/AssignProjectToEventDialog';
import { Calendar, MapPin, Users, Trophy, FileText, Clock, FolderKanban, Plus, Heart, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface EventDetailDialogProps {
  eventId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userRole: 'system_admin' | 'student' | 'officer' | 'management';
  onInterestChange?: () => void;
}

export function EventDetailDialog({ eventId, open, onOpenChange, userRole, onInterestChange }: EventDetailDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [event, setEvent] = useState(getEventById(eventId));
  const [showAssignProjectDialog, setShowAssignProjectDialog] = useState(false);
  const [hasInterest, setHasInterest] = useState(false);

  useEffect(() => {
    if (open) {
      setEvent(getEventById(eventId));
      if (user?.id && userRole === 'student') {
        setHasInterest(hasStudentExpressedInterest(user.id, eventId));
      }
    }
  }, [open, eventId, user?.id, userRole]);

  if (!event) return null;

  const canEdit = userRole === 'system_admin';
  
  // Get assigned projects for this event
  const assignedProjectIds = event.linked_project_ids || [];
  const allProjects = getAllProjects();
  const assignedProjects = allProjects.filter(p => assignedProjectIds.includes(p.id));

  // Get institution name from mock data
  const getInstitutionName = (instId: string) => {
    return mockInstitutions[instId]?.name || 'Unknown Institution';
  };

  const handleExpressInterest = () => {
    if (!user) return;

    const studentName = user.name || 'Unknown Student';
    const institutionId = user.institution_id || 'inst-msd-001';
    const institutionName = getInstitutionName(institutionId);
    // Default class/section for demo (in real app, would come from student data)
    const className = 'Grade 10';
    const section = 'A';

    const interest = {
      id: `int-${Date.now()}`,
      event_id: eventId,
      student_id: user.id,
      student_name: studentName,
      class_name: className,
      section: section,
      institution_id: institutionId,
      institution_name: institutionName,
      registered_at: new Date().toISOString()
    };

    addEventInterest(interest);
    setHasInterest(true);
    
    toast({
      title: 'Interest Registered',
      description: 'Your interest has been recorded. Your Innovation Officer will contact you.',
    });

    onInterestChange?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-2xl mb-2">{event.title}</DialogTitle>
              <div className="flex items-center gap-2">
                <EventStatusBadge status={event.status} />
                <span className="text-sm text-muted-foreground capitalize">
                  {event.event_type.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Banner */}
          {event.banner_image && (
            <div className="w-full h-48 bg-muted rounded-lg overflow-hidden">
              <img src={event.banner_image} alt={event.title} className="w-full h-full object-cover" />
            </div>
          )}

          {/* Description */}
          <div>
            <h3 className="font-semibold mb-2">About This Event</h3>
            <p className="text-muted-foreground">{event.description}</p>
          </div>

          <Separator />

          {/* Key Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Event Date</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(event.event_start), 'PPP')} - {format(new Date(event.event_end), 'PPP')}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Registration Deadline</p>
                  <div className="mt-1">
                    <RegistrationCountdown endDate={event.registration_end} />
                  </div>
                </div>
              </div>

              {event.venue && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Venue</p>
                    <p className="text-sm text-muted-foreground">{event.venue}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {/* Participants - Only visible to admins/officers */}
              {userRole !== 'student' && (
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Participants</p>
                    <p className="text-sm text-muted-foreground">
                      {event.current_participants}
                      {event.max_participants && ` / ${event.max_participants}`} registered
                    </p>
                  </div>
                </div>
              )}

              {event.prizes && event.prizes.length > 0 && (
                <div className="flex items-start gap-3">
                  <Trophy className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium mb-1">Prizes</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {event.prizes.map((prize, index) => (
                        <li key={index}>• {prize}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Eligibility */}
          {event.eligibility_criteria && (
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Eligibility Criteria
              </h3>
              <p className="text-sm text-muted-foreground">{event.eligibility_criteria}</p>
            </div>
          )}

          {/* Rules */}
          {event.rules && (
            <div>
              <h3 className="font-semibold mb-2">Rules & Guidelines</h3>
              <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-sans">
                {event.rules}
              </pre>
            </div>
          )}

          {/* Linked Projects Section - Officer View */}
          {userRole === 'officer' && (
            <>
              <Separator />
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <FolderKanban className="h-5 w-5" />
                    Assigned Projects
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAssignProjectDialog(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Assign Projects
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {assignedProjects.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6 border rounded-lg">
                      No projects assigned yet. Click "Assign Projects" to assign your projects to this event.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {assignedProjects.map(project => {
                        const teamLeader = project.team_members.find(m => m.role === 'leader');
                        return (
                          <div key={project.id} className="p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-semibold text-sm">{project.title}</h4>
                                <p className="text-xs text-muted-foreground">
                                  Led by {teamLeader?.name} • {project.team_members.length} member{project.team_members.length !== 1 ? 's' : ''}
                                </p>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {project.category}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Interest Section for Students */}
          {userRole === 'student' && (
            <div className={`rounded-lg p-4 ${hasInterest ? 'bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800' : 'bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800'}`}>
              {hasInterest ? (
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-green-900 dark:text-green-100">
                      Interest Registered!
                    </p>
                    <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                      Your Innovation Officer has been notified and will contact you with more details.
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-blue-900 dark:text-blue-100 mb-3">
                    <strong>Interested in participating?</strong> Click below to express your interest.
                  </p>
                  <Button onClick={handleExpressInterest}>
                    <Heart className="h-4 w-4 mr-2" />
                    Express Interest
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            {canEdit && (
              <Button variant="secondary">
                Edit Event
              </Button>
            )}
          </div>
        </div>
        
        {/* Assign Project Dialog */}
        {userRole === 'officer' && user && (
          <AssignProjectToEventDialog
            eventId={eventId}
            open={showAssignProjectDialog}
            onOpenChange={setShowAssignProjectDialog}
            officerId={user.id}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
