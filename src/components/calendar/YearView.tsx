import { format, startOfYear, endOfYear, eachMonthOfInterval, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isSameMonth, addYears, subYears } from 'date-fns';
import { InstitutionEvent } from '@/types/calendar';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface YearViewProps {
  date: Date;
  events: InstitutionEvent[];
  onSelectDate: (date: Date) => void;
  onNavigate: (action: 'PREV' | 'NEXT') => void;
  selectedDate: Date | null;
}

export function YearView({ date, events, onSelectDate, onNavigate, selectedDate }: YearViewProps) {
  const yearStart = startOfYear(date);
  const yearEnd = endOfYear(date);
  const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });

  const getEventsForDate = (checkDate: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.start_datetime);
      return isSameDay(eventDate, checkDate);
    });
  };

  const getEventDots = (dayEvents: InstitutionEvent[]) => {
    const colorMap: Record<string, string> = {
      academic: '#3b82f6',
      extra_curricular: '#10b981',
      administrative: '#f59e0b',
      important: '#ef4444',
    };

    const dots = dayEvents.slice(0, 3).map((event, idx) => (
      <div
        key={idx}
        className="event-dot"
        style={{ backgroundColor: event.color || colorMap[event.event_type] }}
      />
    ));

    if (dayEvents.length > 3) {
      dots.push(
        <span key="more" className="text-[8px] font-bold">
          +{dayEvents.length - 3}
        </span>
      );
    }

    return dots;
  };

  const renderMiniMonth = (monthDate: Date) => {
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Pad with empty cells for alignment
    const firstDayOfWeek = monthStart.getDay();
    const paddingDays = Array(firstDayOfWeek).fill(null);

    return (
      <div key={format(monthDate, 'MMM')} className="mini-month">
        <div className="mini-month-header">{format(monthDate, 'MMMM')}</div>
        <div className="mini-month-weekdays">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
            <div key={idx} className="mini-weekday">
              {day}
            </div>
          ))}
        </div>
        <div className="mini-month-grid">
          {paddingDays.map((_, idx) => (
            <div key={`pad-${idx}`} className="mini-day-empty" />
          ))}
          {days.map(day => {
            const dayEvents = getEventsForDate(day);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isCurrentDay = isToday(day);
            const isCurrentMonth = isSameMonth(day, monthDate);

            return (
              <div
                key={format(day, 'yyyy-MM-dd')}
                onClick={() => onSelectDate(day)}
                className={cn(
                  'mini-day',
                  isCurrentDay && 'today',
                  isSelected && 'selected',
                  !isCurrentMonth && 'other-month'
                )}
                title={dayEvents.length ? `${dayEvents.length} event(s)` : undefined}
              >
                <span className="mini-day-number">{format(day, 'd')}</span>
                {dayEvents.length > 0 && (
                  <div className="event-dots">{getEventDots(dayEvents)}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="year-view-container">
      <div className="year-view-toolbar">
        <Button variant="ghost" size="icon" onClick={() => onNavigate('PREV')}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-2xl font-bold">{format(date, 'yyyy')}</h2>
        <Button variant="ghost" size="icon" onClick={() => onNavigate('NEXT')}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="year-view-grid">{months.map(renderMiniMonth)}</div>
    </div>
  );
}
