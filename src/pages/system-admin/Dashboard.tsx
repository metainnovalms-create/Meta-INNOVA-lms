import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, Users, GraduationCap, Key, TrendingUp, AlertCircle, Phone, Package, 
  Calendar, CalendarCheck, FileText, BookOpen, Target, ListTodo, ClipboardList,
  Settings, Award, UserPlus, Video, Newspaper, Bot, BarChart3, Briefcase, FolderKanban
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/layout/Layout';
import { StaffAttendanceCard } from '@/components/attendance/StaffAttendanceCard';
import { TasksSummaryCard } from '@/components/dashboard/TasksSummaryCard';
import { SalaryProgressCard } from '@/components/dashboard/SalaryProgressCard';
import { useStaffTasks, useStaffSalaryCalculation } from '@/hooks/useStaffDashboardData';
import { getPendingLeaveCount } from '@/data/mockLeaveData';
import { SystemAdminFeature } from '@/types/permissions';
import { LucideIcon } from 'lucide-react';

// Feature to Quick Action mapping
const FEATURE_QUICK_ACTIONS: Record<SystemAdminFeature, { label: string; icon: LucideIcon; path: string } | null> = {
  institution_management: { label: 'Institutions', icon: Building2, path: '/system-admin/institutions' },
  course_management: { label: 'Courses', icon: BookOpen, path: '/system-admin/course-management' },
  assessment_management: { label: 'Assessments', icon: ClipboardList, path: '/system-admin/assessment-management' },
  assignment_management: { label: 'Assignments', icon: FileText, path: '/system-admin/assignment-management' },
  event_management: { label: 'Events', icon: Calendar, path: '/system-admin/event-management' },
  officer_management: { label: 'Officers', icon: Users, path: '/system-admin/officers' },
  project_management: { label: 'Projects', icon: FolderKanban, path: '/system-admin/project-management' },
  inventory_management: { label: 'Inventory', icon: Package, path: '/system-admin/inventory-management' },
  attendance_payroll: { label: 'Attendance', icon: CalendarCheck, path: '/system-admin/attendance' },
  leave_approvals: { label: 'Leave Approvals', icon: CalendarCheck, path: '/system-admin/leave-approvals' },
  leave_management: { label: 'Leave Management', icon: Calendar, path: '/system-admin/leave-management' },
  company_holidays: { label: 'Holidays', icon: Calendar, path: '/system-admin/company-holidays' },
  payroll_management: { label: 'Payroll', icon: Briefcase, path: '/system-admin/payroll' },
  global_approval_config: { label: 'Approvals', icon: Settings, path: '/system-admin/approval-config' },
  ats_management: { label: 'Recruitment', icon: UserPlus, path: '/system-admin/recruitment' },
  institutional_calendar: { label: 'Calendar', icon: Calendar, path: '/system-admin/institutional-calendar' },
  reports_analytics: { label: 'Reports', icon: BarChart3, path: '/system-admin/reports' },
  sdg_management: { label: 'SDG Goals', icon: Target, path: '/system-admin/sdg-management' },
  task_management: { label: 'My Tasks', icon: ListTodo, path: '/system-admin/my-tasks' },
  task_allotment: { label: 'Task Allotment', icon: ListTodo, path: '/system-admin/tasks' },
  credential_management: { label: 'Credentials', icon: Key, path: '/system-admin/credentials' },
  gamification: { label: 'Gamification', icon: Award, path: '/system-admin/gamification' },
  id_configuration: { label: 'ID Config', icon: Settings, path: '/system-admin/id-configuration' },
  survey_feedback: { label: 'Surveys', icon: ClipboardList, path: '/system-admin/surveys' },
  performance_ratings: { label: 'Ratings', icon: TrendingUp, path: '/system-admin/performance-ratings' },
  webinar_management: { label: 'Webinars', icon: Video, path: '/system-admin/webinars' },
  crm_clients: { label: 'CRM', icon: Phone, path: '/system-admin/crm' },
  news_feeds: { label: 'News Feeds', icon: Newspaper, path: '/system-admin/news-feeds' },
  ask_metova: { label: 'Ask Metova', icon: Bot, path: '/system-admin/ask-metova' },
  settings: { label: 'Settings', icon: Settings, path: '/system-admin/settings' },
  position_management: { label: 'Positions', icon: Users, path: '/system-admin/position-management' },
};

export default function SystemAdminDashboard() {
  const { user } = useAuth();
  const [pendingLeaveCount, setPendingLeaveCount] = useState(0);

  // Fetch tasks for current user
  const { data: tasks = [], isLoading: tasksLoading } = useStaffTasks(user?.id);

  // Calculate salary progress
  const { data: salaryData, isLoading: salaryLoading } = useStaffSalaryCalculation(
    user?.id,
    user?.annual_salary,
    user?.overtime_rate_multiplier,
    user?.normal_working_hours
  );

  useEffect(() => {
    setPendingLeaveCount(getPendingLeaveCount());
  }, []);

  // Dynamic dashboard title based on position
  const getDashboardTitle = () => {
    if (user?.is_ceo) return 'CEO Dashboard';
    if (user?.position_name) {
      return `${user.position_name} Dashboard`;
    }
    return 'Staff Dashboard';
  };

  const getDashboardSubtitle = () => {
    if (user?.is_ceo) return 'Manage clients and oversee all operations';
    return `Welcome back, ${user?.name}! Here's your personalized workspace`;
  };

  // Generate quick actions from allowed_features
  const getQuickActions = () => {
    const features = user?.allowed_features || [];
    return features
      .map(feature => FEATURE_QUICK_ACTIONS[feature])
      .filter((action): action is { label: string; icon: LucideIcon; path: string } => action !== null)
      .slice(0, 8); // Limit to 8 for UI consistency
  };

  const quickActions = getQuickActions();

  // CEO-only stats
  const stats = [
    {
      title: 'Total Clients',
      value: '25',
      icon: Building2,
      description: '+3 this month',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Active Subscriptions',
      value: '22',
      icon: Key,
      description: '88% active rate',
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Total Users',
      value: '15,420',
      icon: Users,
      description: 'Across all clients',
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'Expiring Agreements',
      value: '3',
      icon: AlertCircle,
      description: 'Within 30 days',
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
    {
      title: 'Pending Leave Approvals',
      value: pendingLeaveCount.toString(),
      icon: CalendarCheck,
      description: 'Require your attention',
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      link: '/system-admin/leave-approvals',
    },
  ];

  const recentTenants = [
    { id: '1', name: 'Delhi Public School Network', plan: 'Premium', institutions: 5, users: 2450, status: 'active' },
    { id: '2', name: 'Ryan International Schools', plan: 'Enterprise', institutions: 8, users: 3800, status: 'active' },
    { id: '3', name: 'Innovation Hub Chennai', plan: 'Basic', institutions: 1, users: 450, status: 'active' },
  ];

  const alerts = [
    { id: '1', message: 'DPS Network agreement expires in 15 days', severity: 'warning' },
    { id: '2', message: 'Ryan Schools exceeded storage limit by 10%', severity: 'error' },
    { id: '3', message: 'New tenant signup: Tech Academy Network', severity: 'info' },
  ];

  const topTenants = [
    { name: 'Ryan International Schools', users: 3800, growth: '+12%' },
    { name: 'Delhi Public School Network', users: 2450, growth: '+8%' },
    { name: 'Cambridge International', users: 1890, growth: '+15%' },
    { name: 'Oxford Schools Group', users: 1650, growth: '+5%' },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{getDashboardTitle()}</h1>
            <p className="text-muted-foreground">{getDashboardSubtitle()}</p>
          </div>
          {user?.position_name && (
            <Badge variant="outline" className="text-base px-4 py-2">
              {user.position_name.toUpperCase().replace('_', ' ')}
            </Badge>
          )}
        </div>

        {/* Row 1: 3-Column Layout - Daily Attendance, Projects, My Tasks */}
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {/* Column 1: Daily Attendance */}
          <StaffAttendanceCard className="min-h-[320px]" />

          {/* Column 2: Projects Pending */}
          <Card className="min-h-[320px]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderKanban className="h-5 w-5 text-primary" />
                Projects
              </CardTitle>
              <CardDescription>Your active projects</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <FolderKanban className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">No active projects</p>
                <p className="text-sm">Projects assigned to you will appear here</p>
              </div>
            </CardContent>
          </Card>

          {/* Column 3: My Tasks */}
          <TasksSummaryCard 
            tasks={tasks}
            isLoading={tasksLoading}
            tasksPath="/system-admin/my-tasks"
            title="My Tasks"
            className="min-h-[320px]"
          />
        </div>

        {/* Row 2: Full Width Salary Tracker */}
        <SalaryProgressCard 
          monthlyBase={salaryData?.monthlyBase || 0}
          daysPresent={salaryData?.daysPresent || 0}
          workingDays={salaryData?.workingDays || 26}
          earnedSalary={salaryData?.earnedSalary || 0}
          overtimeHours={salaryData?.overtimeHours || 0}
          overtimePay={salaryData?.overtimePay || 0}
          totalEarnings={salaryData?.totalEarnings || 0}
          progressPercentage={salaryData?.progressPercentage || 0}
          isLoading={salaryLoading}
        />

        {/* Quick Actions - Based on allowed_features */}
        {quickActions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  const showBadge = action.path === '/system-admin/leave-approvals' && pendingLeaveCount > 0;
                  
                  return (
                    <Button 
                      key={action.path} 
                      variant="outline" 
                      className="h-24 flex-col gap-2 relative" 
                      asChild
                    >
                      <Link to={action.path}>
                        <Icon className="h-6 w-6" />
                        {action.label}
                        {showBadge && (
                          <Badge variant="destructive" className="absolute top-2 right-2">
                            {pendingLeaveCount}
                          </Badge>
                        )}
                      </Link>
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* CEO-Only Sections */}
        {user?.is_ceo && (
          <>
            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              {stats.map((stat) => {
                const Icon = stat.icon;
                
                return stat.link ? (
                  <Link key={stat.title} to={stat.link}>
                    <Card className="cursor-pointer hover:shadow-lg transition-shadow">
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
                  </Link>
                ) : (
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
              {/* System Alerts */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>System Alerts</CardTitle>
                  <Button variant="outline" size="sm">View All</Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {alerts.map((alert) => (
                      <div key={alert.id} className="flex items-start gap-3 border-b pb-3 last:border-0">
                        <div className={`p-2 rounded-lg ${
                          alert.severity === 'error' ? 'bg-red-500/10' :
                          alert.severity === 'warning' ? 'bg-yellow-500/10' :
                          'bg-blue-500/10'
                        }`}>
                          <AlertCircle className={`h-4 w-4 ${
                            alert.severity === 'error' ? 'text-red-500' :
                            alert.severity === 'warning' ? 'text-yellow-500' :
                            'text-blue-500'
                          }`} />
                        </div>
                        <p className="text-sm flex-1">{alert.message}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Tenants */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Top Clients by Users</CardTitle>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/system-admin/tenants">View All</Link>
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topTenants.map((tenant, index) => (
                      <div key={tenant.name} className="flex items-center justify-between border-b pb-3 last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{tenant.name}</p>
                            <p className="text-sm text-muted-foreground">{tenant.users} users</p>
                          </div>
                        </div>
                        <div className="text-sm font-medium text-green-500">{tenant.growth}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Tenants */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent Clients</CardTitle>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/system-admin/tenants">Manage All</Link>
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentTenants.map((tenant) => (
                    <div key={tenant.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                      <div className="flex items-start gap-3">
                        <div className="bg-primary/10 p-2 rounded-lg">
                          <Building2 className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{tenant.name}</p>
                          <p className="text-sm text-muted-foreground">{tenant.plan} • {tenant.institutions} institutions • {tenant.users} users</p>
                        </div>
                      </div>
                      <span className="text-xs bg-green-500/10 text-green-500 px-2 py-1 rounded-full">
                        {tenant.status}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </Layout>
  );
}
