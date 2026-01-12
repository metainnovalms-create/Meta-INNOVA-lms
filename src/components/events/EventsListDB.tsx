import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Eye, Trash2, Send, FileText, ExternalLink, Loader2, Users } from 'lucide-react';
import { format } from 'date-fns';
import { Event, ActivityEventType, EventStatus, EVENT_TYPE_LABELS, EVENT_STATUS_LABELS } from '@/types/events';
import { useEvents, useDeleteEvent } from '@/hooks/useEvents';
import { PublishEventDialog } from './PublishEventDialog';
import { EventUpdatesPanel } from './EventUpdatesPanel';
import { CEOInterestedStudentsDialog } from './CEOInterestedStudentsDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function EventsListDB() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<ActivityEventType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<EventStatus | 'all'>('all');
  const [deleteEventId, setDeleteEventId] = useState<string | null>(null);
  const [publishEvent, setPublishEvent] = useState<Event | null>(null);
  const [viewEvent, setViewEvent] = useState<Event | null>(null);
  const [viewInterestsEventId, setViewInterestsEventId] = useState<string | null>(null);

  const { data: events, isLoading } = useEvents();
  const deleteEventMutation = useDeleteEvent();

  const filteredEvents = (events || []).filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (event.description?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = filterType === 'all' || event.event_type === filterType;
    const matchesStatus = filterStatus === 'all' || event.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleDelete = async () => {
    if (!deleteEventId) return;
    await deleteEventMutation.mutateAsync(deleteEventId);
    setDeleteEventId(null);
  };

  const getStatusBadgeVariant = (status: EventStatus) => {
    switch (status) {
      case 'published': return 'default';
      case 'ongoing': return 'secondary';
      case 'completed': return 'outline';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const getTypeBadgeColor = (type: ActivityEventType) => {
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
      <Card>
        <CardHeader>
          <CardTitle>All Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
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
              <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as EventStatus | 'all')}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {Object.entries(EVENT_STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Event Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Attachments</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEvents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No events found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredEvents.map((event) => (
                        <TableRow key={event.id}>
                          <TableCell className="font-medium">{event.title}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getTypeBadgeColor(event.event_type)}>
                              {EVENT_TYPE_LABELS[event.event_type]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {format(new Date(event.event_start), 'PPP')}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(event.status)}>
                              {EVENT_STATUS_LABELS[event.status]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {event.brochure_url && (
                              <a
                                href={event.brochure_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-primary hover:underline"
                              >
                                <FileText className="h-4 w-4" />
                                Brochure
                              </a>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setViewEvent(event)}
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {event.status === 'published' && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setViewInterestsEventId(event.id)}
                                  title="View Interested Students"
                                >
                                  <Users className="h-4 w-4" />
                                </Button>
                              )}
                              {event.status === 'draft' && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setPublishEvent(event)}
                                  title="Publish Event"
                                >
                                  <Send className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteEventId(event.id)}
                                title="Delete Event"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Publish Dialog */}
      <PublishEventDialog
        open={!!publishEvent}
        onOpenChange={(open) => !open && setPublishEvent(null)}
        event={publishEvent}
      />

      {/* View Event Dialog */}
      <Dialog open={!!viewEvent} onOpenChange={(open) => !open && setViewEvent(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewEvent?.title}</DialogTitle>
          </DialogHeader>
          {viewEvent && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Event Type</p>
                  <Badge variant="outline" className={getTypeBadgeColor(viewEvent.event_type)}>
                    {EVENT_TYPE_LABELS[viewEvent.event_type]}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={getStatusBadgeVariant(viewEvent.status)}>
                    {EVENT_STATUS_LABELS[viewEvent.status]}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Event Date</p>
                  <p>{format(new Date(viewEvent.event_start), 'PPP')}</p>
                </div>
                {viewEvent.venue && (
                  <div>
                    <p className="text-sm text-muted-foreground">Venue</p>
                    <p>{viewEvent.venue}</p>
                  </div>
                )}
              </div>

              {viewEvent.description && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Description</p>
                  <p className="text-sm">{viewEvent.description}</p>
                </div>
              )}

              {viewEvent.brochure_url && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Brochure</p>
                  <a
                    href={viewEvent.brochure_url}
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
              <EventUpdatesPanel event={viewEvent} canEdit={true} />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteEventId} onOpenChange={(open) => !open && setDeleteEventId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this event? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* CEO Interested Students Dialog */}
      <CEOInterestedStudentsDialog
        eventId={viewInterestsEventId || ''}
        open={!!viewInterestsEventId}
        onOpenChange={(open) => !open && setViewInterestsEventId(null)}
      />
    </>
  );
}
