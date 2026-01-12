import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Users, Calendar, TrendingUp, Clock, CheckCircle, ClipboardCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/auth.service';
import { Layout } from '@/components/layout/Layout';
import { MarkAttendanceDialog } from '@/components/teacher/MarkAttendanceDialog';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const tenant = authService.getTenant();
  const [isAttendanceDialogOpen, setIsAttendanceDialogOpen] = useState(false);
  const [attendanceMarked, setAttendanceMarked] = useState(false);

  const stats = [
    {
      title: 'My Courses',
      value: '6',
      icon: BookOpen,
      description: 'This semester',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Total Students',
      value: '245',
      icon: Users,
      description: 'Across all courses',
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Classes This Week',
      value: '18',
      icon: Calendar,
      description: '4 today',
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'Avg Attendance',
      value: '87%',
      icon: TrendingUp,
      description: '+3% from last month',
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
  ];

  const todayClasses = [
    { id: '1', time: '09:00 AM', course: 'CS301 - AI & ML', room: 'Lab A', type: 'Lecture' },
    { id: '2', time: '11:00 AM', course: 'CS302 - Data Structures', room: 'Room 201', type: 'Tutorial' },
    { id: '3', time: '02:00 PM', course: 'CS401 - Advanced Algorithms', room: 'Lab B', type: 'Lab' },
    { id: '4', time: '04:00 PM', course: 'CS201 - Programming', room: 'Room 105', type: 'Lecture' },
  ];

  const pendingTasks = [
    { id: '1', title: 'Grade CS301 Assignments', count: 45, deadline: 'Due tomorrow' },
    { id: '2', title: 'Prepare CS302 Quiz', count: 1, deadline: 'Due in 3 days' },
    { id: '3', title: 'Review Project Proposals', count: 12, deadline: 'Due this week' },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user?.name}!</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <div className={`${stat.bgColor} p-2 rounded-lg`}>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">{stat.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Mark Attendance Card */}
          <Card>
            <CardHeader>
              <CardTitle>Today's Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-6 border-2 border-dashed rounded-lg">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {attendanceMarked ? 'Attendance marked' : 'Have you marked your attendance today?'}
                  </p>
                  {attendanceMarked ? (
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium">Present - {new Date().toLocaleTimeString()}</span>
                    </div>
                  ) : (
                    <Button onClick={() => setIsAttendanceDialogOpen(true)}>
                      <ClipboardCheck className="h-4 w-4 mr-2" />
                      Mark Attendance
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Today's Classes */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Today's Schedule</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link to={`/tenant/${tenant?.slug}/teacher/schedule`}>View All</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {todayClasses.map((cls) => (
                  <div key={cls.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                    <div className="flex items-start gap-3">
                      <div className="bg-primary/10 p-2 rounded-lg">
                        <Clock className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{cls.course}</p>
                        <p className="text-sm text-muted-foreground">
                          {cls.room} • {cls.type}
                        </p>
                      </div>
                    </div>
                    <div className="text-sm font-medium">{cls.time}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Pending Tasks */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Pending Tasks</CardTitle>
              <Button variant="outline" size="sm">View All</Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                    <div className="flex items-start gap-3">
                      <div className="bg-orange-500/10 p-2 rounded-lg">
                        <CheckCircle className="h-4 w-4 text-orange-500" />
                      </div>
                      <div>
                        <p className="font-medium">{task.title}</p>
                        <p className="text-sm text-muted-foreground">{task.deadline}</p>
                      </div>
                    </div>
                    <span className="text-xs bg-orange-500/10 text-orange-500 px-2 py-1 rounded-full">
                      {task.count}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-5">
              <Button variant="outline" className="h-24 flex-col gap-2" asChild>
                <Link to={`/tenant/${tenant?.slug}/teacher/courses`}>
                  <BookOpen className="h-6 w-6" />
                  My Courses
                </Link>
              </Button>
              <Button variant="outline" className="h-24 flex-col gap-2" asChild>
                <Link to={`/tenant/${tenant?.slug}/teacher/grades`}>
                  <CheckCircle className="h-6 w-6" />
                  Grade Students
                </Link>
              </Button>
              <Button variant="outline" className="h-24 flex-col gap-2" asChild>
                <Link to={`/tenant/${tenant?.slug}/teacher/attendance`}>
                  <Users className="h-6 w-6" />
                  Mark Attendance
                </Link>
              </Button>
              <Button variant="outline" className="h-24 flex-col gap-2" asChild>
                <Link to={`/tenant/${tenant?.slug}/teacher/schedule`}>
                  <Calendar className="h-6 w-6" />
                  View Schedule
                </Link>
              </Button>
              <Button variant="outline" className="h-24 flex-col gap-2" asChild>
                <Link to={`/tenant/${tenant?.slug}/teacher/materials`}>
                  <BookOpen className="h-6 w-6" />
                  Upload Materials
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Mark Attendance Dialog */}
      <MarkAttendanceDialog
        open={isAttendanceDialogOpen}
        onOpenChange={(open) => {
          setIsAttendanceDialogOpen(open);
          if (!open) setAttendanceMarked(true);
        }}
      />
    </Layout>
  );
}
