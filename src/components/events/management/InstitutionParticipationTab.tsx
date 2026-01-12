import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { loadEvents, loadEventInterests, getEventInterestsByInstitution } from '@/data/mockEventsData';
import { useAuth } from '@/contexts/AuthContext';
import { Download, TrendingUp, Users } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { ActivityEvent, EventInterest } from '@/types/events';

export function InstitutionParticipationTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [interests, setInterests] = useState<EventInterest[]>([]);
  const [events, setEvents] = useState<ActivityEvent[]>([]);

  useEffect(() => {
    if (user?.institution_id) {
      const institutionInterests = getEventInterestsByInstitution(user.institution_id);
      setInterests(institutionInterests);
      setEvents(loadEvents());
    }
  }, [user?.institution_id]);

  const getEventName = (eventId: string) => {
    return events.find(e => e.id === eventId)?.title || 'Unknown Event';
  };

  const getEventDate = (eventId: string) => {
    const event = events.find(e => e.id === eventId);
    return event ? format(new Date(event.event_start), 'MMM dd, yyyy') : 'N/A';
  };

  // Group interests by event
  const eventStats = events.map(event => {
    const eventInterests = interests.filter(i => i.event_id === event.id);
    return {
      event,
      total: eventInterests.length,
    };
  }).filter(stat => stat.total > 0);

  const overallStats = {
    totalInterested: interests.length,
    uniqueEvents: new Set(interests.map(i => i.event_id)).size,
    avgPerEvent: eventStats.length > 0 
      ? Math.round(interests.length / eventStats.length)
      : 0,
  };

  const handleExport = () => {
    toast({
      title: 'Export Started',
      description: `Exporting ${interests.length} interest records.`,
    });
    console.log('Exporting participation data...', interests);
  };

  return (
    <div className="space-y-6">
      {/* Overall Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Interested Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              {overallStats.totalInterested}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Across all events</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Events Participated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{overallStats.uniqueEvents}</div>
            <p className="text-xs text-muted-foreground mt-1">Active participation</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg. per Event</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              {overallStats.avgPerEvent}
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Students per event</p>
          </CardContent>
        </Card>
      </div>

      {/* Event-wise Participation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Event-wise Participation</CardTitle>
              <CardDescription>Interest statistics for each event</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {eventStats.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No participation data available yet.</p>
              <p className="text-sm mt-2">Students haven't expressed interest in any events from your institution.</p>
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event Name</TableHead>
                    <TableHead>Event Date</TableHead>
                    <TableHead className="text-center">Interested Students</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {eventStats.map((stat) => (
                    <TableRow key={stat.event.id}>
                      <TableCell className="font-medium">{stat.event.title}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(stat.event.event_start), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-semibold">
                          {stat.total}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Interests */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Interest Registrations</CardTitle>
          <CardDescription>Latest 5 students who expressed interest</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Registered On</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {interests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No interest registrations yet
                    </TableCell>
                  </TableRow>
                ) : (
                  interests.slice(0, 5).map((interest) => (
                    <TableRow key={interest.id}>
                      <TableCell className="font-medium">{interest.student_name}</TableCell>
                      <TableCell className="text-sm">{getEventName(interest.event_id)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{interest.class_name}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(interest.registered_at), 'MMM dd, yyyy')}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
