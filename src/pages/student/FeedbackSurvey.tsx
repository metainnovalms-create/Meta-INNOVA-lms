import { Layout } from "@/components/layout/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SurveyCard } from "@/components/student/SurveyCard";
import { TakeSurveyDialog } from "@/components/student/TakeSurveyDialog";
import { FeedbackForm } from "@/components/student/FeedbackForm";
import { FeedbackItem } from "@/components/student/FeedbackItem";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, MessageSquare, Loader2 } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useActiveSurveysForStudent } from "@/hooks/useSurveys";
import { useSubmitSurveyResponse } from "@/hooks/useSurveyResponses";
import { useStudentOwnFeedback, useSubmitFeedback } from "@/hooks/useStudentFeedback";
import { useRealtimeSurveys, useRealtimeFeedback } from "@/hooks/useRealtimeSurveys";
import { StudentFeedback } from "@/services/studentFeedback.service";

export default function FeedbackSurvey() {
  const { user } = useAuth();
  const profile = user;
  const [selectedSurvey, setSelectedSurvey] = useState<any | null>(null);
  const [takeSurveyOpen, setTakeSurveyOpen] = useState(false);

  // Enable realtime updates
  useRealtimeSurveys();
  useRealtimeFeedback();

  // Fetch active surveys for this student
  const { data: surveys = [], isLoading: surveysLoading } = useActiveSurveysForStudent(
    user?.id,
    profile?.institution_id,
    profile?.class_id
  );

  // Fetch student's feedback
  const { data: feedbackList = [], isLoading: feedbackLoading } = useStudentOwnFeedback(user?.id);

  // Mutations
  const submitResponseMutation = useSubmitSurveyResponse();
  const submitFeedbackMutation = useSubmitFeedback();

  const handleTakeSurvey = (survey: any) => {
    setSelectedSurvey(survey);
    setTakeSurveyOpen(true);
  };

  const handleSubmitSurvey = (answers: Array<{ question_id: string; answer_text?: string; answer_number?: number; answer_options?: string[] }>) => {
    if (!selectedSurvey || !user?.id || !profile?.institution_id) return;

    submitResponseMutation.mutate({
      survey_id: selectedSurvey.id,
      student_id: user.id,
      institution_id: profile.institution_id,
      class_id: profile.class_id,
      answers,
    }, {
      onSuccess: () => {
        setTakeSurveyOpen(false);
        setSelectedSurvey(null);
      },
    });
  };

  const handleSubmitFeedback = (feedbackData: Omit<StudentFeedback, 'id' | 'status'>) => {
    if (!user?.id || !profile?.institution_id) return;

    submitFeedbackMutation.mutate({
      ...feedbackData,
      student_id: user.id,
      student_name: profile?.name,
      institution_id: profile.institution_id,
    });
  };

  const activeSurveys = surveys.filter((s: any) => !s.is_completed);
  const completedSurveys = surveys.filter((s: any) => s.is_completed);

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Feedback & Surveys</h1>
          <p className="text-muted-foreground">
            Complete surveys and share your feedback to help us improve
          </p>
        </div>

        <Tabs defaultValue="surveys" className="space-y-6">
          <TabsList>
            <TabsTrigger value="surveys">
              <FileText className="h-4 w-4 mr-2" />
              Surveys
            </TabsTrigger>
            <TabsTrigger value="feedback">
              <MessageSquare className="h-4 w-4 mr-2" />
              Feedback
            </TabsTrigger>
          </TabsList>

          <TabsContent value="surveys" className="space-y-6">
            {surveysLoading ? (
              <Card>
                <CardContent className="py-12 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </CardContent>
              </Card>
            ) : (
              <>
                {activeSurveys.length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold mb-4">Pending Surveys</h2>
                    <div className="grid gap-4">
                {activeSurveys.map((survey: any) => (
                        <SurveyCard
                          key={survey.id}
                          survey={survey}
                          isCompleted={false}
                          onTakeSurvey={() => handleTakeSurvey(survey)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {completedSurveys.length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold mb-4">Completed Surveys</h2>
                    <div className="grid gap-4">
                      {completedSurveys.map((survey: any) => (
                        <SurveyCard
                          key={survey.id}
                          survey={survey}
                          isCompleted={true}
                          onTakeSurvey={() => {}}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {activeSurveys.length === 0 && completedSurveys.length === 0 && (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground">No surveys available at the moment</p>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="feedback" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <div>
                <FeedbackForm onSubmit={handleSubmitFeedback} />
              </div>

              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Your Feedback History</CardTitle>
                    <CardDescription>
                      Track the status of your submitted feedback
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {feedbackLoading ? (
                      <div className="py-12 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <ScrollArea className="h-[600px] pr-4">
                        {feedbackList.length > 0 ? (
                          <div className="space-y-4">
                            {feedbackList.map((feedback: any) => (
                              <FeedbackItem key={feedback.id} feedback={feedback} />
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-12">
                            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                            <p className="text-muted-foreground">No feedback submitted yet</p>
                          </div>
                        )}
                      </ScrollArea>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {selectedSurvey && (
          <TakeSurveyDialog
            survey={{
              id: selectedSurvey.id,
              title: selectedSurvey.title,
              description: selectedSurvey.description,
              questions: (selectedSurvey.survey_questions || []).map((q: any) => ({
                id: q.id,
                question_text: q.question_text,
                question_type: q.question_type,
                options: q.options,
                required: q.is_required,
              })),
            }}
            open={takeSurveyOpen}
            onClose={() => {
              setTakeSurveyOpen(false);
              setSelectedSurvey(null);
            }}
            onSubmit={handleSubmitSurvey}
          />
        )}
      </div>
    </Layout>
  );
}
