import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, Calendar, Clock, Video, MapPin, Phone as PhoneIcon,
  User, MessageSquare, CheckCircle, XCircle, Mail, ArrowLeft
} from 'lucide-react';
import { useCandidateInterviews, useUpdateInterview } from '@/hooks/useHRManagement';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FeedbackDialog } from '@/components/hr/interviews/FeedbackDialog';
import { CandidateInterview } from '@/types/hr';

export default function Interviews() {
  const { data: interviews, isLoading } = useCandidateInterviews();
  const updateInterview = useUpdateInterview();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [feedbackInterview, setFeedbackInterview] = useState<CandidateInterview | null>(null);

  const today = new Date().toISOString().split('T')[0];
  
  const todayInterviews = interviews?.filter(i => i.scheduled_date === today) || [];
  const upcomingInterviews = interviews?.filter(i => i.scheduled_date && i.scheduled_date > today && i.status === 'scheduled') || [];
  const pastInterviews = interviews?.filter(i => i.scheduled_date && i.scheduled_date < today) || [];

  const filteredInterviews = interviews?.filter(interview => {
    const candidateName = (interview.application as any)?.candidate_name || '';
    const matchesSearch = candidateName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || interview.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      scheduled: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700',
      rescheduled: 'bg-yellow-100 text-yellow-700',
      no_show: 'bg-gray-100 text-gray-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getResultColor = (result: string | null) => {
    if (!result) return '';
    const colors: Record<string, string> = {
      passed: 'bg-green-100 text-green-700',
      failed: 'bg-red-100 text-red-700',
      on_hold: 'bg-yellow-100 text-yellow-700',
    };
    return colors[result] || '';
  };

  const getInterviewTypeIcon = (type: string) => {
    switch (type) {
      case 'online': return <Video className="h-4 w-4" />;
      case 'in_person': return <MapPin className="h-4 w-4" />;
      case 'phone': return <PhoneIcon className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  const openGmailCompose = (interview: CandidateInterview) => {
    const candidate = interview.application as any;
    if (!candidate?.candidate_email) return;

    const subject = encodeURIComponent(`Interview Scheduled - ${candidate.job?.job_title || 'Position'} at Metasage`);
    const body = encodeURIComponent(`Dear ${candidate.candidate_name},

We are pleased to invite you for an interview for the position of ${candidate.job?.job_title || 'the role you applied for'}.

Interview Details:
- Stage: ${interview.stage?.stage_name || 'Interview'}
- Date: ${interview.scheduled_date ? format(new Date(interview.scheduled_date), 'MMMM dd, yyyy') : 'TBD'}
- Time: ${interview.scheduled_time || 'TBD'}
- Type: ${interview.interview_type === 'online' ? 'Online Meeting' : interview.interview_type === 'in_person' ? 'In-Person' : 'Phone Call'}
${interview.meeting_link ? `- Meeting Link: ${interview.meeting_link}` : interview.location ? `- Location: ${interview.location}` : ''}
- Duration: ${interview.duration_minutes} minutes

Please confirm your availability by replying to this email.

Best regards,
HR Team
Metasage Alliance`);
    
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${candidate.candidate_email}&su=${subject}&body=${body}`, '_blank');
  };

  const handleMarkCompleted = (interview: CandidateInterview) => {
    updateInterview.mutate({ id: interview.id, status: 'completed' });
    setFeedbackInterview(interview);
  };

  const InterviewCard = ({ interview }: { interview: CandidateInterview }) => {
    const candidate = interview.application as any;
    
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-semibold">{candidate?.candidate_name || 'Unknown'}</h4>
                <Badge className={getStatusColor(interview.status)}>
                  {interview.status}
                </Badge>
                {interview.result && (
                  <Badge className={getResultColor(interview.result)}>
                    {interview.result}
                  </Badge>
                )}
              </div>
              
              <p className="text-sm text-muted-foreground mb-2">
                {interview.stage?.stage_name} • {candidate?.job?.job_title || 'N/A'}
              </p>

              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                <span className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {interview.scheduled_date ? format(new Date(interview.scheduled_date), 'MMM dd, yyyy') : 'TBD'}
                </span>
                <span className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {interview.scheduled_time || 'TBD'}
                </span>
                <span className="flex items-center">
                  {getInterviewTypeIcon(interview.interview_type)}
                  <span className="ml-1 capitalize">{interview.interview_type.replace('_', ' ')}</span>
                </span>
              </div>

              {interview.interviewer_names && interview.interviewer_names.length > 0 && (
                <div className="flex items-center gap-1 mt-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{interview.interviewer_names.join(', ')}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              {interview.status === 'scheduled' && (
                <>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => openGmailCompose(interview)}
                  >
                    <Mail className="h-4 w-4 mr-1" />
                    Send Email
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => handleMarkCompleted(interview)}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Complete
                  </Button>
                </>
              )}
              {interview.status === 'completed' && !interview.result && (
                <Button 
                  size="sm"
                  onClick={() => setFeedbackInterview(interview)}
                >
                  <MessageSquare className="h-4 w-4 mr-1" />
                  Add Feedback
                </Button>
              )}
              <Link to={`/system-admin/hr-management/applications/${interview.application_id}`}>
                <Button variant="ghost" size="sm" className="w-full">
                  View Application
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/system-admin/hr-management">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Interviews</h1>
            <p className="text-muted-foreground">Manage and track candidate interviews</p>
          </div>
        </div>

        {/* Today's Summary */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-blue-600">{todayInterviews.length}</p>
              <p className="text-sm text-muted-foreground">Today's Interviews</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-green-600">{upcomingInterviews.length}</p>
              <p className="text-sm text-muted-foreground">Upcoming</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-gray-600">
                {interviews?.filter(i => i.status === 'completed').length || 0}
              </p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-4 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search by candidate name..." 
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="rescheduled">Rescheduled</SelectItem>
                  <SelectItem value="no_show">No Show</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Interviews Tabs */}
        <Tabs defaultValue="today" className="space-y-4">
          <TabsList>
            <TabsTrigger value="today">
              Today ({todayInterviews.length})
            </TabsTrigger>
            <TabsTrigger value="upcoming">
              Upcoming ({upcomingInterviews.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              Past ({pastInterviews.length})
            </TabsTrigger>
            <TabsTrigger value="all">
              All ({filteredInterviews.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="space-y-4">
            {todayInterviews.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No interviews today</h3>
                </CardContent>
              </Card>
            ) : (
              todayInterviews.map(interview => (
                <InterviewCard key={interview.id} interview={interview} />
              ))
            )}
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-4">
            {upcomingInterviews.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No upcoming interviews</h3>
                </CardContent>
              </Card>
            ) : (
              upcomingInterviews.map(interview => (
                <InterviewCard key={interview.id} interview={interview} />
              ))
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-4">
            {pastInterviews.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No past interviews</h3>
                </CardContent>
              </Card>
            ) : (
              pastInterviews.map(interview => (
                <InterviewCard key={interview.id} interview={interview} />
              ))
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            {isLoading ? (
              <div className="text-center py-12">Loading...</div>
            ) : filteredInterviews.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No interviews found</h3>
                </CardContent>
              </Card>
            ) : (
              filteredInterviews.map(interview => (
                <InterviewCard key={interview.id} interview={interview} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Feedback Dialog */}
      <FeedbackDialog 
        open={!!feedbackInterview}
        onOpenChange={(open) => !open && setFeedbackInterview(null)}
        interview={feedbackInterview}
      />
    </Layout>
  );
}
