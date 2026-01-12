import { useState, useMemo, useCallback } from 'react';
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addYears, subYears } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { mockEvents } from '@/data/mockCalendarData';
import { InstitutionEvent } from '@/types/calendar';
import { CreateEditEventDialog } from './CreateEditEventDialog';
import { EventDialog } from './EventDialog';
import { YearView } from './YearView';
import { DayEventsPanel } from './DayEventsPanel';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '@/styles/calendar.css';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface InstitutionEventsCalendarProps {
  mode?: 'company' | 'institution';
  institutionId?: string;
}

export function InstitutionEventsCalendar({ 
  mode = 'company', 
  institutionId 
}: InstitutionEventsCalendarProps) {
  const [allEvents, setAllEvents] = useState<InstitutionEvent[]>(mockEvents);
  const [view, setView] = useState<View | 'year'>('month');
  const [date, setDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<InstitutionEvent | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [createSlotInfo, setCreateSlotInfo] = useState<{ start: Date; end: Date } | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Filter events based on mode
  const events = useMemo(() => {
    if (mode === 'company') {
      // Company mode: show all events
      return allEvents;
    } else if (mode === 'institution' && institutionId) {
      // Institution mode: show only events for selected institution
      return allEvents.filter(e => e.institution_id === institutionId);
    }
    return [];
  }, [allEvents, mode, institutionId]);

  // Convert events to calendar format
  const calendarEvents = useMemo(() => {
    return events.map(event => ({
      ...event,
      start: new Date(event.start_datetime),
      end: new Date(event.end_datetime),
    }));
  }, [events]);

  // Event style getter
  const eventStyleGetter = useCallback((event: any) => {
    const colors: Record<string, string> = {
      academic: '#3b82f6',
      extra_curricular: '#10b981',
      administrative: '#f59e0b',
      important: '#ef4444',
    };

    const backgroundColor = event.color || colors[event.event_type] || '#6366f1';

    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.9,
        border: 'none',
        color: 'white',
        fontSize: '13px',
        padding: '2px 5px',
      },
    };
  }, []);

  // Handle selecting a time slot (for creating new event)
  const handleSelectSlot = useCallback((slotInfo: { start: Date; end: Date }) => {
    setCreateSlotInfo(slotInfo);
    setSelectedEvent(null);
    setSelectedDate(slotInfo.start);
    setIsCreateDialogOpen(true);
  }, []);

  // Handle selecting an event (for viewing/editing)
  const handleSelectEvent = useCallback((event: any) => {
    setSelectedEvent(event);
    setSelectedDate(new Date(event.start_datetime));
    setIsDetailsDialogOpen(true);
  }, []);

  // Handle event drop (drag and drop)
  const handleEventDrop = useCallback(({ event, start, end }: any) => {
    setAllEvents(prev => prev.map(e => 
      e.id === event.id 
        ? { ...e, start_datetime: start.toISOString(), end_datetime: end.toISOString() }
        : e
    ));
  }, []);

  // Handle event resize
  const handleEventResize = useCallback(({ event, start, end }: any) => {
    setAllEvents(prev => prev.map(e => 
      e.id === event.id 
        ? { ...e, start_datetime: start.toISOString(), end_datetime: end.toISOString() }
        : e
    ));
  }, []);

  // Handle event save (create or update)
  const handleEventSave = useCallback((eventData: InstitutionEvent) => {
    if (selectedEvent) {
      // Update existing event
      setAllEvents(prev => prev.map(e => e.id === eventData.id ? eventData : e));
    } else {
      // Create new event
      setAllEvents(prev => [...prev, eventData]);
    }
    setIsCreateDialogOpen(false);
  }, [selectedEvent]);

  // Handle event delete
  const handleEventDelete = useCallback((eventId: string) => {
    setAllEvents(prev => prev.filter(e => e.id !== eventId));
    setIsCreateDialogOpen(false);
    setIsDetailsDialogOpen(false);
    setSelectedEvent(null);
  }, []);

  // Handle edit from details dialog
  const handleEditEvent = useCallback(() => {
    setIsDetailsDialogOpen(false);
    setIsCreateDialogOpen(true);
  }, []);

  // Navigation handlers
  const handleNavigate = useCallback((action: 'PREV' | 'NEXT' | 'TODAY') => {
    if (view === 'year') {
      if (action === 'PREV') setDate(subYears(date, 1));
      else if (action === 'NEXT') setDate(addYears(date, 1));
      else setDate(new Date());
    } else {
      // For other views, use Calendar's built-in navigation
      const newDate = new Date(date);
      if (action === 'PREV') {
        if (view === 'month') newDate.setMonth(newDate.getMonth() - 1);
        else if (view === 'week') newDate.setDate(newDate.getDate() - 7);
        else if (view === 'day') newDate.setDate(newDate.getDate() - 1);
      } else if (action === 'NEXT') {
        if (view === 'month') newDate.setMonth(newDate.getMonth() + 1);
        else if (view === 'week') newDate.setDate(newDate.getDate() + 7);
        else if (view === 'day') newDate.setDate(newDate.getDate() + 1);
      } else {
        setDate(new Date());
        return;
      }
      setDate(newDate);
    }
  }, [date, view]);

  // Custom toolbar
  const NavigationToolbar = useCallback(({ label, date }: { label: string; date: Date }) => {
    return (
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => handleNavigate('PREV')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleNavigate('TODAY')}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleNavigate('NEXT')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <h2 className="text-xl font-semibold">{label}</h2>
        <div className="w-[120px]" /> {/* Spacer for alignment */}
      </div>
    );
  }, [handleNavigate]);

  return (
    <div className="space-y-4">
      {/* View Switcher */}
      <div className="flex gap-2">
        <Button
          variant={view === 'year' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setView('year')}
        >
          Year
        </Button>
        <Button
          variant={view === 'month' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setView('month')}
        >
          Month
        </Button>
        <Button
          variant={view === 'week' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setView('week')}
        >
          Week
        </Button>
        <Button
          variant={view === 'day' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setView('day')}
        >
          Day
        </Button>
        <Button
          variant={view === 'agenda' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setView('agenda')}
        >
          Agenda
        </Button>
      </div>

      {/* Calendar or Year View */}
      <div className="bg-card rounded-lg border">
        {view === 'year' ? (
          <YearView
            date={date}
            events={calendarEvents}
            onSelectDate={(selectedDate) => {
              setSelectedDate(selectedDate);
              setView('day');
              setDate(selectedDate);
            }}
            onNavigate={(action) => handleNavigate(action)}
            selectedDate={selectedDate}
          />
        ) : (
          <>
            <NavigationToolbar 
              label={view === 'agenda' ? 'Agenda' : format(date, view === 'month' ? 'MMMM yyyy' : view === 'week' ? "'Week of' MMM d, yyyy" : 'MMMM d, yyyy')} 
              date={date} 
            />
            <Calendar
              localizer={localizer}
              events={calendarEvents}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 600 }}
              view={view as View}
              onView={setView}
              date={date}
              onNavigate={setDate}
              onSelectSlot={handleSelectSlot}
              onSelectEvent={handleSelectEvent}
              onEventDrop={handleEventDrop}
              onEventResize={handleEventResize}
              selectable
              resizable
              eventPropGetter={eventStyleGetter}
              components={{
                toolbar: () => null, // Hide default toolbar since we have custom one
              }}
            />
          </>
        )}
      </div>

      {/* Day Events Panel */}
      {selectedDate && (
        <DayEventsPanel
          selectedDate={selectedDate}
          events={events}
          onEventClick={handleSelectEvent}
          onClose={() => setSelectedDate(null)}
        />
      )}

      {/* Create/Edit Event Dialog */}
      <CreateEditEventDialog
        isOpen={isCreateDialogOpen}
        onClose={() => {
          setIsCreateDialogOpen(false);
          setSelectedEvent(null);
          setCreateSlotInfo(null);
        }}
        onSave={handleEventSave}
        onDelete={handleEventDelete}
        event={selectedEvent || undefined}
        initialStart={createSlotInfo?.start}
        initialEnd={createSlotInfo?.end}
        mode={mode}
        institutionId={institutionId}
      />

      {/* Event Details Dialog */}
      <EventDialog
        isOpen={isDetailsDialogOpen}
        onClose={() => {
          setIsDetailsDialogOpen(false);
          setSelectedEvent(null);
        }}
        event={selectedEvent || undefined}
        onEdit={handleEditEvent}
      />
    </div>
  );
}
