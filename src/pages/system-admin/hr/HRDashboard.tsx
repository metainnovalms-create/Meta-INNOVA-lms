import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Briefcase, Users, UserCheck, Calendar, FileText, TrendingUp,
  Plus, ArrowRight, Clock
} from 'lucide-react';
import { useHRDashboardStats, useJobApplications, useCandidateInterviews } from '@/hooks/useHRManagement';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

export default function HRDashboard() {
  const { data: stats, isLoading: statsLoading } = useHRDashboardStats();
  const { data: recentApplications } = useJobApplications();
  const { data: upcomingInterviews } = useCandidateInterviews();

  const todayInterviews = upcomingInterviews?.filter(i => {
    const today = new Date().toISOString().split('T')[0];
    return i.scheduled_date === today && i.status === 'scheduled';
  }) || [];

  const statCards = [
    { 
      title: 'Open Positions', 
      value: stats?.totalOpenJobs || 0, 
      icon: <Briefcase className="h-5 w-5" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      link: '/system-admin/hr-management/jobs'
    },
    { 
      title: 'Total Applications', 
      value: stats?.totalApplications || 0, 
      icon: <Users className="h-5 w-5" />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      link: '/system-admin/hr-management/applications'
    },
    { 
      title: 'Shortlisted', 
      value: stats?.shortlistedCount || 0, 
      icon: <UserCheck className="h-5 w-5" />,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      link: '/system-admin/hr-management/applications?status=shortlisted'
    },
    { 
      title: 'Interviews Today', 
      value: stats?.interviewsToday || 0, 
      icon: <Calendar className="h-5 w-5" />,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      link: '/system-admin/hr-management/interviews'
    },
    { 
      title: 'Offers Extended', 
      value: stats?.offersExtended || 0, 
      icon: <FileText className="h-5 w-5" />,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      link: '/system-admin/hr-management/offers'
    },
    { 
      title: 'Hired This Month', 
      value: stats?.hiredThisMonth || 0, 
      icon: <TrendingUp className="h-5 w-5" />,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      link: '/system-admin/hr-management/applications?status=hired'
    },
  ];

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      applied: 'bg-blue-100 text-blue-700',
      shortlisted: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
      in_interview: 'bg-yellow-100 text-yellow-700',
      selected: 'bg-purple-100 text-purple-700',
      offer_sent: 'bg-indigo-100 text-indigo-700',
      offer_accepted: 'bg-emerald-100 text-emerald-700',
      offer_declined: 'bg-gray-100 text-gray-700',
      hired: 'bg-teal-100 text-teal-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">HR Management</h1>
            <p className="text-muted-foreground">Manage recruitment pipeline and hiring process</p>
          </div>
          <Link to="/system-admin/hr-management/jobs">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Job Posting
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {statCards.map((stat) => (
            <Link key={stat.title} to={stat.link}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className={`${stat.bgColor} ${stat.color} w-10 h-10 rounded-lg flex items-center justify-center mb-3`}>
                    {stat.icon}
                  </div>
                  <p className="text-2xl font-bold">{statsLoading ? '-' : stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Today's Interviews */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Today's Interviews</CardTitle>
              <Link to="/system-admin/hr-management/interviews">
                <Button variant="ghost" size="sm">
                  View All <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {todayInterviews.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No interviews scheduled for today</p>
              ) : (
                <div className="space-y-3">
                  {todayInterviews.slice(0, 5).map((interview) => (
                    <div key={interview.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">{(interview.application as any)?.candidate_name}</p>
                        <p className="text-sm text-muted-foreground">{interview.stage?.stage_name}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center text-sm">
                          <Clock className="h-4 w-4 mr-1" />
                          {interview.scheduled_time}
                        </div>
                        <Badge variant="outline" className="mt-1">
                          {interview.interview_type}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Applications */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Recent Applications</CardTitle>
              <Link to="/system-admin/hr-management/applications">
                <Button variant="ghost" size="sm">
                  View All <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {!recentApplications || recentApplications.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No applications yet</p>
              ) : (
                <div className="space-y-3">
                  {recentApplications.slice(0, 5).map((app) => (
                    <Link 
                      key={app.id} 
                      to={`/system-admin/hr-management/applications/${app.id}`}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div>
                        <p className="font-medium">{app.candidate_name}</p>
                        <p className="text-sm text-muted-foreground">{app.job?.job_title || 'N/A'}</p>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(app.status)}>
                          {app.status.replace('_', ' ')}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(app.applied_at), 'MMM dd')}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link to="/system-admin/hr-management/jobs">
                <Button variant="outline" className="w-full h-20 flex-col">
                  <Briefcase className="h-6 w-6 mb-2" />
                  <span>Job Postings</span>
                </Button>
              </Link>
              <Link to="/system-admin/hr-management/applications">
                <Button variant="outline" className="w-full h-20 flex-col">
                  <Users className="h-6 w-6 mb-2" />
                  <span>Applications</span>
                </Button>
              </Link>
              <Link to="/system-admin/hr-management/interviews">
                <Button variant="outline" className="w-full h-20 flex-col">
                  <Calendar className="h-6 w-6 mb-2" />
                  <span>Interviews</span>
                </Button>
              </Link>
              <Link to="/system-admin/hr-management/offers">
                <Button variant="outline" className="w-full h-20 flex-col">
                  <FileText className="h-6 w-6 mb-2" />
                  <span>Offers</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
