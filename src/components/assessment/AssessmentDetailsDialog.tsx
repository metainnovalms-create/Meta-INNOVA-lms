import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Assessment } from '@/types/assessment';
import { AssessmentStatusBadge } from './AssessmentStatusBadge';
import { Calendar, Clock, FileText, Award, Users, Building, CheckCircle, Settings } from 'lucide-react';
import { format } from 'date-fns';
import { formatDuration, getAssessmentStatus } from '@/utils/assessmentHelpers';

interface AssessmentDetailsDialogProps {
  assessment: Assessment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssessmentDetailsDialog({ assessment, open, onOpenChange }: AssessmentDetailsDialogProps) {
  if (!assessment) return null;

  const currentStatus = getAssessmentStatus(assessment);
  const totalInstitutions = assessment.published_to.length;
  const totalClasses = assessment.published_to.reduce((sum, pub) => sum + pub.class_ids.length, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-2xl">{assessment.title}</DialogTitle>
              <DialogDescription className="mt-2">{assessment.description}</DialogDescription>
            </div>
            <AssessmentStatusBadge status={currentStatus} />
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <div className="space-y-6 pr-4">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Assessment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Duration:</span>
                    <span className="font-medium">{formatDuration(assessment.duration_minutes)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Award className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Total Points:</span>
                    <span className="font-medium">{assessment.total_points}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Questions:</span>
                    <span className="font-medium">{assessment.question_count}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Award className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Pass Percentage:</span>
                    <span className="font-medium">{assessment.pass_percentage}%</span>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1 text-sm">
                    <span className="text-muted-foreground">Start Time:</span>
                    <span className="font-medium">{format(new Date(assessment.start_time), 'MMM dd, yyyy HH:mm')}</span>
                  </div>
                  <div className="flex flex-col gap-1 text-sm">
                    <span className="text-muted-foreground">End Time:</span>
                    <span className="font-medium">{format(new Date(assessment.end_time), 'MMM dd, yyyy HH:mm')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Assessment Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm">Auto Submit</span>
                    <Badge variant={assessment.auto_submit ? "default" : "secondary"}>
                      {assessment.auto_submit ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm">Auto Evaluate</span>
                    <Badge variant={assessment.auto_evaluate ? "default" : "secondary"}>
                      {assessment.auto_evaluate ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm">Shuffle Questions</span>
                    <Badge variant={assessment.shuffle_questions ? "default" : "secondary"}>
                      {assessment.shuffle_questions ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm">Show Results Immediately</span>
                    <Badge variant={assessment.show_results_immediately ? "default" : "secondary"}>
                      {assessment.show_results_immediately ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg col-span-2">
                    <span className="text-sm">Allow Review After Submission</span>
                    <Badge variant={assessment.allow_review_after_submission ? "default" : "secondary"}>
                      {assessment.allow_review_after_submission ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Questions */}
            {assessment.questions && assessment.questions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Questions ({assessment.questions.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {assessment.questions.map((q) => (
                      <div key={q.id} className="p-4 border rounded-lg space-y-3">
                        <div className="flex justify-between items-start">
                          <p className="font-medium">
                            {q.question_number}. {q.question_text}
                          </p>
                          <Badge variant="outline">{q.points} pts</Badge>
                        </div>
                        
                        {q.image_url && (
                          <div className="mt-2">
                            <Badge variant="secondary" className="text-xs">Has Image</Badge>
                          </div>
                        )}
                        
                        {q.code_snippet && (
                          <div className="mt-2 p-3 bg-muted rounded-md">
                            <code className="text-xs">{q.code_snippet}</code>
                          </div>
                        )}

                        <div className="ml-4 space-y-2">
                          {q.options.map((option) => (
                            <div 
                              key={option.id} 
                              className={`text-sm flex items-center gap-2 p-2 rounded ${
                                option.id === q.correct_option_id ? 'bg-green-50 dark:bg-green-950' : ''
                              }`}
                            >
                              <span className="font-medium text-muted-foreground">{option.option_label})</span>
                              <span>{option.option_text}</span>
                              {option.id === q.correct_option_id && (
                                <CheckCircle className="h-4 w-4 text-green-500 ml-auto" />
                              )}
                            </div>
                          ))}
                        </div>

                        {q.explanation && (
                          <div className="mt-3 p-3 bg-muted/50 rounded-md">
                            <p className="text-xs font-semibold mb-1">Explanation:</p>
                            <p className="text-xs text-muted-foreground">{q.explanation}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Publishing Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Published To
                </CardTitle>
              </CardHeader>
              <CardContent>
                {assessment.published_to.length > 0 ? (
                  <div className="space-y-3">
                    {assessment.published_to.map((pub) => (
                      <div key={pub.institution_id} className="p-3 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{pub.institution_name}</p>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {pub.class_names.map((className, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {className}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {pub.class_ids.length} {pub.class_ids.length === 1 ? 'class' : 'classes'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    <div className="text-sm text-muted-foreground text-center pt-2">
                      <Users className="h-4 w-4 inline mr-1" />
                      {totalInstitutions} {totalInstitutions === 1 ? 'institution' : 'institutions'}, {totalClasses} {totalClasses === 1 ? 'class' : 'classes'}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">Not published yet</p>
                )}
              </CardContent>
            </Card>

            {/* Metadata */}
            <Card>
              <CardContent className="pt-6">
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Created by: {assessment.created_by} ({assessment.created_by_role})</p>
                  <p>Created at: {format(new Date(assessment.created_at), 'MMM dd, yyyy HH:mm')}</p>
                  <p>Last updated: {format(new Date(assessment.updated_at), 'MMM dd, yyyy HH:mm')}</p>
                  {assessment.institution_id && (
                    <p>Institution ID: {assessment.institution_id}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
