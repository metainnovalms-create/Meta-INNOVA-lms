import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { loadEvents, hasStudentExpressedInterest, addEventInterest } from '@/data/mockEventsData';
import { mockInstitutions } from '@/data/mockInstitutionData';
import { EventStatusBadge } from '../EventStatusBadge';
import { RegistrationCountdown } from '../RegistrationCountdown';
import { EventDetailDialog } from '../EventDetailDialog';
import { useAuth } from '@/contexts/AuthContext';
import { Search, MapPin, Calendar, Trophy, Heart, HeartOff } from 'lucide-react';
import { format } from 'date-fns';
import { ActivityEventType, ActivityEvent, EVENT_TYPE_LABELS } from '@/types/events';
import { useToast } from '@/hooks/use-toast';

export function AvailableEventsTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<ActivityEventType | 'all'>('all');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [interestedEvents, setInterestedEvents] = useState<Set<string>>(new Set());

  // Load events and check student's interests
  useEffect(() => {
    const allEvents = loadEvents().filter(e => e.status === 'published' || e.status === 'ongoing');
    setEvents(allEvents);

    // Check which events student has expressed interest in
    if (user?.id) {
      const interested = new Set<string>();
      allEvents.forEach(event => {
        if (hasStudentExpressedInterest(user.id, event.id)) {
          interested.add(event.id);
        }
      });
      setInterestedEvents(interested);
    }
  }, [user?.id]);

  const refreshData = () => {
    const allEvents = loadEvents().filter(e => e.status === 'published' || e.status === 'ongoing');
    setEvents(allEvents);
    
    if (user?.id) {
      const interested = new Set<string>();
      allEvents.forEach(event => {
        if (hasStudentExpressedInterest(user.id, event.id)) {
          interested.add(event.id);
        }
      });
      setInterestedEvents(interested);
    }
  };

  // Get institution name from mock data
  const getInstitutionName = (instId: string) => {
    return mockInstitutions[instId]?.name || 'Unknown Institution';
  };

  const handleExpressInterest = (eventId: string) => {
    if (!user) return;

    // Get student info from user context
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
    
    // Update local state
    setInterestedEvents(prev => new Set([...prev, eventId]));
    
    toast({
      title: 'Interest Registered',
      description: 'Your interest has been recorded. Your Innovation Officer will contact you.',
    });

    refreshData();
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || event.event_type === filterType;
    return matchesSearch && matchesType;
  });

  const eventTypeLabels = EVENT_TYPE_LABELS;

  const getEventTypeColor = (type: ActivityEventType) => {
    const colors = {
      hackathon: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
      competition: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      science_fair: 'bg-green-500/10 text-green-600 border-green-500/20',
      exhibition: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
      workshop: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
      seminar: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
      cultural: 'bg-pink-500/10 text-pink-600 border-pink-500/20',
      sports: 'bg-red-500/10 text-red-600 border-red-500/20',
      other: 'bg-gray-500/10 text-gray-600 border-gray-500/20'
    };
    return colors[type] || colors.other;
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterType} onValueChange={(value) => setFilterType(value as ActivityEventType | 'all')}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(eventTypeLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Events Grid */}
      {filteredEvents.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No events found matching your criteria</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => {
            const isInterested = interestedEvents.has(event.id);
            return (
              <Card key={event.id} className="flex flex-col hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex flex-wrap items-start gap-2 mb-2">
                  <Badge variant="outline" className={`${getEventTypeColor(event.event_type)} truncate max-w-[140px]`}>
                    {event.event_type.replace('_', ' ').toUpperCase()}
                  </Badge>
                  {isInterested && (
                    <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20">
                      <Heart className="h-3 w-3 mr-1 fill-current" />
                      Interested
                    </Badge>
                  )}
                  <EventStatusBadge status={event.status} />
                </div>
                  <CardTitle className="line-clamp-2">{event.title}</CardTitle>
                  <CardDescription className="line-clamp-3">
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
                    variant={isInterested ? "secondary" : "default"}
                    className="w-full lg:flex-1 min-w-0 overflow-hidden"
                    onClick={() => !isInterested && handleExpressInterest(event.id)}
                    disabled={isInterested}
                  >
                    {isInterested ? (
                      <>
                        <Heart className="h-4 w-4 mr-2 flex-shrink-0 fill-current" />
                        <span className="truncate">Interested</span>
                      </>
                    ) : (
                      <>
                        <HeartOff className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="truncate">I'm Interested</span>
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Detail Dialog */}
      {selectedEventId && (
        <EventDetailDialog
          eventId={selectedEventId}
          open={!!selectedEventId}
          onOpenChange={(open) => !open && setSelectedEventId(null)}
          userRole="student"
          onInterestChange={refreshData}
        />
      )}
    </div>
  );
}
