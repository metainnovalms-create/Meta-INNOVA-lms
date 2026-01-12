import { format, isSameDay } from 'date-fns';
import { InstitutionEvent } from '@/types/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, Calendar, MapPin, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DayEventsPanelProps {
  selectedDate: Date | null;
  events: InstitutionEvent[];
  onEventClick: (event: InstitutionEvent) => void;
  onClose: () => void;
}

export function DayEventsPanel({ selectedDate, events, onEventClick, onClose }: DayEventsPanelProps) {
  if (!selectedDate) return null;

  const dayEvents = events.filter(event => {
    const eventDate = new Date(event.start_datetime);
    return isSameDay(eventDate, selectedDate);
  });

  const importantEvents = dayEvents.filter(e => e.event_type === 'important');
  const otherEvents = dayEvents.filter(e => e.event_type !== 'important');

  const colorMap: Record<string, string> = {
    academic: '#3b82f6',
    extra_curricular: '#10b981',
    administrative: '#f59e0b',
    important: '#ef4444',
  };

  const renderEventCard = (event: InstitutionEvent, isImportant: boolean = false) => {
    const eventColor = event.color || colorMap[event.event_type];
    const startTime = new Date(event.start_datetime);
    const endTime = new Date(event.end_datetime);

    return (
      <Card
        key={event.id}
        className={cn(
          'cursor-pointer hover:shadow-md transition-shadow',
          isImportant && 'event-card-important'
        )}
        onClick={() => onEventClick(event)}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div
              className="w-1 h-full rounded-full min-h-[60px]"
              style={{ backgroundColor: eventColor }}
            />
            <div className="flex-1 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-semibold text-base leading-tight">{event.title}</h4>
                {isImportant && (
                  <Badge variant="destructive" className="shrink-0">
                    Important
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <span>
                  {format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}
                </span>
              </div>
              {event.location && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{event.location}</span>
                </div>
              )}
              {event.institution_name && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5" />
                  <span>{event.institution_name}</span>
                </div>
              )}
              <Badge variant="outline" className="capitalize">
                {event.event_type.replace('_', ' ')}
              </Badge>
              {event.description && (
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                  {event.description}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Card className="day-events-panel">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-xl font-bold">
          {format(selectedDate, 'EEEE, MMMM d, yyyy')}
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {dayEvents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No events scheduled for this day</p>
          </div>
        ) : (
          <>
            {importantEvents.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-destructive uppercase tracking-wide flex items-center gap-2">
                  <span className="h-px flex-1 bg-destructive/20" />
                  Important Events
                  <span className="h-px flex-1 bg-destructive/20" />
                </h3>
                {importantEvents.map(event => renderEventCard(event, true))}
              </div>
            )}

            {otherEvents.length > 0 && (
              <div className="space-y-3">
                {importantEvents.length > 0 && (
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                    <span className="h-px flex-1 bg-border" />
                    Other Events
                    <span className="h-px flex-1 bg-border" />
                  </h3>
                )}
                {otherEvents.map(event => renderEventCard(event, false))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
