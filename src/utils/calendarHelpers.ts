import { format, startOfMonth, endOfMonth, eachDayOfInterval, isWithinInterval } from 'date-fns';
import { InstitutionEvent, Holiday, Audit, AuditStatus } from '@/types/calendar';

export function generateCalendarGrid(month: Date, events: InstitutionEvent[] = []): Date[] {
  const start = startOfMonth(month);
  const end = endOfMonth(month);
  return eachDayOfInterval({ start, end });
}

export function filterEventsByInstitution(
  events: InstitutionEvent[],
  institutionId: string | null
): InstitutionEvent[] {
  if (!institutionId || institutionId === 'all') {
    return events;
  }
  return events.filter(
    (event) => !event.institution_id || event.institution_id === institutionId
  );
}

export function getUpcomingEvents(events: InstitutionEvent[], days: number = 7): InstitutionEvent[] {
  const now = new Date();
  const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  
  return events
    .filter((event) => {
      const eventDate = new Date(event.start_datetime);
      return eventDate >= now && eventDate <= futureDate;
    })
    .sort((a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime());
}

export function calculateAcademicYearProgress(
  startDate: string,
  endDate: string
): number {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (now < start) return 0;
  if (now > end) return 100;
  
  const totalDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  const elapsedDays = (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  
  return Math.round((elapsedDays / totalDays) * 100);
}

export function exportEventsToICS(events: InstitutionEvent[]): void {
  let icsContent = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Meta-INNOVA//Calendar//EN\n';
  
  events.forEach((event) => {
    const startDate = new Date(event.start_datetime);
    const endDate = new Date(event.end_datetime);
    
    icsContent += 'BEGIN:VEVENT\n';
    icsContent += `DTSTART:${format(startDate, "yyyyMMdd'T'HHmmss")}\n`;
    icsContent += `DTEND:${format(endDate, "yyyyMMdd'T'HHmmss")}\n`;
    icsContent += `SUMMARY:${event.title}\n`;
    icsContent += `DESCRIPTION:${event.description || ''}\n`;
    icsContent += `LOCATION:${event.location || ''}\n`;
    icsContent += 'END:VEVENT\n';
  });
  
  icsContent += 'END:VCALENDAR';
  
  const blob = new Blob([icsContent], { type: 'text/calendar' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'events.ics';
  a.click();
  window.URL.revokeObjectURL(url);
}

export function exportHolidaysToCSV(holidays: Holiday[]): void {
  const headers = ['Name', 'Date', 'End Date', 'Type', 'Description'];
  const rows = holidays.map((holiday) => [
    holiday.name,
    holiday.date,
    holiday.end_date || '',
    holiday.type,
    holiday.description || '',
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'holidays.csv';
  a.click();
  window.URL.revokeObjectURL(url);
}

export function exportAuditsToCSV(audits: Audit[]): void {
  const headers = ['Title', 'Type', 'Institution', 'Date', 'Time', 'Duration (hrs)', 'Auditors', 'Status'];
  const rows = audits.map((audit) => [
    audit.title,
    audit.type,
    audit.institution_name,
    audit.audit_date,
    audit.start_time,
    audit.duration_hours.toString(),
    audit.auditors.join('; '),
    audit.status,
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'audits.csv';
  a.click();
  window.URL.revokeObjectURL(url);
}

export function getAuditStatusColor(status: AuditStatus): { bg: string; text: string; border: string } {
  const colors = {
    scheduled: { bg: 'bg-gray-500/20', text: 'text-gray-700 dark:text-gray-300', border: 'border-gray-500' },
    confirmed: { bg: 'bg-blue-500/20', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-500' },
    in_progress: { bg: 'bg-yellow-500/20', text: 'text-yellow-700 dark:text-yellow-300', border: 'border-yellow-500' },
    completed: { bg: 'bg-green-500/20', text: 'text-green-700 dark:text-green-300', border: 'border-green-500' },
    cancelled: { bg: 'bg-red-500/20', text: 'text-red-700 dark:text-red-300', border: 'border-red-500' },
  };
  return colors[status];
}

export function getEventTypeColor(type: string): { bg: string; text: string; border: string } {
  const colors = {
    academic: { bg: 'bg-blue-500/20', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-500' },
    extra_curricular: { bg: 'bg-green-500/20', text: 'text-green-700 dark:text-green-300', border: 'border-green-500' },
    administrative: { bg: 'bg-yellow-500/20', text: 'text-yellow-700 dark:text-yellow-300', border: 'border-yellow-500' },
    important: { bg: 'bg-red-500/20', text: 'text-red-700 dark:text-red-300', border: 'border-red-500' },
  };
  return colors[type as keyof typeof colors] || colors.academic;
}

export function validateAcademicYearDates(startDate: string, endDate: string): boolean {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return start < end;
}

// Get all events for a specific date
export function getEventsForDate(
  events: InstitutionEvent[], 
  date: Date
): InstitutionEvent[] {
  return events.filter(event => {
    const eventDate = new Date(event.start_datetime);
    return format(eventDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
  });
}

// Separate important events from others
export function categorizeEventsByImportance(
  events: InstitutionEvent[]
): { important: InstitutionEvent[], others: InstitutionEvent[] } {
  return {
    important: events.filter(e => e.event_type === 'important'),
    others: events.filter(e => e.event_type !== 'important'),
  };
}

// Get event count by date for year view
export function getEventCountByDate(
  events: InstitutionEvent[]
): Map<string, number> {
  const countMap = new Map<string, number>();
  
  events.forEach(event => {
    const dateKey = format(new Date(event.start_datetime), 'yyyy-MM-dd');
    countMap.set(dateKey, (countMap.get(dateKey) || 0) + 1);
  });
  
  return countMap;
}
