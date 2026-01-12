import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, BookOpen, GraduationCap, TrendingUp, Calendar, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/auth.service';
import { Layout } from '@/components/layout/Layout';

export default function InstitutionDashboard() {
  const { user } = useAuth();
  const tenant = authService.getTenant();

  const stats = [
    {
      title: 'Total Students',
      value: '2,845',
      icon: GraduationCap,
      description: '+12% from last semester',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Faculty Members',
      value: '186',
      icon: Users,
      description: '8 new this month',
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Active Courses',
      value: '245',
      icon: BookOpen,
      description: 'Across 12 departments',
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'Average CGPA',
      value: '7.8',
      icon: TrendingUp,
      description: '+0.3 from last semester',
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
  ];

  const departments = [
    { name: 'Computer Science', students: 520, faculty: 28 },
    { name: 'Electronics', students: 450, faculty: 24 },
    { name: 'Mechanical', students: 480, faculty: 26 },
    { name: 'Civil', students: 390, faculty: 22 },
    { name: 'Electrical', students: 425, faculty: 23 },
  ];

  const recentActivities = [
    { id: '1', title: 'New batch enrollment completed', time: '2 hours ago', type: 'enrollment' },
    { id: '2', title: 'Semester exam schedule published', time: '5 hours ago', type: 'academic' },
    { id: '3', title: 'Faculty development workshop scheduled', time: '1 day ago', type: 'event' },
    { id: '4', title: 'Student placement drive initiated', time: '2 days ago', type: 'placement' },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Institution Dashboard</h1>
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
          {/* Department Overview */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Department Overview</CardTitle>
              <Button variant="outline" size="sm">View All</Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {departments.map((dept) => (
                  <div key={dept.name} className="flex items-center justify-between border-b pb-3 last:border-0">
                    <div>
                      <p className="font-medium">{dept.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {dept.students} students • {dept.faculty} faculty
                      </p>
                    </div>
                    <div className="text-sm font-medium">{((dept.students / 2845) * 100).toFixed(1)}%</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activities */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Activities</CardTitle>
              <Button variant="outline" size="sm">View All</Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 border-b pb-3 last:border-0">
                    <div className="bg-primary/10 p-2 rounded-lg mt-1">
                      <Calendar className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
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
            <div className="grid gap-4 md:grid-cols-4">
              <Button variant="outline" className="h-24 flex-col gap-2" asChild>
                <Link to={`/tenant/${tenant?.slug}/institution/teachers`}>
                  <Users className="h-6 w-6" />
                  Manage Faculty
                </Link>
              </Button>
              <Button variant="outline" className="h-24 flex-col gap-2" asChild>
                <Link to={`/tenant/${tenant?.slug}/institution/students`}>
                  <GraduationCap className="h-6 w-6" />
                  Student Enrollment
                </Link>
              </Button>
              <Button variant="outline" className="h-24 flex-col gap-2" asChild>
                <Link to={`/tenant/${tenant?.slug}/institution/courses`}>
                  <BookOpen className="h-6 w-6" />
                  Course Assignment
                </Link>
              </Button>
              <Button variant="outline" className="h-24 flex-col gap-2" asChild>
                <Link to={`/tenant/${tenant?.slug}/institution/reports`}>
                  <Award className="h-6 w-6" />
                  Generate Reports
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
