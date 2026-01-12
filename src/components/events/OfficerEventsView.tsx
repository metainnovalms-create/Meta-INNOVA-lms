import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, MapPin, Calendar, FileText, ExternalLink, Users, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ActivityEventType, EVENT_TYPE_LABELS, Event } from '@/types/events';
import { useEvents, useEventInterests } from '@/hooks/useEvents';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

export function OfficerEventsView() {
  const { user } = useAuth();
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
                <OfficerEventCard
                  key={event.id}
                  event={event}
                  getEventTypeColor={getEventTypeColor}
                  onViewInterests={() => setSelectedEvent(event)}
                  institutionId={user?.institution_id}
                />
              ))}
            </div>
        )}
      </div>

      {/* Interests Dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Student Interests - {selectedEvent?.title}</DialogTitle>
          </DialogHeader>
          {selectedEvent && <EventInterestsContent event={selectedEvent} institutionId={user?.institution_id} />}
        </DialogContent>
      </Dialog>
    </>
  );
}

function OfficerEventCard({
  event,
  getEventTypeColor,
  onViewInterests,
  institutionId,
}: {
  event: Event;
  getEventTypeColor: (type: ActivityEventType) => string;
  onViewInterests: () => void;
  institutionId?: string;
}) {
  const { data: interests, isLoading } = useEventInterests(event.id, institutionId);
  const interestedCount = interests?.length ?? 0;

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <Badge variant="outline" className={getEventTypeColor(event.event_type)}>
          {EVENT_TYPE_LABELS[event.event_type]}
        </Badge>
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
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Loading...
              </span>
            ) : (
              <span>{interestedCount} interested</span>
            )}
          </div>
        </div>
      </CardContent>
      <div className="p-4 pt-0 flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onViewInterests}>
          View Interests
        </Button>
        {event.brochure_url && (
          <Button variant="ghost" size="icon" asChild>
            <a href={event.brochure_url} target="_blank" rel="noopener noreferrer">
              <FileText className="h-4 w-4" />
            </a>
          </Button>
        )}
      </div>
    </Card>
  );
}

function EventInterestsContent({ event, institutionId }: { event: Event; institutionId?: string }) {
  const { data: interests, isLoading } = useEventInterests(event.id, institutionId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!interests || interests.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No students have expressed interest yet
      </div>
    );
  }

  return (
    <ScrollArea className="max-h-[400px]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Class</TableHead>
            <TableHead>Registered At</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {interests.map((interest) => (
            <TableRow key={interest.id}>
              <TableCell className="font-medium">{interest.student_name || 'Unknown'}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {interest.email || 'N/A'}
              </TableCell>
              <TableCell>
                {interest.class_name || 'N/A'}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {format(new Date(interest.registered_at), 'PPP')}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}
