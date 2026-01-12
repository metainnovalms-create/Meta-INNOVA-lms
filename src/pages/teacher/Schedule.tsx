import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Grid3x3, Download } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { TeacherTimetableCalendar } from '@/components/teacher/TeacherTimetableCalendar';
import { TeacherTimetableCards } from '@/components/teacher/TeacherTimetableCards';
import { useIsMobile } from '@/hooks/use-mobile';

const mockSchedule = [
  {
    id: '1',
    day: 'Monday',
    course_code: 'CS301',
    course_name: 'AI & Machine Learning',
    start_time: '09:00',
    end_time: '10:30',
    room: 'Lab A',
    type: 'lecture' as const,
  },
  {
    id: '2',
    day: 'Monday',
    course_code: 'CS401',
    course_name: 'Advanced Algorithms',
    start_time: '14:00',
    end_time: '15:00',
    room: 'Lab B',
    type: 'lab' as const,
  },
  {
    id: '3',
    day: 'Tuesday',
    course_code: 'CS302',
    course_name: 'Data Structures',
    start_time: '09:00',
    end_time: '10:30',
    room: 'Room 201',
    type: 'lecture' as const,
  },
  {
    id: '4',
    day: 'Wednesday',
    course_code: 'CS301',
    course_name: 'AI & Machine Learning',
    start_time: '10:00',
    end_time: '11:30',
    room: 'Lab A',
    type: 'tutorial' as const,
  },
  {
    id: '5',
    day: 'Wednesday',
    course_code: 'CS401',
    course_name: 'Advanced Algorithms',
    start_time: '14:00',
    end_time: '15:00',
    room: 'Lab B',
    type: 'lecture' as const,
  },
  {
    id: '6',
    day: 'Thursday',
    course_code: 'CS302',
    course_name: 'Data Structures',
    start_time: '09:00',
    end_time: '10:30',
    room: 'Room 201',
    type: 'lab' as const,
  },
  {
    id: '7',
    day: 'Friday',
    course_code: 'CS401',
    course_name: 'Advanced Algorithms',
    start_time: '14:00',
    end_time: '15:00',
    room: 'Lab B',
    type: 'lecture' as const,
  },
];

export default function TeacherSchedule() {
  const [schedule] = useState(mockSchedule);
  const isMobile = useIsMobile();
  const [viewMode, setViewMode] = useState<'calendar' | 'cards'>(isMobile ? 'cards' : 'calendar');


  const totalHours = schedule.reduce((total, item) => {
    const start = new Date(`1970-01-01T${item.start_time}`);
    const end = new Date(`1970-01-01T${item.end_time}`);
    return total + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  }, 0);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Class Schedule</h1>
            <p className="text-muted-foreground">Your weekly teaching schedule</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex border rounded-lg overflow-hidden">
              <Button
                variant={viewMode === 'calendar' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('calendar')}
                className="rounded-none"
              >
                <Grid3x3 className="mr-2 h-4 w-4" />
                Grid
              </Button>
              <Button
                variant={viewMode === 'cards' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('cards')}
                className="rounded-none"
              >
                <Calendar className="mr-2 h-4 w-4" />
                Cards
              </Button>
            </div>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{schedule.length}</div>
              <p className="text-sm text-muted-foreground">Total Classes/Week</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{totalHours.toFixed(1)} hrs</div>
              <p className="text-sm text-muted-foreground">Teaching Hours/Week</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {new Set(schedule.map((s) => s.course_code)).size}
              </div>
              <p className="text-sm text-muted-foreground">Active Courses</p>
            </CardContent>
          </Card>
        </div>

        {/* Timetable Views */}
        {viewMode === 'calendar' ? (
          <TeacherTimetableCalendar schedule={schedule} />
        ) : (
          <TeacherTimetableCards schedule={schedule} />
        )}
      </div>
    </Layout>
  );
}
