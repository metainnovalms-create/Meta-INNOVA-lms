import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, Calendar, FileText, ExternalLink, Heart, HeartOff, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ActivityEventType, EVENT_TYPE_LABELS, Event } from '@/types/events';
import { useEvents, useHasExpressedInterest, useExpressInterest, useRemoveInterest, useEventUpdates } from '@/hooks/useEvents';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

export function StudentEventsView() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<ActivityEventType | 'all'>('all');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const { data: events, isLoading } = useEvents('published');

  const filteredEvents = (events || []).filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (event.description?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = filterType === 'all' || event.event_type === filterType;
    return matchesSearch && matchesType;
  });

  const getEventTypeColor = (type: ActivityEventType) => {
    const colors: Record<ActivityEventType, string> = {
      webinar: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
      hackathon: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
      competition: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      science_fair: 'bg-green-500/10 text-green-600 border-green-500/20',
      science_expo: 'bg-green-500/10 text-green-600 border-green-500/20',
      exhibition: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
      workshop: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
      seminar: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
      cultural: 'bg-pink-500/10 text-pink-600 border-pink-500/20',
      sports: 'bg-red-500/10 text-red-600 border-red-500/20',
      other: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
    };
    return colors[type] || colors.other;
  };

  return (
    <>
      <div className="space-y-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterType} onValueChange={(value) => setFilterType(value as ActivityEventType | 'all')}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Event Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Events Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : filteredEvents.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No events available at the moment
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                getEventTypeColor={getEventTypeColor}
                onViewDetails={() => setSelectedEvent(event)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Event Details Dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedEvent?.title}</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <EventDetailsContent event={selectedEvent} getEventTypeColor={getEventTypeColor} />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

interface EventCardProps {
  event: Event;
  getEventTypeColor: (type: ActivityEventType) => string;
  onViewDetails: () => void;
}

function EventCard({ event, getEventTypeColor, onViewDetails }: EventCardProps) {
  const { data: hasInterest, isLoading: checkingInterest } = useHasExpressedInterest(event.id);
  const expressInterest = useExpressInterest();
  const removeInterest = useRemoveInterest();

  const isRegistrationOpen = () => {
    if (!event.registration_end) return false; // Registration end is required
    return new Date(event.registration_end) >= new Date();
  };

  const handleToggleInterest = async () => {
    if (!isRegistrationOpen()) return;
    
    if (hasInterest) {
      await removeInterest.mutateAsync(event.id);
    } else {
      await expressInterest.mutateAsync(event.id);
    }
  };

  const isToggling = expressInterest.isPending || removeInterest.isPending;
  const registrationClosed = !isRegistrationOpen();

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <Badge variant="outline" className={getEventTypeColor(event.event_type)}>
            {EVENT_TYPE_LABELS[event.event_type]}
          </Badge>
          {registrationClosed ? (
            <Badge variant="secondary" className="text-xs">Registration Closed</Badge>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleToggleInterest}
              disabled={isToggling || checkingInterest}
            >
              {hasInterest ? (
                <HeartOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Heart className="h-4 w-4 text-primary" />
              )}
            </Button>
          )}
        </div>
        <CardTitle className="text-lg">{event.title}</CardTitle>
        <CardDescription className="line-clamp-2">
          {event.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            {format(new Date(event.event_start), 'PPP')}
          </div>
          {event.venue && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {event.venue}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onViewDetails}>
          View Details
        </Button>
        {event.brochure_url && (
          <Button variant="ghost" size="icon" asChild>
            <a href={event.brochure_url} target="_blank" rel="noopener noreferrer">
              <FileText className="h-4 w-4" />
            </a>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

interface EventDetailsContentProps {
  event: Event;
  getEventTypeColor: (type: ActivityEventType) => string;
}

function EventDetailsContent({ event, getEventTypeColor }: EventDetailsContentProps) {
  const { data: updates } = useEventUpdates(event.id);
  const { data: hasInterest } = useHasExpressedInterest(event.id);
  const expressInterest = useExpressInterest();
  const removeInterest = useRemoveInterest();

  const isRegistrationOpen = () => {
    if (!event.registration_end) return false;
    return new Date(event.registration_end) >= new Date();
  };

  const handleToggleInterest = async () => {
    if (!isRegistrationOpen()) return;
    
    if (hasInterest) {
      await removeInterest.mutateAsync(event.id);
    } else {
      await expressInterest.mutateAsync(event.id);
    }
  };

  const registrationClosed = !isRegistrationOpen();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Badge variant="outline" className={getEventTypeColor(event.event_type)}>
          {EVENT_TYPE_LABELS[event.event_type]}
        </Badge>
        {registrationClosed ? (
          <Badge variant="secondary">Registration Closed</Badge>
        ) : (
          <Button
            variant={hasInterest ? 'outline' : 'default'}
            onClick={handleToggleInterest}
            disabled={expressInterest.isPending || removeInterest.isPending}
          >
            {hasInterest ? (
              <>
                <HeartOff className="h-4 w-4 mr-2" />
                Remove Interest
              </>
            ) : (
              <>
                <Heart className="h-4 w-4 mr-2" />
                Express Interest
              </>
            )}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Event Date</p>
          <p className="font-medium">{format(new Date(event.event_start), 'PPP')}</p>
        </div>
        {event.venue && (
          <div>
            <p className="text-sm text-muted-foreground">Venue</p>
            <p className="font-medium">{event.venue}</p>
          </div>
        )}
      </div>

      {event.description && (
        <div>
          <p className="text-sm text-muted-foreground mb-1">Description</p>
          <p className="text-sm">{event.description}</p>
        </div>
      )}

      {event.brochure_url && (
        <div>
          <p className="text-sm text-muted-foreground mb-2">Brochure</p>
          <a
            href={event.brochure_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-primary hover:underline"
          >
            <FileText className="h-4 w-4" />
            View Brochure
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}

      {/* Event Updates */}
      {updates && updates.length > 0 && (
        <div>
          <p className="text-sm text-muted-foreground mb-2">Updates</p>
          <ScrollArea className="max-h-[200px]">
            <div className="space-y-3">
              {updates.map((update) => (
                <div key={update.id} className="p-3 border rounded-lg">
                  <h4 className="font-medium text-sm">{update.title}</h4>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(update.created_at), 'PPP')}
                  </p>
                  {update.content && (
                    <p className="text-sm mt-1">{update.content}</p>
                  )}
                  {update.link_url && (
                    <a
                      href={update.link_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      View Link
                    </a>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
