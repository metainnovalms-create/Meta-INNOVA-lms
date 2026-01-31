import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AssessmentStatusBadge } from '@/components/assessment/AssessmentStatusBadge';
import { QuestionBuilder } from '@/components/assessment/QuestionBuilder';
import { QuestionList } from '@/components/assessment/QuestionList';
import { PublishingSelector } from '@/components/assessment/PublishingSelector';
import { PublishAssessmentDialog } from '@/components/assessment/PublishAssessmentDialog';
import { DuplicateAssessmentDialog } from '@/components/assessment/DuplicateAssessmentDialog';
import { CertificateSelector } from '@/components/gamification/CertificateSelector';
import { ManualAssessmentEntry } from '@/components/assessment/ManualAssessmentEntry';
import { CreateManualAssessment } from '@/components/assessment/CreateManualAssessment';
import { EditManualAssessmentDialog } from '@/components/assessment/EditManualAssessmentDialog';
import { AssessmentAnalytics } from '@/components/assessment/AssessmentAnalytics';
import { assessmentService } from '@/services/assessment.service';
import { Assessment, AssessmentQuestion, AssessmentPublishing } from '@/types/assessment';
import { getAssessmentStatus, formatDuration, calculateTotalPoints, formatDateTimeLocal, parseLocalToUTC } from '@/utils/assessmentHelpers';
import { Search, Plus, Clock, Award, Users, FileText, Edit, Trash2, Eye, Info, Loader2, ClipboardEdit, BarChart3, PlusCircle } from 'lucide-react';
import { toast } from 'sonner';
import { AssessmentDetailsDialog } from '@/components/assessment/AssessmentDetailsDialog';
import { useAuth } from '@/contexts/AuthContext';

export default function AssessmentManagement() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Create Assessment State
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [passPercentage, setPassPercentage] = useState([70]);
  const [autoSubmit, setAutoSubmit] = useState(true);
  const [autoEvaluate, setAutoEvaluate] = useState(true);
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [showResultsImmediately, setShowResultsImmediately] = useState(true);
  const [allowReview, setAllowReview] = useState(true);
  const [questions, setQuestions] = useState<Partial<AssessmentQuestion>[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<Partial<AssessmentQuestion> | null>(null);
  const [showQuestionBuilder, setShowQuestionBuilder] = useState(false);
  const [publishing, setPublishing] = useState<AssessmentPublishing[]>([]);
  const [certificateTemplateId, setCertificateTemplateId] = useState<string | undefined>(undefined);
  
  // Dialogs
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showCreateManual, setShowCreateManual] = useState(false);
  const [editManualDialogOpen, setEditManualDialogOpen] = useState(false);
  const [manualAssessmentToEdit, setManualAssessmentToEdit] = useState<Assessment | null>(null);

  // Load assessments from database
  useEffect(() => {
    loadAssessments();
  }, []);

  const loadAssessments = async () => {
    setIsLoading(true);
    const data = await assessmentService.getAssessments();
    setAssessments(data);
    setIsLoading(false);
  };

  const filteredAssessments = assessments.filter((assessment) => {
    const matchesSearch = assessment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assessment.description.toLowerCase().includes(searchTerm.toLowerCase());
    const currentStatus = getAssessmentStatus(assessment);
    const matchesFilter = filterStatus === 'all' || currentStatus === filterStatus || assessment.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const statusCounts = {
    all: assessments.length,
    draft: assessments.filter(a => a.status === 'draft').length,
    published: assessments.filter(a => a.status === 'published').length,
    unpublished: assessments.filter(a => a.status === 'unpublished').length,
    upcoming: assessments.filter(a => getAssessmentStatus(a) === 'upcoming').length,
    ongoing: assessments.filter(a => getAssessmentStatus(a) === 'ongoing').length,
    completed: assessments.filter(a => getAssessmentStatus(a) === 'completed').length
  };

  const handleAddQuestion = (question: Partial<AssessmentQuestion>) => {
    if (editingQuestion) {
      setQuestions(questions.map(q => q.id === question.id ? question : q));
      toast.success('Question updated');
    } else {
      const newQuestion = { 
        ...question, 
        id: `temp-${Date.now()}`,
        question_number: questions.length + 1 
      };
      setQuestions([...questions, newQuestion]);
      toast.success('Question added');
    }
    setEditingQuestion(null);
    setShowQuestionBuilder(false);
  };

  const handleDeleteQuestion = (questionId: string) => {
    setQuestions(questions.filter(q => q.id !== questionId));
    toast.success('Question deleted');
  };

  const handleCreateAssessment = async (isDraft: boolean) => {
    if (!title || !startTime || !endTime) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSaving(true);

    try {
      if (editingAssessment) {
        // Update existing assessment
        const success = await assessmentService.updateAssessment(editingAssessment.id, {
          title,
          description,
          start_time: parseLocalToUTC(startTime),
          end_time: parseLocalToUTC(endTime),
          duration_minutes: durationMinutes,
          pass_percentage: passPercentage[0],
          auto_submit: autoSubmit,
          auto_evaluate: autoEvaluate,
          shuffle_questions: shuffleQuestions,
          show_results_immediately: showResultsImmediately,
          allow_review_after_submission: allowReview,
          certificate_template_id: certificateTemplateId,
          status: isDraft ? 'draft' : 'published'
        });

        if (success) {
          // Update questions - delete old and add new
          const existingQuestions = await assessmentService.getQuestions(editingAssessment.id);
          for (const q of existingQuestions) {
            await assessmentService.deleteQuestion(q.id);
          }
          if (questions.length > 0) {
            await assessmentService.addQuestions(editingAssessment.id, questions);
          }

          // Publish if not draft
          if (!isDraft && publishing.length > 0) {
            await assessmentService.publishAssessment(editingAssessment.id, publishing);
          }

          toast.success('Assessment updated successfully');
        } else {
          toast.error('Failed to update assessment');
        }
      } else {
        // Create new assessment
        const assessment = await assessmentService.createAssessment({
          title,
          description,
          start_time: parseLocalToUTC(startTime),
          end_time: parseLocalToUTC(endTime),
          duration_minutes: durationMinutes,
          pass_percentage: passPercentage[0],
          auto_submit: autoSubmit,
          auto_evaluate: autoEvaluate,
          shuffle_questions: shuffleQuestions,
          show_results_immediately: showResultsImmediately,
          allow_review_after_submission: allowReview,
          certificate_template_id: certificateTemplateId,
          created_by: user?.id,
          created_by_role: 'system_admin',
          status: isDraft ? 'draft' : 'published'
        });

        if (assessment) {
          // Add questions
          if (questions.length > 0) {
            await assessmentService.addQuestions(assessment.id, questions);
          }

          // Publish if not draft
          if (!isDraft && publishing.length > 0) {
            await assessmentService.publishAssessment(assessment.id, publishing);
          }

          toast.success(isDraft ? 'Assessment saved as draft' : 'Assessment created and published');
        } else {
          toast.error('Failed to create assessment');
        }
      }

      // Reset form and reload
      resetForm();
      setActiveTab('all');
      await loadAssessments();
    } catch (error) {
      console.error('Error saving assessment:', error);
      toast.error('An error occurred while saving');
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setTitle('');
    setDescription('');
    setDurationMinutes(30);
    setStartTime('');
    setEndTime('');
    setPassPercentage([70]);
    setAutoSubmit(true);
    setAutoEvaluate(true);
    setShuffleQuestions(false);
    setShowResultsImmediately(true);
    setAllowReview(true);
    setQuestions([]);
    setPublishing([]);
    setCertificateTemplateId(undefined);
    setEditingAssessment(null);
  };

  // Helper to detect if an assessment is manual (duration_minutes = 0)
  const isManualAssessment = (assessment: Assessment): boolean => {
    return assessment.duration_minutes === 0;
  };

  const handleEditAssessment = async (assessment: Assessment) => {
    // Check if this is a manual assessment
    if (isManualAssessment(assessment)) {
      // Open the manual assessment edit dialog
      setManualAssessmentToEdit(assessment);
      setEditManualDialogOpen(true);
      return;
    }

    // Regular assessment edit flow
    setEditingAssessment(assessment);
    setTitle(assessment.title);
    setDescription(assessment.description);
    setDurationMinutes(assessment.duration_minutes);
    setStartTime(formatDateTimeLocal(assessment.start_time));
    setEndTime(formatDateTimeLocal(assessment.end_time));
    setPassPercentage([assessment.pass_percentage]);
    setAutoSubmit(assessment.auto_submit);
    setAutoEvaluate(assessment.auto_evaluate);
    setShuffleQuestions(assessment.shuffle_questions);
    setShowResultsImmediately(assessment.show_results_immediately);
    setAllowReview(assessment.allow_review_after_submission);
    setCertificateTemplateId(assessment.certificate_template_id);
    setPublishing(assessment.published_to);

    // Load questions
    const loadedQuestions = await assessmentService.getQuestions(assessment.id);
    setQuestions(loadedQuestions);

    setActiveTab('create');
    setStep(1);
  };

  const handleDeleteAssessment = async (assessmentId: string) => {
    if (!confirm('Are you sure you want to delete this assessment?')) return;

    const success = await assessmentService.deleteAssessment(assessmentId);
    if (success) {
      toast.success('Assessment deleted');
      await loadAssessments();
    } else {
      toast.error('Failed to delete assessment');
    }
  };

  const handlePublishConfirm = async (pub: AssessmentPublishing[]) => {
    if (!selectedAssessment) return;
    
    const success = await assessmentService.publishAssessment(selectedAssessment.id, pub);
    if (success) {
      toast.success('Assessment published');
      await loadAssessments();
    } else {
      toast.error('Failed to publish assessment');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Assessment Management</h1>
          <p className="text-muted-foreground">Create and manage MCQ-based assessments</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="all">All Assessments</TabsTrigger>
            <TabsTrigger value="create">Create Assessment</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            {/* Analytics View */}
            {showAnalytics && selectedAssessment ? (
              <AssessmentAnalytics 
                assessment={selectedAssessment} 
                onClose={() => { setShowAnalytics(false); setSelectedAssessment(null); }} 
              />
            ) : showCreateManual ? (
              <CreateManualAssessment 
                onComplete={() => { setShowCreateManual(false); loadAssessments(); }}
                onCancel={() => setShowCreateManual(false)}
              />
            ) : (
              <>
                {/* Action Buttons */}
                <div className="flex gap-4">
                  <Button onClick={() => setShowCreateManual(true)} variant="outline">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Create Manual Assessment
                  </Button>
                </div>

                {/* Summary Cards */}
            {/* Summary Cards */}
            <div className="grid grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{statusCounts.all}</div>
                  <p className="text-sm text-muted-foreground">Total</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{statusCounts.ongoing}</div>
                  <p className="text-sm text-muted-foreground">Ongoing</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{statusCounts.upcoming}</div>
                  <p className="text-sm text-muted-foreground">Upcoming</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{statusCounts.completed}</div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <div className="flex gap-2 flex-wrap">
              {['all', 'draft', 'published', 'unpublished', 'upcoming', 'ongoing', 'completed'].map((status) => (
                <Button
                  key={status}
                  variant={filterStatus === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus(status)}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Button>
              ))}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search assessments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Assessment Grid */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredAssessments.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No assessments found. Create your first assessment!
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredAssessments.map((assessment) => {
                  const currentStatus = getAssessmentStatus(assessment);
                  const totalInstitutions = assessment.published_to.length;
                  const totalClasses = assessment.published_to.reduce((sum, pub) => sum + pub.class_ids.length, 0);

                  return (
                    <Card key={assessment.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-3">
                            <div>
                              <div className="flex items-center gap-3">
                                <h3 className="text-lg font-semibold">{assessment.title}</h3>
                                <AssessmentStatusBadge status={currentStatus} />
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">{assessment.description}</p>
                            </div>

                            <div className="flex flex-wrap gap-4 text-sm">
                              <div className="flex items-center gap-1">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <span>{assessment.question_count} questions</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Award className="h-4 w-4 text-muted-foreground" />
                                <span>{assessment.total_points} points</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span>{formatDuration(assessment.duration_minutes)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <span>{totalInstitutions} institutions, {totalClasses} classes</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => { 
                                setSelectedAssessment(assessment); 
                                setShowAnalytics(true); 
                              }}
                              title="View Analytics"
                            >
                              <BarChart3 className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => { 
                                setSelectedAssessment(assessment); 
                                setViewDialogOpen(true); 
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleEditAssessment(assessment)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleDeleteAssessment(assessment.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
              </>
            )}
          </TabsContent>

          <TabsContent value="create" className="space-y-6">
            {editingAssessment && (
              <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      Editing: <strong>{editingAssessment.title}</strong>
                    </p>
                    <Button variant="outline" size="sm" onClick={resetForm}>
                      Cancel Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Step Indicator */}
            <div className="flex items-center justify-between mb-8">
              {[1, 2, 3, 4, 5].map((s) => (
                <div key={s} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    {s}
                  </div>
                  {s < 5 && <div className={`w-20 h-1 ${step > s ? 'bg-primary' : 'bg-muted'}`} />}
                </div>
              ))}
            </div>

            {/* Step 1: Basic Info */}
            {step === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle>{editingAssessment ? 'Edit' : 'Create'} Assessment - Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Title *</Label>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter assessment title" />
                  </div>
                  <div className="space-y-2">
                    <Label>Description *</Label>
                    <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Describe the assessment" />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Duration (minutes) *</Label>
                      <Input type="number" value={durationMinutes} onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 0)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Start Date & Time *</Label>
                      <Input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date & Time *</Label>
                      <Input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                    </div>
                  </div>

                  <CertificateSelector
                    category="assessment"
                    selectedTemplateId={certificateTemplateId}
                    onSelect={setCertificateTemplateId}
                  />

                  <Button onClick={() => setStep(2)} disabled={!title || !startTime || !endTime}>Next</Button>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Settings */}
            {step === 2 && (
              <Card>
                <CardHeader><CardTitle>Scoring & Settings</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Pass Percentage: {passPercentage[0]}%</Label>
                    <Slider value={passPercentage} onValueChange={setPassPercentage} max={100} step={5} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Auto Submit (when time expires)</Label>
                    <Switch checked={autoSubmit} onCheckedChange={setAutoSubmit} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Auto Evaluate (calculate score automatically)</Label>
                    <Switch checked={autoEvaluate} onCheckedChange={setAutoEvaluate} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Shuffle Questions</Label>
                    <Switch checked={shuffleQuestions} onCheckedChange={setShuffleQuestions} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Show Results Immediately</Label>
                    <Switch checked={showResultsImmediately} onCheckedChange={setShowResultsImmediately} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Allow Review After Submission</Label>
                    <Switch checked={allowReview} onCheckedChange={setAllowReview} />
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                    <Button onClick={() => setStep(3)}>Next</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Questions */}
            {step === 3 && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Add Questions ({questions.length} added)</CardTitle>
                      <Button onClick={() => { setEditingQuestion(null); setShowQuestionBuilder(true); }}>
                        <Plus className="h-4 w-4 mr-2" /> Add Question
                      </Button>
                    </div>
                  </CardHeader>
                </Card>

                {showQuestionBuilder && (
                  <QuestionBuilder
                    question={editingQuestion || undefined}
                    questionNumber={editingQuestion ? editingQuestion.question_number! : questions.length + 1}
                    onSave={handleAddQuestion}
                    onCancel={() => { setShowQuestionBuilder(false); setEditingQuestion(null); }}
                  />
                )}

                {!showQuestionBuilder && (
                  <QuestionList
                    questions={questions as AssessmentQuestion[]}
                    onEdit={(q) => { setEditingQuestion(q); setShowQuestionBuilder(true); }}
                    onDelete={handleDeleteQuestion}
                  />
                )}

                {!showQuestionBuilder && (
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
                    <Button onClick={() => setStep(4)} disabled={questions.length === 0}>Next</Button>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Publishing */}
            {step === 4 && (
              <Card>
                <CardHeader><CardTitle>Publishing</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  <PublishingSelector value={publishing} onChange={setPublishing} />
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setStep(3)}>Back</Button>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div>
                            <Button 
                              onClick={() => setStep(5)} 
                              disabled={publishing.length === 0}
                              className="gap-2"
                            >
                              {publishing.length === 0 && <Info className="h-4 w-4" />}
                              Next
                            </Button>
                          </div>
                        </TooltipTrigger>
                        {publishing.length === 0 && (
                          <TooltipContent side="top" className="max-w-xs">
                            <p className="font-medium">Cannot proceed</p>
                            <p className="text-sm text-muted-foreground">
                              Select at least one class from the institutions above to continue
                            </p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 5: Review */}
            {step === 5 && (
              <Card>
                <CardHeader><CardTitle>Review & Create</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div><strong>Title:</strong> {title}</div>
                    <div><strong>Duration:</strong> {formatDuration(durationMinutes)}</div>
                    <div><strong>Questions:</strong> {questions.length}</div>
                    <div><strong>Total Points:</strong> {calculateTotalPoints(questions as AssessmentQuestion[])}</div>
                    <div><strong>Pass Percentage:</strong> {passPercentage[0]}%</div>
                    <div><strong>Published To:</strong> {publishing.length} institutions</div>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setStep(4)}>Back</Button>
                    <Button onClick={() => handleCreateAssessment(false)} disabled={isSaving}>
                      {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                      {editingAssessment ? 'Update Assessment' : 'Create Assessment'}
                    </Button>
                    {!editingAssessment && (
                      <Button variant="outline" onClick={() => handleCreateAssessment(true)} disabled={isSaving}>
                        Save as Draft
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="manual" className="space-y-6">
            <ManualAssessmentEntry onComplete={loadAssessments} />
          </TabsContent>
        </Tabs>
      </div>

      {selectedAssessment && (
        <>
          <PublishAssessmentDialog
            open={publishDialogOpen}
            onOpenChange={setPublishDialogOpen}
            assessmentId={selectedAssessment.id}
            assessmentTitle={selectedAssessment.title}
            currentPublishing={selectedAssessment.published_to}
            onConfirm={handlePublishConfirm}
          />
          <DuplicateAssessmentDialog
            open={duplicateDialogOpen}
            onOpenChange={setDuplicateDialogOpen}
            assessmentId={selectedAssessment.id}
            assessmentTitle={selectedAssessment.title}
            onConfirm={() => { toast.success('Assessment duplicated'); loadAssessments(); }}
          />
        </>
      )}
      
      <AssessmentDetailsDialog
        assessment={selectedAssessment}
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
      />

      <EditManualAssessmentDialog
        open={editManualDialogOpen}
        onOpenChange={setEditManualDialogOpen}
        assessment={manualAssessmentToEdit}
        onSaved={() => {
          setManualAssessmentToEdit(null);
          loadAssessments();
        }}
      />
    </Layout>
  );
}
