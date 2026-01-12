import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Calendar,
  Clock,
  Users,
  Package,
  AlertCircle,
  CheckCircle,
  Building2,
  TrendingUp,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/layout/Layout';
import { useInstitutionData } from '@/contexts/InstitutionDataContext';
import { OfficerCheckInCard } from '@/components/officer/OfficerCheckInCard';
import { useOfficerByUserId } from '@/hooks/useOfficerProfile';
import { useOfficerTodayAttendance } from '@/hooks/useOfficerAttendance';
import { useOfficerSalaryCalculation, useOfficerDashboardStats, useOfficerTasks } from '@/hooks/useOfficerDashboardData';
import { SalaryProgressCard } from '@/components/dashboard/SalaryProgressCard';
import { TasksSummaryCard } from '@/components/dashboard/TasksSummaryCard';
import { useOfficerPendingProjects } from '@/hooks/useOfficerPendingProjects';

const getStatusLabel = (status: string) => {
  switch(status) {
    case 'pending_review': return 'Pending Review';
    case 'submitted': return 'Submitted';
    case 'ongoing': return 'Ongoing';
    default: return status;
  }
};

const getTimeOfDay = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Morning';
  if (hour < 17) return 'Afternoon';
  return 'Evening';
};

export default function OfficerDashboard() {
  const { user } = useAuth();
  const { tenantId } = useParams();
  const navigate = useNavigate();
  const { institutions } = useInstitutionData();
  
  // Get officer profile from Supabase
  const { data: officerProfile, isLoading: isLoadingOfficer } = useOfficerByUserId(user?.id);
  const primaryInstitutionId = officerProfile?.assigned_institutions?.[0] || '';
  
  // Get attendance status for check-in card state
  const { data: todayAttendance } = useOfficerTodayAttendance(
    officerProfile?.id || '',
    primaryInstitutionId
  );
  
  // Get real dashboard stats
  const { data: dashboardStats } = useOfficerDashboardStats(officerProfile?.id, primaryInstitutionId);
  
  // Get real salary calculation
  const { data: salaryData, isLoading: isLoadingSalary } = useOfficerSalaryCalculation(
    officerProfile?.id,
    officerProfile?.annual_salary || undefined
  );
  
  // Get tasks assigned to officer
  const { data: tasks = [], isLoading: isLoadingTasks } = useOfficerTasks(user?.id);
  
  // Get real pending projects
  const { data: pendingProjects = [] } = useOfficerPendingProjects(primaryInstitutionId);

  // Helper function to get institution names from IDs
  const getInstitutionNames = (institutionIds: string[]) => {
    return institutionIds
      .map(id => institutions.find(inst => inst.id === id)?.name || 'Unknown Institution')
      .join(', ');
  };

  const stats = [
    {
      title: 'Upcoming Sessions',
      value: dashboardStats?.upcomingSessions?.toString() || '0',
      icon: Calendar,
      description: 'This week',
      color: 'text-blue-600',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-l-blue-500',
    },
    {
      title: 'Active Projects',
      value: dashboardStats?.activeProjects?.toString() || '0',
      icon: TrendingUp,
      description: 'In progress',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-l-emerald-500',
    },
    {
      title: 'Lab Equipment',
      value: dashboardStats?.labEquipment?.toString() || '0',
      icon: Package,
      description: 'Total items',
      color: 'text-violet-600',
      bgColor: 'bg-violet-500/10',
      borderColor: 'border-l-violet-500',
    },
    {
      title: 'Students Enrolled',
      value: dashboardStats?.studentsEnrolled?.toString() || '0',
      icon: Users,
      description: 'Active students',
      color: 'text-amber-600',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-l-amber-500',
    },
  ];

  const quickActions = [
    {
      title: 'View My Timetable',
      icon: Calendar,
      path: `/tenant/${tenantId}/officer/timetable`,
      color: 'text-blue-600',
      bgColor: 'bg-blue-500/10',
      hoverBg: 'hover:bg-blue-500/20',
    },
    {
      title: 'Review Projects',
      icon: CheckCircle,
      path: `/tenant/${tenantId}/officer/projects`,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-500/10',
      hoverBg: 'hover:bg-emerald-500/20',
    },
    {
      title: 'Manage Inventory',
      icon: Package,
      path: `/tenant/${tenantId}/officer/inventory`,
      color: 'text-violet-600',
      bgColor: 'bg-violet-500/10',
      hoverBg: 'hover:bg-violet-500/20',
    },
    {
      title: 'Mark Attendance',
      icon: Users,
      path: `/tenant/${tenantId}/officer/attendance`,
      color: 'text-amber-600',
      bgColor: 'bg-amber-500/10',
      hoverBg: 'hover:bg-amber-500/20',
    },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Enhanced Header with Gradient */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-6 border border-primary/10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>{format(new Date(), 'EEEE, MMMM d, yyyy')}</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              Good {getTimeOfDay()}, {user?.name?.split(' ')[0]}!
            </h1>
            <p className="text-muted-foreground mt-1">
              Welcome to your Innovation Officer Dashboard
            </p>
            
            {/* Assigned Institution Badge */}
            {officerProfile && officerProfile.assigned_institutions.length > 0 && (
              <div className="flex items-center gap-2 mt-4">
                <Badge variant="secondary" className="px-3 py-1.5 gap-2 bg-background/80 backdrop-blur-sm">
                  <Building2 className="h-3.5 w-3.5" />
                  <span className="font-normal">Assigned to:</span>
                  <span className="font-medium">{getInstitutionNames(officerProfile.assigned_institutions)}</span>
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid with Enhanced Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card 
                key={stat.title} 
                className={`group hover:shadow-lg transition-all duration-300 border-l-4 ${stat.borderColor} hover:-translate-y-0.5`}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`${stat.bgColor} p-2.5 rounded-xl group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold tracking-tight">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Main Content Grid - 3 Column Layout */}
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {/* Column 1: Daily Attendance */}
          {officerProfile && primaryInstitutionId ? (
            <OfficerCheckInCard 
              officerId={officerProfile.id} 
              institutionId={primaryInstitutionId}
            />
          ) : (
            <Card className="min-h-[320px]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Daily Attendance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No institution assigned</p>
                  <p className="text-sm mt-1">Contact management to assign you to an institution</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Column 2: Projects Pending Review */}
          <Card className="min-h-[320px]">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-orange-500" />
                  Projects Pending
                </CardTitle>
                <CardDescription>Awaiting your review</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild className="gap-1 text-muted-foreground hover:text-foreground">
                <Link to={`/tenant/${tenantId}/officer/projects`}>
                  View All
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {pendingProjects.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="bg-muted/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                    <TrendingUp className="h-8 w-8 opacity-30" />
                  </div>
                  <p className="font-medium">All caught up!</p>
                  <p className="text-sm mt-1">No projects pending review</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingProjects.slice(0, 4).map((project) => (
                    <div 
                      key={project.id} 
                      className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="bg-orange-500/10 p-2 rounded-lg shrink-0">
                        <TrendingUp className="h-4 w-4 text-orange-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{project.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{project.team}</p>
                      </div>
                      <Badge variant="secondary" className="shrink-0 text-xs bg-orange-500/10 text-orange-600 border-0">
                        {getStatusLabel(project.status)}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Column 3: My Tasks */}
          <TasksSummaryCard 
            tasks={tasks}
            isLoading={isLoadingTasks}
            tasksPath={`/tenant/${tenantId}/officer/tasks`}
            title="My Tasks"
            className="min-h-[320px]"
          />
        </div>

        {/* Full Width Salary Tracker */}
        <SalaryProgressCard
          monthlyBase={salaryData?.monthlyBase || 0}
          daysPresent={salaryData?.daysPresent || 0}
          workingDays={salaryData?.workingDays || 26}
          earnedSalary={salaryData?.earnedSalary || 0}
          overtimeHours={salaryData?.overtimeHours || 0}
          overtimePay={salaryData?.overtimePay || 0}
          totalEarnings={salaryData?.totalEarnings || 0}
          progressPercentage={salaryData?.progressPercentage || 0}
          isLoading={isLoadingSalary}
        />

        {/* Quick Actions - Enhanced */}
        <Card className="border-dashed">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Quick Actions
            </CardTitle>
            <CardDescription>Frequently used shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Button 
                    key={action.title}
                    variant="outline" 
                    className={`h-24 flex-col gap-3 group transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 ${action.hoverBg}`}
                    asChild
                  >
                    <Link to={action.path}>
                      <div className={`p-3 rounded-xl ${action.bgColor} group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className={`h-5 w-5 ${action.color}`} />
                      </div>
                      <span className="font-medium text-sm">{action.title}</span>
                    </Link>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
