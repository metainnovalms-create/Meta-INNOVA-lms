import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { loadEvents, getEventInterestsByEventAndInstitution } from '@/data/mockEventsData';
import { EventStatusBadge } from '../EventStatusBadge';
import { RegistrationCountdown } from '../RegistrationCountdown';
import { EventDetailDialog } from '../EventDetailDialog';
import { InterestedStudentsDialog } from './InterestedStudentsDialog';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, MapPin, Users, FolderKanban } from 'lucide-react';
import { format } from 'date-fns';
import { ActivityEvent } from '@/types/events';

export function EventsOverviewTab() {
  const { user } = useAuth();
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [studentsDialogEventId, setStudentsDialogEventId] = useState<string | null>(null);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    const allEvents = loadEvents().filter(e => e.status === 'published' || e.status === 'ongoing');
    setEvents(allEvents);
  };

  // Get interested students count for officer's institution
  const getInterestedStudentsCount = (eventId: string) => {
    if (!user?.institution_id) return 0;
    return getEventInterestsByEventAndInstitution(eventId, user.institution_id).length;
  };

  // Get assigned projects count for this event
  const getAssignedProjectsCount = (eventId: string) => {
    const event = events.find(e => e.id === eventId);
    return event?.linked_project_ids?.length || 0;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => {
          const interestedCount = getInterestedStudentsCount(event.id);
          return (
            <Card key={event.id} className="flex flex-col">
              <CardHeader>
                <div className="flex flex-wrap items-start gap-2 mb-2">
                  <Badge variant="outline" className="capitalize truncate max-w-[140px]">
                    {event.event_type.replace('_', ' ')}
                  </Badge>
                  <EventStatusBadge status={event.status} />
                </div>
                <CardTitle className="line-clamp-2">{event.title}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {event.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{format(new Date(event.event_start), 'MMM dd, yyyy')}</span>
                </div>
                {event.venue && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span className="line-clamp-1">{event.venue}</span>
                  </div>
                )}
                <div className="pt-2">
                  <RegistrationCountdown endDate={event.registration_end} />
                </div>
                
                {/* Institution Stats */}
                <div className="pt-3 border-t">
                  <div className="flex items-center gap-2 text-sm font-medium mb-2">
                    <Users className="h-4 w-4" />
                    <span>Our Institution</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div>
                      <div className="text-lg font-bold text-primary">{interestedCount}</div>
                      <div className="text-xs text-muted-foreground">Interested</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-blue-600 flex items-center justify-center gap-1">
                        <FolderKanban className="h-4 w-4" />
                        {getAssignedProjectsCount(event.id)}
                      </div>
                      <div className="text-xs text-muted-foreground">Projects</div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col lg:flex-row gap-2 overflow-hidden">
                <Button
                  variant="outline"
                  className="w-full lg:flex-1 min-w-0"
                  onClick={() => setSelectedEventId(event.id)}
                >
                  View Details
                </Button>
                <Button
                  variant="secondary"
                  className="w-full lg:flex-1 min-w-0 overflow-hidden"
                  onClick={() => setStudentsDialogEventId(event.id)}
                >
                  <Users className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="truncate">Students ({interestedCount})</span>
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {events.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No events available at the moment</p>
          </CardContent>
        </Card>
      )}

      {/* Detail Dialog */}
      {selectedEventId && (
        <EventDetailDialog
          eventId={selectedEventId}
          open={!!selectedEventId}
          onOpenChange={(open) => !open && setSelectedEventId(null)}
          userRole="officer"
        />
      )}

      {/* Interested Students Dialog */}
      {studentsDialogEventId && user?.institution_id && (
        <InterestedStudentsDialog
          eventId={studentsDialogEventId}
          institutionId={user.institution_id}
          open={!!studentsDialogEventId}
          onOpenChange={(open) => !open && setStudentsDialogEventId(null)}
        />
      )}
    </div>
  );
}
