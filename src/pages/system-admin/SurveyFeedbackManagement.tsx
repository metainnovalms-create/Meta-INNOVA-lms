import { Layout } from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CreateSurveyDialog } from '@/components/surveys/CreateSurveyDialog';
import { SurveyAnalytics } from '@/components/surveys/SurveyAnalytics';
import { FeedbackManagementCard } from '@/components/surveys/FeedbackManagementCard';
import { useState } from 'react';
import { useSurveys, useCreateSurvey, useCloseSurvey, useDeleteSurvey } from '@/hooks/useSurveys';
import { useFeedbackList, useFeedbackStats, useUpdateFeedbackStatus } from '@/hooks/useStudentFeedback';
import { useRealtimeSurveys, useRealtimeFeedback } from '@/hooks/useRealtimeSurveys';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Plus, FileText, MessageCircle, TrendingUp, CheckCircle, Search, Loader2 } from 'lucide-react';
import { Survey, SurveyQuestion } from '@/services/survey.service';

export default function SurveyFeedbackManagement() {
  const { user } = useAuth();
  const [createSurveyOpen, setCreateSurveyOpen] = useState(false);
  const [selectedSurveyId, setSelectedSurveyId] = useState<string | null>(null);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);

  // Survey filters
  const [surveyStatusFilter, setSurveyStatusFilter] = useState<string>('all');
  const [surveyInstitutionFilter, setSurveyInstitutionFilter] = useState<string>('all');

  // Feedback filters
  const [feedbackInstitutionFilter, setFeedbackInstitutionFilter] = useState<string>('all');
  const [feedbackCategoryFilter, setFeedbackCategoryFilter] = useState<string>('all');
  const [feedbackStatusFilter, setFeedbackStatusFilter] = useState<string>('all');
  const [feedbackSearch, setFeedbackSearch] = useState('');

  // Enable realtime
  useRealtimeSurveys();
  useRealtimeFeedback();

  // Fetch surveys
  const { data: surveys = [], isLoading: surveysLoading } = useSurveys({
    status: surveyStatusFilter !== 'all' ? surveyStatusFilter : undefined,
  });

  // Fetch feedback
  const { data: feedbackList = [], isLoading: feedbackLoading } = useFeedbackList({
    status: feedbackStatusFilter !== 'all' ? feedbackStatusFilter : undefined,
    category: feedbackCategoryFilter !== 'all' ? feedbackCategoryFilter : undefined,
    institution_id: feedbackInstitutionFilter !== 'all' ? feedbackInstitutionFilter : undefined,
  });

  // Fetch feedback stats
  const { data: feedbackStats } = useFeedbackStats();

  // Fetch institutions
  const { data: institutions = [] } = useQuery({
    queryKey: ['institutions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('institutions')
        .select('id, name')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  // Mutations
  const createSurveyMutation = useCreateSurvey();
  const closeSurveyMutation = useCloseSurvey();
  const deleteSurveyMutation = useDeleteSurvey();
  const updateFeedbackMutation = useUpdateFeedbackStatus();

  const handleCreateSurvey = (surveyData: Survey, questions: SurveyQuestion[]) => {
    createSurveyMutation.mutate({
      survey: {
        ...surveyData,
        created_by: user?.id,
        created_by_name: user?.name || 'System Admin',
      },
      questions,
    });
  };

  const handleCloseSurvey = (surveyId: string) => {
    closeSurveyMutation.mutate(surveyId);
  };

  const handleDeleteSurvey = (surveyId: string) => {
    if (!confirm('Are you sure you want to delete this survey?')) return;
    deleteSurveyMutation.mutate(surveyId);
  };

  const handleViewAnalytics = (surveyId: string) => {
    setSelectedSurveyId(surveyId);
    setAnalyticsOpen(true);
  };

  const handleUpdateFeedback = (id: string, updates: { status?: string; admin_response?: string }) => {
    updateFeedbackMutation.mutate({
      feedbackId: id,
      status: updates.status as any,
      adminResponse: updates.admin_response,
      adminUserId: user?.id,
    });
  };

  // Filter surveys by institution
  const filteredSurveys = surveys.filter((survey: any) => {
    if (surveyInstitutionFilter !== 'all') {
      if (survey.target_audience === 'all_students') return surveyInstitutionFilter === 'all';
      if (survey.institution_id !== surveyInstitutionFilter) return false;
    }
    return true;
  });

  // Filter feedback by search
  const filteredFeedback = feedbackList.filter((feedback: any) => {
    if (feedbackSearch && 
        !feedback.subject?.toLowerCase().includes(feedbackSearch.toLowerCase()) &&
        !feedback.feedback_text?.toLowerCase().includes(feedbackSearch.toLowerCase())) {
      return false;
    }
    return true;
  });

  // Calculate stats
  const totalSurveys = surveys.length;
  const activeSurveys = surveys.filter((s: any) => s.status === 'active').length;
  const totalResponses = surveys.reduce((sum: number, s: any) => sum + (s.response_count || 0), 0);

  const totalFeedback = feedbackStats?.total || 0;
  const pendingFeedback = feedbackStats?.by_status?.submitted || 0;
  const resolvedFeedback = feedbackStats?.by_status?.resolved || 0;
  const avgRating = feedbackStats?.average_rating?.toFixed(1) || 'N/A';

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Surveys & Feedback Management</h1>
          <p className="text-muted-foreground mt-1">
            Create surveys, manage student feedback, and track responses
          </p>
        </div>

        <Tabs defaultValue="surveys" className="space-y-6">
          <TabsList>
            <TabsTrigger value="surveys">
              <FileText className="h-4 w-4 mr-2" />
              Surveys
            </TabsTrigger>
            <TabsTrigger value="feedback">
              <MessageCircle className="h-4 w-4 mr-2" />
              Feedback
            </TabsTrigger>
          </TabsList>

          <TabsContent value="surveys" className="space-y-6">
            {/* Survey Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Surveys</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <span className="text-2xl font-bold">{totalSurveys}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Active Surveys</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    <span className="text-2xl font-bold">{activeSurveys}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Responses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-blue-500" />
                    <span className="text-2xl font-bold">{totalResponses}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Completion Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-orange-500" />
                    <span className="text-2xl font-bold">
                      {totalSurveys > 0 ? Math.round((totalResponses / totalSurveys) * 10) : 0}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters & Create Button */}
            <div className="flex flex-wrap gap-3 items-center justify-between">
              <div className="flex flex-wrap gap-3">
                <Select value={surveyStatusFilter} onValueChange={setSurveyStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={surveyInstitutionFilter} onValueChange={setSurveyInstitutionFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Institution" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Institutions</SelectItem>
                    {institutions.map((inst: any) => (
                      <SelectItem key={inst.id} value={inst.id}>{inst.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={() => setCreateSurveyOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Survey
              </Button>
            </div>

            {/* Surveys List */}
            <div className="grid gap-4">
              {surveysLoading ? (
                <Card>
                  <CardContent className="py-12 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </CardContent>
                </Card>
              ) : filteredSurveys.length > 0 ? (
                filteredSurveys.map((survey: any) => (
                  <Card key={survey.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>{survey.title}</CardTitle>
                          <CardDescription className="mt-1">{survey.description}</CardDescription>
                        </div>
                        <Badge variant={survey.status === 'active' ? 'default' : 'secondary'}>
                          {survey.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          {survey.target_audience === 'all_students' && <Badge variant="outline">All Students</Badge>}
                          {survey.institutions?.name && <Badge variant="outline">{survey.institutions.name}</Badge>}
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Created</p>
                            <p className="font-medium">{new Date(survey.created_at).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Deadline</p>
                            <p className="font-medium">{new Date(survey.deadline).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Responses</p>
                            <p className="font-medium">{survey.response_count || 0} students</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleViewAnalytics(survey.id)}>
                            View Responses
                          </Button>
                          {survey.status === 'active' && (
                            <Button size="sm" variant="outline" onClick={() => handleCloseSurvey(survey.id)}>
                              Close Survey
                            </Button>
                          )}
                          <Button size="sm" variant="outline" onClick={() => handleDeleteSurvey(survey.id)}>
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">No surveys found</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="feedback" className="space-y-6">
            {/* Feedback Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Feedback</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-primary" />
                    <span className="text-2xl font-bold">{totalFeedback}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-orange-500" />
                    <span className="text-2xl font-bold">{pendingFeedback}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Resolved</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-2xl font-bold">{resolvedFeedback}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Avg Rating</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                    <span className="text-2xl font-bold">{avgRating}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Feedback Filters */}
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search feedback..."
                  value={feedbackSearch}
                  onChange={(e) => setFeedbackSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={feedbackInstitutionFilter} onValueChange={setFeedbackInstitutionFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Institution" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Institutions</SelectItem>
                  {institutions.map((inst: any) => (
                    <SelectItem key={inst.id} value={inst.id}>{inst.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={feedbackCategoryFilter} onValueChange={setFeedbackCategoryFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="course">Course</SelectItem>
                  <SelectItem value="officer">Officer</SelectItem>
                  <SelectItem value="facility">Facility</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>

              <Select value={feedbackStatusFilter} onValueChange={setFeedbackStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="dismissed">Dismissed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Feedback List */}
            <div className="space-y-4">
              {feedbackLoading ? (
                <Card>
                  <CardContent className="py-12 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </CardContent>
                </Card>
              ) : filteredFeedback.length > 0 ? (
                filteredFeedback.map((feedback: any) => (
                  <FeedbackManagementCard
                    key={feedback.id}
                    feedback={{
                      id: feedback.id,
                      student_id: feedback.student_id,
                      student_name: feedback.is_anonymous ? 'Anonymous' : (feedback.profiles?.name || feedback.student_name || 'Unknown'),
                      institution_id: feedback.institution_id,
                      institution_name: feedback.institutions?.name || 'Unknown',
                      category: feedback.category,
                      subject: feedback.subject,
                      feedback_text: feedback.feedback_text,
                      is_anonymous: feedback.is_anonymous,
                      rating: feedback.rating,
                      status: feedback.status,
                      submitted_at: feedback.submitted_at,
                      admin_response: feedback.admin_response,
                    }}
                    onUpdate={handleUpdateFeedback}
                  />
                ))
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">No feedback found</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <CreateSurveyDialog
          open={createSurveyOpen}
          onOpenChange={setCreateSurveyOpen}
          onSubmit={handleCreateSurvey}
        />

        {/* Survey Analytics Dialog */}
        <SurveyAnalytics
          surveyId={selectedSurveyId}
          surveyTitle={filteredSurveys.find((s: any) => s.id === selectedSurveyId)?.title}
          surveyStatus={filteredSurveys.find((s: any) => s.id === selectedSurveyId)?.status}
          open={analyticsOpen}
          onOpenChange={setAnalyticsOpen}
        />
      </div>
    </Layout>
  );
}
