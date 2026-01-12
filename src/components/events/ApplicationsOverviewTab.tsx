import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { loadEvents, loadEventInterests } from '@/data/mockEventsData';
import { mockInstitutions } from '@/data/mockInstitutionData';
import { EventInterest, ActivityEvent } from '@/types/events';
import { Download, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface InstitutionSummary {
  institutionId: string;
  institutionName: string;
  total: number;
}

export function ApplicationsOverviewTab() {
  const [interests, setInterests] = useState<EventInterest[]>([]);
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [filterEvent, setFilterEvent] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setInterests(loadEventInterests());
    setEvents(loadEvents());
  };

  // Group interests by institution and calculate statistics
  const institutionSummaries = useMemo(() => {
    // First filter by event if needed
    const eventFilteredInterests = filterEvent === 'all' 
      ? interests 
      : interests.filter(i => i.event_id === filterEvent);

    // Group by institution
    const groupedByInstitution = eventFilteredInterests.reduce((acc, interest) => {
      if (!acc[interest.institution_id]) {
        acc[interest.institution_id] = {
          institutionId: interest.institution_id,
          institutionName: mockInstitutions[interest.institution_id]?.name || interest.institution_name,
          total: 0,
        };
      }
      acc[interest.institution_id].total++;
      return acc;
    }, {} as Record<string, InstitutionSummary>);

    return Object.values(groupedByInstitution).sort((a, b) => b.total - a.total);
  }, [interests, filterEvent]);

  // Calculate statistics
  const stats = {
    total: interests.length,
    byInstitution: institutionSummaries.length,
  };

  const handleExport = () => {
    toast({
      title: 'Export Started',
      description: `Exporting ${interests.length} interest records.`,
    });
    console.log('Exporting interest data...', interests);
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Interested</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              {stats.total}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Institutions Participating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.byInstitution}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{events.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Interests by Institution */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Interested Students by Institution</CardTitle>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={filterEvent} onValueChange={setFilterEvent}>
              <SelectTrigger className="w-full sm:w-[250px]">
                <SelectValue placeholder="Filter by event" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                {events.map(event => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Institution Name</TableHead>
                  <TableHead className="text-center">Total Interested Students</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {institutionSummaries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground py-8">
                      No students have expressed interest yet
                    </TableCell>
                  </TableRow>
                ) : (
                  institutionSummaries.map((summary) => (
                    <TableRow key={summary.institutionId}>
                      <TableCell className="font-medium">{summary.institutionName}</TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-semibold">
                          {summary.total}
                        </span>
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
