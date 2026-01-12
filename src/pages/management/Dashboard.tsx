import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Users, BookOpen, GraduationCap, AlertCircle, 
  CheckCircle, FolderKanban, UserCog,
  ClipboardCheck, ShoppingCart, CalendarCheck, Sparkles, Medal
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { authService } from "@/services/auth.service";
import { InstitutionHeader } from "@/components/management/InstitutionHeader";
import { CriticalActionsCard } from "@/components/management/CriticalActionsCard";
import { LeaderboardSection } from "@/components/management/LeaderboardSection";
import { useInstitutionStats } from "@/hooks/useInstitutionStats";
import { Skeleton } from "@/components/ui/skeleton";

const Dashboard = () => {
  const { user } = useAuth();
  const tenant = authService.getTenant();
  
  // Extract institution from URL
  const location = useLocation();
  const institutionSlug = location.pathname.split('/')[2];
  
  // Fetch real data
  const { loading, institution, stats, criticalActions, assignedOfficers } = useInstitutionStats(institutionSlug);

  // Core metrics from real data
  const coreMetrics = [
    { 
      title: "Total Students", 
      value: stats.totalStudents.toLocaleString(), 
      icon: Users,
      description: "Enrolled students",
      color: "text-blue-500", 
      bgColor: "bg-blue-500/10" 
    },
    { 
      title: "Total Classes", 
      value: stats.totalClasses.toString(), 
      icon: GraduationCap,
      description: "Active classes",
      color: "text-purple-500", 
      bgColor: "bg-purple-500/10" 
    },
    { 
      title: "Courses Assigned", 
      value: stats.totalCourses.toString(), 
      icon: BookOpen,
      description: "Available courses",
      color: "text-green-500", 
      bgColor: "bg-green-500/10" 
    },
    { 
      title: "Active Projects", 
      value: `${stats.activeProjects} / ${stats.totalProjects}`, 
      icon: FolderKanban,
      description: "Student projects",
      color: "text-orange-500", 
      bgColor: "bg-orange-500/10" 
    },
    {
      title: "Assigned Officers",
      value: stats.totalOfficers.toString(),
      icon: UserCog,
      description: "Teaching staff",
      color: "text-indigo-500",
      bgColor: "bg-indigo-500/10"
    },
    {
      title: "Assessment Attempts",
      value: stats.assessmentAttempts.toString(),
      icon: ClipboardCheck,
      description: `Avg: ${stats.avgAssessmentScore}%`,
      color: "text-teal-500",
      bgColor: "bg-teal-500/10"
    }
  ];

  // Gamification metrics
  const gamificationMetrics = [
    { 
      title: "Total XP Earned", 
      value: stats.totalXP.toLocaleString(), 
      icon: Sparkles,
      description: "Across all students",
      color: "text-yellow-500", 
      bgColor: "bg-yellow-500/10" 
    },
    { 
      title: "Badges Awarded", 
      value: stats.totalBadges.toString(), 
      icon: Medal,
      description: "Student achievements",
      color: "text-pink-500", 
      bgColor: "bg-pink-500/10" 
    },
    { 
      title: "Assignment Submissions", 
      value: stats.assignmentSubmissions.toString(), 
      icon: CheckCircle,
      description: `Avg: ${stats.avgAssignmentMarks}%`,
      color: "text-emerald-500", 
      bgColor: "bg-emerald-500/10" 
    },
  ];

  // Operations metrics
  const operationsMetrics = [
    { 
      title: "Pending Purchases", 
      value: stats.pendingPurchases.toString(), 
      amount: stats.pendingPurchaseAmount,
      icon: ShoppingCart,
      description: stats.pendingPurchaseAmount > 0 ? `₹${stats.pendingPurchaseAmount.toLocaleString()}` : "No pending",
      color: stats.pendingPurchases > 0 ? "text-red-500" : "text-green-500", 
      bgColor: stats.pendingPurchases > 0 ? "bg-red-500/10" : "bg-green-500/10" 
    },
    { 
      title: "Officers on Leave", 
      value: stats.officersOnLeave.toString(), 
      icon: CalendarCheck,
      description: stats.officersOnLeave > 0 
        ? stats.officersOnLeaveDetails.map(o => o.officerName).slice(0, 2).join(', ') + (stats.officersOnLeaveDetails.length > 2 ? '...' : '')
        : "All present today",
      color: stats.officersOnLeave > 0 ? "text-amber-500" : "text-green-500", 
      bgColor: stats.officersOnLeave > 0 ? "bg-amber-500/10" : "bg-green-500/10" 
    },
  ];

  // Map critical actions to the expected format for CriticalActionsCard
  const mappedCriticalActions = criticalActions.map(action => ({
    id: action.id,
    type: action.type,
    title: action.title,
    description: action.description,
    count: action.count,
    urgency: action.urgency,
    deadline: action.deadline,
    amount: action.amount,
    link: action.link,
    icon: action.type === 'purchase' ? ShoppingCart : 
          action.type === 'info' ? CalendarCheck :
          action.type === 'deadline' ? ClipboardCheck : AlertCircle
  }));

  if (loading) {
    return (
      <Layout>
        <div className="space-y-6">
          <Skeleton className="h-32 w-full" />
          <div className="grid gap-4 md:grid-cols-3">
            {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-32" />)}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {institution && (
          <InstitutionHeader 
            institutionName={institution.name}
            establishedYear={institution.settings?.established_year}
            location={institution.address?.city || institution.address?.location}
            totalStudents={stats.totalStudents}
            academicYear={institution.settings?.academic_year || "2024-25"}
            userRole="Management Portal"
            assignedOfficers={assignedOfficers}
          />
        )}
        
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background rounded-lg p-6 border">
          <h1 className="text-3xl font-bold mb-2">Institution Dashboard</h1>
          <p className="text-muted-foreground text-lg">Welcome back, {user?.name}! Here's your institution's real-time performance</p>
        </div>

        {/* Core Metrics - Real Data */}
        <div>
          <div className="mb-4">
            <h2 className="text-2xl font-bold">Core Metrics</h2>
            <p className="text-sm text-muted-foreground">Real-time institution statistics</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {coreMetrics.map((metric) => {
              const Icon = metric.icon;
              return (
                <Card key={metric.title} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                    <div className={`${metric.bgColor} p-2 rounded-lg`}>
                      <Icon className={`h-4 w-4 ${metric.color}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metric.value}</div>
                    <p className="text-xs text-muted-foreground mt-1">{metric.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Gamification & Academic Performance */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Gamification */}
          <div>
            <div className="mb-4">
              <h2 className="text-xl font-bold">Gamification</h2>
              <p className="text-sm text-muted-foreground">Student engagement metrics</p>
            </div>
            <div className="grid gap-4">
              {gamificationMetrics.map((metric) => {
                const Icon = metric.icon;
                return (
                  <Card key={metric.title} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                      <div className={`${metric.bgColor} p-2 rounded-lg`}>
                        <Icon className={`h-4 w-4 ${metric.color}`} />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{metric.value}</div>
                      <p className="text-xs text-muted-foreground mt-1">{metric.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Operations */}
          <div>
            <div className="mb-4">
              <h2 className="text-xl font-bold">Operations Status</h2>
              <p className="text-sm text-muted-foreground">Pending actions overview</p>
            </div>
            <div className="grid gap-4">
              {operationsMetrics.map((metric) => {
                const Icon = metric.icon;
                return (
                  <Card key={metric.title} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                      <div className={`${metric.bgColor} p-2 rounded-lg`}>
                        <Icon className={`h-4 w-4 ${metric.color}`} />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{metric.value}</div>
                      <p className="text-xs text-muted-foreground mt-1">{metric.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>

        {/* Critical Actions Section - Real Data */}
        {mappedCriticalActions.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold">Critical Actions</h2>
                <p className="text-sm text-muted-foreground">Items requiring immediate attention</p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {mappedCriticalActions.map((action) => (
                <CriticalActionsCard key={action.id} action={action} />
              ))}
            </div>
          </div>
        )}

        {/* Student Leaderboards - Already uses real data */}
        {institution && (
          <LeaderboardSection institutionId={institution.id} />
        )}

      </div>
    </Layout>
  );
};

export default Dashboard;
