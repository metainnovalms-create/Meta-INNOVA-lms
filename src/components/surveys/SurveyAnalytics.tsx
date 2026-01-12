import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Users, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useSurveyAnalytics } from '@/hooks/useSurveys';
import { useSurveyResponses } from '@/hooks/useSurveyResponses';

interface SurveyAnalyticsProps {
  surveyId: string | null;
  surveyTitle?: string;
  surveyStatus?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SurveyAnalytics({ surveyId, surveyTitle, surveyStatus, open, onOpenChange }: SurveyAnalyticsProps) {
  const { data: analytics, isLoading: analyticsLoading } = useSurveyAnalytics(surveyId || undefined);
  const { data: responses, isLoading: responsesLoading } = useSurveyResponses(surveyId || undefined);

  const isLoading = analyticsLoading || responsesLoading;

  const handleExportCSV = () => {
    if (!responses || !analytics) return;

    const questions = analytics.questions || [];
    const headers = ['Student Name', 'Email', 'Institution', 'Class', 'Submitted At', ...questions.map((q: any) => q.question_text)];
    
    const rows = responses.map((response: any) => {
      const row = [
        response.profiles?.name || 'Anonymous',
        response.profiles?.email || '-',
        response.institutions?.name || '-',
        response.classes ? `${response.classes.class_name} ${response.classes.section || ''}`.trim() : '-',
        new Date(response.submitted_at).toLocaleString(),
      ];

      questions.forEach((q: any) => {
        const answer = response.survey_response_answers?.find((a: any) => a.question_id === q.question_id);
        if (answer) {
          if (answer.answer_options?.length > 0) {
            row.push(answer.answer_options.join(', '));
          } else if (answer.answer_number !== null && answer.answer_number !== undefined) {
            row.push(String(answer.answer_number));
          } else {
            row.push(answer.answer_text || '');
          }
        } else {
          row.push('');
        }
      });

      return row;
    });

    const csv = [
      headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','),
      ...rows.map(row => row.map((cell: string) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(surveyTitle || 'survey').replace(/\s+/g, '_')}_responses.csv`;
    a.click();
    
    toast.success('Survey responses exported successfully!');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{surveyTitle || 'Survey'} - Analytics</DialogTitle>
          <DialogDescription>
            View and analyze survey responses
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ScrollArea className="max-h-[70vh]">
            <div className="space-y-6 pr-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Responses</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      <span className="text-2xl font-bold">{analytics?.total_responses || 0}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Questions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="text-2xl font-bold">{analytics?.questions?.length || 0}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge variant={surveyStatus === 'active' ? 'default' : 'secondary'}>
                      {surveyStatus || 'unknown'}
                    </Badge>
                  </CardContent>
                </Card>
              </div>

              {/* Question Analysis */}
              <div className="space-y-4">
                {analytics?.questions?.map((question: any, index: number) => (
                  <Card key={question.question_id}>
                    <CardHeader>
                      <CardTitle className="text-base">
                        Q{index + 1}. {question.question_text}
                      </CardTitle>
                      <Badge variant="outline" className="w-fit">{question.question_type}</Badge>
                    </CardHeader>
                    <CardContent>
                      {(question.question_type === 'mcq' || question.question_type === 'multiple_select') && question.option_counts && (
                        <div className="space-y-2">
                          {Object.entries(question.option_counts).map(([option, count]: [string, any]) => {
                            const percentage = question.total_responses > 0 
                              ? Math.round((count / question.total_responses) * 100) 
                              : 0;

                            return (
                              <div key={option}>
                                <div className="flex justify-between text-sm mb-1">
                                  <span>{option}</span>
                                  <span className="text-muted-foreground">{count} ({percentage}%)</span>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-primary transition-all" 
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                          {Object.keys(question.option_counts).length === 0 && (
                            <p className="text-sm text-muted-foreground">No responses yet</p>
                          )}
                        </div>
                      )}

                      {(question.question_type === 'rating' || question.question_type === 'linear_scale') && (
                        <div>
                          {question.total_responses > 0 ? (
                            <div className="text-center">
                              <p className="text-3xl font-bold text-primary">
                                {question.average?.toFixed(1) || '0'}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Average {question.question_type === 'rating' ? 'Rating (out of 5)' : 'Score (out of 10)'}
                              </p>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">No responses yet</p>
                          )}
                        </div>
                      )}

                      {(question.question_type === 'text' || question.question_type === 'long_text') && (
                        <div className="space-y-2">
                          {question.text_responses?.length > 0 ? (
                            question.text_responses.map((text: string, i: number) => (
                              <div key={i} className="p-3 bg-muted rounded-md">
                                <p className="text-sm">{text}</p>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground">No responses yet</p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}

                {(!analytics?.questions || analytics.questions.length === 0) && (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      No questions found for this survey
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </ScrollArea>
        )}

        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={handleExportCSV} disabled={isLoading || !analytics?.total_responses}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}