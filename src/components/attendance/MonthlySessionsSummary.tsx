import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, parseISO } from 'date-fns';
import { Calendar, Users, BookOpen, CheckCircle2 } from 'lucide-react';

interface SessionRecord {
  id: string;
  date: string;
  class_name?: string;
  officer_name?: string;
  subject?: string;
  period_time?: string;
  students_present: number;
  students_absent: number;
  total_students: number;
  is_session_completed: boolean;
}

interface MonthlySessionsSummaryProps {
  sessions: SessionRecord[];
  currentMonth: Date;
}

export function MonthlySessionsSummary({ sessions, currentMonth }: MonthlySessionsSummaryProps) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Calculate stats by grade/class
  const statsByClass = useMemo(() => {
    const classMap = new Map<string, { count: number; totalStudents: number; present: number }>();
    
    sessions.forEach(session => {
      const className = session.class_name || 'Unknown';
      const existing = classMap.get(className) || { count: 0, totalStudents: 0, present: 0 };
      classMap.set(className, {
        count: existing.count + 1,
        totalStudents: existing.totalStudents + session.total_students,
        present: existing.present + session.students_present,
      });
    });
    
    return Array.from(classMap.entries())
      .map(([name, data]) => ({
        name,
        count: data.count,
        avgAttendance: data.totalStudents > 0 
          ? Math.round((data.present / data.totalStudents) * 100) 
          : 0
      }))
      .sort((a, b) => b.count - a.count);
  }, [sessions]);

  // Calculate stats by officer
  const statsByOfficer = useMemo(() => {
    const officerMap = new Map<string, { count: number; totalStudents: number; present: number }>();
    
    sessions.forEach(session => {
      const officerName = session.officer_name || 'Unknown';
      const existing = officerMap.get(officerName) || { count: 0, totalStudents: 0, present: 0 };
      officerMap.set(officerName, {
        count: existing.count + 1,
        totalStudents: existing.totalStudents + session.total_students,
        present: existing.present + session.students_present,
      });
    });
    
    return Array.from(officerMap.entries())
      .map(([name, data]) => ({
        name,
        count: data.count,
        avgAttendance: data.totalStudents > 0 
          ? Math.round((data.present / data.totalStudents) * 100) 
          : 0
      }))
      .sort((a, b) => b.count - a.count);
  }, [sessions]);

  // Group sessions by day for calendar view
  const sessionsByDay = useMemo(() => {
    const dayMap = new Map<string, SessionRecord[]>();
    
    sessions.forEach(session => {
      const dateKey = session.date;
      const existing = dayMap.get(dateKey) || [];
      dayMap.set(dateKey, [...existing, session]);
    });
    
    return dayMap;
  }, [sessions]);

  // Day of week distribution
  const dayOfWeekStats = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const counts = new Array(7).fill(0);
    
    sessions.forEach(session => {
      const dayOfWeek = getDay(parseISO(session.date));
      counts[dayOfWeek]++;
    });
    
    return days.map((name, i) => ({ name, count: counts[i] }));
  }, [sessions]);

  const totalSessions = sessions.length;
  const completedSessions = sessions.filter(s => s.is_session_completed).length;

  if (sessions.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No sessions recorded this month</p>
            <p className="text-sm">Sessions will appear here once officers mark attendance</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* By Class */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              Sessions by Class
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {statsByClass.slice(0, 5).map(item => (
              <div key={item.name} className="flex items-center justify-between">
                <span className="text-sm font-medium truncate flex-1">{item.name}</span>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {item.count} {item.count === 1 ? 'session' : 'sessions'}
                  </Badge>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${
                      item.avgAttendance >= 80 ? 'border-green-500 text-green-600' :
                      item.avgAttendance >= 60 ? 'border-yellow-500 text-yellow-600' :
                      'border-red-500 text-red-600'
                    }`}
                  >
                    {item.avgAttendance}% avg
                  </Badge>
                </div>
              </div>
            ))}
            {statsByClass.length === 0 && (
              <p className="text-sm text-muted-foreground">No class data available</p>
            )}
          </CardContent>
        </Card>

        {/* By Officer */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Sessions by Officer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {statsByOfficer.slice(0, 5).map(item => (
              <div key={item.name} className="flex items-center justify-between">
                <span className="text-sm font-medium truncate flex-1">{item.name}</span>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {item.count} {item.count === 1 ? 'session' : 'sessions'}
                  </Badge>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${
                      item.avgAttendance >= 80 ? 'border-green-500 text-green-600' :
                      item.avgAttendance >= 60 ? 'border-yellow-500 text-yellow-600' :
                      'border-red-500 text-red-600'
                    }`}
                  >
                    {item.avgAttendance}% avg
                  </Badge>
                </div>
              </div>
            ))}
            {statsByOfficer.length === 0 && (
              <p className="text-sm text-muted-foreground">No officer data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            {format(currentMonth, 'MMMM yyyy')} Calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-xs font-medium text-muted-foreground py-1">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for days before month starts */}
            {Array.from({ length: getDay(monthStart) }).map((_, i) => (
              <div key={`empty-start-${i}`} className="h-10" />
            ))}
            
            {/* Day cells */}
            {daysInMonth.map(day => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const daySessions = sessionsByDay.get(dateKey) || [];
              const sessionCount = daySessions.length;
              const isToday = isSameDay(day, new Date());
              
              return (
                <div
                  key={dateKey}
                  className={`h-10 rounded-md flex flex-col items-center justify-center relative ${
                    sessionCount > 0 
                      ? 'bg-primary/10 hover:bg-primary/20 cursor-pointer' 
                      : 'hover:bg-muted/50'
                  } ${isToday ? 'ring-2 ring-primary ring-offset-1' : ''}`}
                  title={sessionCount > 0 ? `${sessionCount} session(s)` : 'No sessions'}
                >
                  <span className={`text-xs ${sessionCount > 0 ? 'font-medium' : 'text-muted-foreground'}`}>
                    {format(day, 'd')}
                  </span>
                  {sessionCount > 0 && (
                    <span className="text-[10px] text-primary font-medium">
                      {sessionCount}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Day of Week Distribution */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Sessions by Day of Week</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between gap-2 h-20">
            {dayOfWeekStats.map(item => {
              const maxCount = Math.max(...dayOfWeekStats.map(d => d.count), 1);
              const height = (item.count / maxCount) * 100;
              
              return (
                <div key={item.name} className="flex flex-col items-center flex-1">
                  <div 
                    className="w-full bg-primary/80 rounded-t-sm transition-all"
                    style={{ height: `${Math.max(height, item.count > 0 ? 10 : 0)}%` }}
                  />
                  <span className="text-xs text-muted-foreground mt-1">{item.name}</span>
                  <span className="text-xs font-medium">{item.count}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
