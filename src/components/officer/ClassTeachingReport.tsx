import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Clock, Calendar, Download, TrendingUp } from 'lucide-react';
import { generateClassTeachingReport, getSessionsByClass } from '@/data/mockClassTeachingProgress';
import { getTeachingStatusColor, getTeachingStatusText, formatTeachingDuration } from '@/utils/classTeachingHelpers';
import { format } from 'date-fns';

interface ClassTeachingReportProps {
  classId: string;
  className: string;
  officerId: string;
}

export function ClassTeachingReport({ classId, className, officerId }: ClassTeachingReportProps) {
  const report = generateClassTeachingReport(classId, officerId);
  const sessions = getSessionsByClass(classId);

  // Sort sessions by date (most recent first)
  const sortedSessions = [...sessions].sort((a, b) => 
    new Date(b.session_date).getTime() - new Date(a.session_date).getTime()
  );

  const handleExportReport = () => {
    console.log('Exporting teaching report...');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Teaching Report - {className}</h2>
          <p className="text-muted-foreground mt-1">
            Summary of all teaching sessions and progress
          </p>
        </div>
        <Button variant="outline" onClick={handleExportReport}>
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{report.total_sessions}</div>
            {report.date_range && (
              <p className="text-xs text-muted-foreground mt-1">
                Since {format(new Date(report.date_range.first_session), 'MMM dd, yyyy')}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Teaching Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{report.total_teaching_hours}h</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across {report.courses.length} courses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Courses Active</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {report.courses.filter(c => c.status === 'in_progress').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Of {report.courses.length} assigned
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Course-wise Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Course-wise Progress</CardTitle>
          <CardDescription>Detailed breakdown of teaching progress per course</CardDescription>
        </CardHeader>
        <CardContent>
          {report.courses.length === 0 ? (
            <div className="text-center py-12">
              <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No teaching sessions recorded yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Start teaching a course to see progress here
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead>Sessions</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Levels</TableHead>
                  <TableHead>Last Session</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.courses.map((course) => (
                  <TableRow key={course.course_id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{course.course_title}</p>
                        <p className="text-sm text-muted-foreground">{course.course_code}</p>
                      </div>
                    </TableCell>
                    <TableCell>{course.sessions_count}</TableCell>
                    <TableCell>{course.total_hours.toFixed(1)}h</TableCell>
                    <TableCell>
                      {course.modules_completed}/{course.modules_total}
                    </TableCell>
                    <TableCell>
                      {course.last_session_date
                        ? format(new Date(course.last_session_date), 'MMM dd, yyyy')
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getTeachingStatusColor(course.status) as any}>
                        {getTeachingStatusText(course.status)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Session History */}
      <Card>
        <CardHeader>
          <CardTitle>Session History</CardTitle>
          <CardDescription>Recent teaching sessions in chronological order</CardDescription>
        </CardHeader>
        <CardContent>
          {sortedSessions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No sessions yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-shrink-0 w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{session.module_title}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {format(new Date(session.session_date), 'MMMM dd, yyyy • h:mm a')}
                        </p>
                      </div>
                      <Badge variant="secondary">
                        {formatTeachingDuration(session.duration_minutes)}
                      </Badge>
                    </div>
                    {session.notes && (
                      <p className="text-sm text-muted-foreground mt-2">{session.notes}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>{session.content_covered.length} content items covered</span>
                      {session.attendance_marked && (
                        <span className="flex items-center gap-1">
                          <div className="h-1.5 w-1.5 bg-green-500 rounded-full" />
                          Attendance marked
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
