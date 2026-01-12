import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Plus, Trash2, GripVertical, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Survey, SurveyQuestion } from '@/services/survey.service';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface CreateSurveyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (survey: Survey, questions: SurveyQuestion[]) => void;
}

export function CreateSurveyDialog({ open, onOpenChange, onSubmit }: CreateSurveyDialogProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    target_audience: 'all_students' as 'all_students' | 'specific_institution' | 'specific_class',
    institution_id: '',
    target_class_ids: [] as string[],
    questions: [] as Array<{
      question_text: string;
      question_type: 'mcq' | 'multiple_select' | 'rating' | 'text' | 'long_text' | 'linear_scale';
      options: string[];
      is_required: boolean;
      scale_min?: number;
      scale_max?: number;
    }>
  });

  const [currentQuestion, setCurrentQuestion] = useState({
    question_text: '',
    question_type: 'mcq' as 'mcq' | 'multiple_select' | 'rating' | 'text' | 'long_text' | 'linear_scale',
    options: [''],
    is_required: true
  });

  // Fetch institutions from database
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

  // Fetch classes for selected institution
  const { data: classes = [] } = useQuery({
    queryKey: ['classes', formData.institution_id],
    queryFn: async () => {
      if (!formData.institution_id) return [];
      const { data, error } = await supabase
        .from('classes')
        .select('id, class_name, section')
        .eq('institution_id', formData.institution_id)
        .order('class_name');
      if (error) throw error;
      return data;
    },
    enabled: !!formData.institution_id,
  });

  const handleNext = () => {
    if (step === 1) {
      if (!formData.title || !formData.description) {
        toast.error('Please fill in title and description');
        return;
      }
    }
    if (step === 2) {
      if (formData.target_audience === 'specific_institution' && !formData.institution_id) {
        toast.error('Please select an institution');
        return;
      }
      if (formData.target_audience === 'specific_class' && formData.target_class_ids.length === 0) {
        toast.error('Please select at least one class');
        return;
      }
    }
    if (step === 3) {
      if (formData.questions.length === 0) {
        toast.error('Please add at least one question');
        return;
      }
    }
    setStep(step + 1);
  };

  const handleBack = () => setStep(step - 1);

  const handleAddQuestion = () => {
    if (!currentQuestion.question_text) {
      toast.error('Please enter a question');
      return;
    }
    if ((currentQuestion.question_type === 'mcq' || currentQuestion.question_type === 'multiple_select') && 
        currentQuestion.options.filter(o => o).length < 2) {
      toast.error('Please add at least 2 options');
      return;
    }

    setFormData({
      ...formData,
      questions: [...formData.questions, {
        question_text: currentQuestion.question_text,
        question_type: currentQuestion.question_type,
        options: currentQuestion.options.filter(o => o),
        is_required: currentQuestion.is_required,
        scale_min: currentQuestion.question_type === 'linear_scale' ? 1 : undefined,
        scale_max: currentQuestion.question_type === 'linear_scale' ? 10 : undefined,
      }]
    });
    
    setCurrentQuestion({
      question_text: '',
      question_type: 'mcq',
      options: [''],
      is_required: true
    });
    toast.success('Question added');
  };

  const handleRemoveQuestion = (index: number) => {
    setFormData({
      ...formData,
      questions: formData.questions.filter((_, i) => i !== index)
    });
  };

  const handleAddOption = () => {
    setCurrentQuestion({
      ...currentQuestion,
      options: [...currentQuestion.options, '']
    });
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...currentQuestion.options];
    newOptions[index] = value;
    setCurrentQuestion({ ...currentQuestion, options: newOptions });
  };

  const handleRemoveOption = (index: number) => {
    setCurrentQuestion({
      ...currentQuestion,
      options: currentQuestion.options.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = () => {
    setIsSubmitting(true);

    const survey: Survey = {
      title: formData.title,
      description: formData.description,
      created_by_name: 'System Admin',
      deadline: formData.deadline.toISOString(),
      target_audience: formData.target_audience,
      institution_id: formData.target_audience === 'specific_institution' ? formData.institution_id : null,
      target_class_ids: formData.target_audience === 'specific_class' ? formData.target_class_ids : [],
      status: 'active',
    };

    const questions: SurveyQuestion[] = formData.questions.map((q, index) => ({
      question_text: q.question_text,
      question_type: q.question_type,
      options: q.options,
      is_required: q.is_required,
      scale_min: q.scale_min,
      scale_max: q.scale_max,
      display_order: index,
    }));

    onSubmit(survey, questions);
    
    // Reset form
    setFormData({
      title: '',
      description: '',
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      target_audience: 'all_students',
      institution_id: '',
      target_class_ids: [],
      questions: []
    });
    setStep(1);
    setIsSubmitting(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Create New Survey</DialogTitle>
          <DialogDescription>
            Step {step} of 4: {step === 1 ? 'Basic Information' : step === 2 ? 'Target Audience' : step === 3 ? 'Add Questions' : 'Review & Publish'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          {step === 1 && (
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="title">Survey Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Course Feedback Survey"
                />
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the survey purpose..."
                  rows={3}
                />
              </div>

              <div>
                <Label>Deadline *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(formData.deadline, 'PPP')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.deadline}
                      onSelect={(date) => date && setFormData({ ...formData, deadline: date })}
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 py-4">
              <div>
                <Label>Target Audience *</Label>
                <RadioGroup
                  value={formData.target_audience}
                  onValueChange={(value: any) => setFormData({ ...formData, target_audience: value, institution_id: '', target_class_ids: [] })}
                  className="space-y-3 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="all_students" id="all_students" />
                    <Label htmlFor="all_students" className="cursor-pointer">All Students (All Institutions)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="specific_institution" id="specific_institution" />
                    <Label htmlFor="specific_institution" className="cursor-pointer">Specific Institution</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="specific_class" id="specific_class" />
                    <Label htmlFor="specific_class" className="cursor-pointer">Specific Classes</Label>
                  </div>
                </RadioGroup>
              </div>

              {(formData.target_audience === 'specific_institution' || formData.target_audience === 'specific_class') && (
                <div>
                  <Label htmlFor="institution">Select Institution *</Label>
                  <Select
                    value={formData.institution_id}
                    onValueChange={(value) => setFormData({ ...formData, institution_id: value, target_class_ids: [] })}
                  >
                    <SelectTrigger id="institution">
                      <SelectValue placeholder="Select institution" />
                    </SelectTrigger>
                    <SelectContent>
                      {institutions.map((inst: any) => (
                        <SelectItem key={inst.id} value={inst.id}>
                          {inst.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formData.target_audience === 'specific_class' && formData.institution_id && (
                <div>
                  <Label>Select Classes *</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {classes.map((cls: any) => (
                      <div key={cls.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={cls.id}
                          checked={formData.target_class_ids.includes(cls.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFormData({ ...formData, target_class_ids: [...formData.target_class_ids, cls.id] });
                            } else {
                              setFormData({ ...formData, target_class_ids: formData.target_class_ids.filter(id => id !== cls.id) });
                            }
                          }}
                        />
                        <Label htmlFor={cls.id} className="cursor-pointer">
                          {cls.class_name} {cls.section && `- ${cls.section}`}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 py-4">
              {formData.questions.length > 0 && (
                <div className="space-y-3 mb-6">
                  <Label>Added Questions ({formData.questions.length})</Label>
                  {formData.questions.map((q, index) => (
                    <div key={index} className="flex items-start gap-2 p-3 border rounded-md bg-muted/30">
                      <GripVertical className="h-5 w-5 text-muted-foreground mt-1" />
                      <div className="flex-1">
                        <p className="font-medium">{index + 1}. {q.question_text}</p>
                        <Badge variant="outline" className="mt-1">{q.question_type}</Badge>
                        {q.is_required && <Badge variant="secondary" className="ml-2">Required</Badge>}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveQuestion(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="border rounded-lg p-4 space-y-4 bg-background">
                <Label className="text-base">Add New Question</Label>
                
                <div>
                  <Label htmlFor="question">Question Text *</Label>
                  <Input
                    id="question"
                    value={currentQuestion.question_text}
                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, question_text: e.target.value })}
                    placeholder="Enter your question..."
                  />
                </div>

                <div>
                  <Label htmlFor="type">Question Type *</Label>
                  <Select
                    value={currentQuestion.question_type}
                    onValueChange={(value: any) => setCurrentQuestion({ ...currentQuestion, question_type: value })}
                  >
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mcq">Multiple Choice (Single)</SelectItem>
                      <SelectItem value="multiple_select">Multiple Choice (Multiple)</SelectItem>
                      <SelectItem value="text">Short Text</SelectItem>
                      <SelectItem value="long_text">Long Text</SelectItem>
                      <SelectItem value="rating">Rating (1-5 stars)</SelectItem>
                      <SelectItem value="linear_scale">Linear Scale (1-10)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(currentQuestion.question_type === 'mcq' || currentQuestion.question_type === 'multiple_select') && (
                  <div>
                    <Label>Options *</Label>
                    <div className="space-y-2 mt-2">
                      {currentQuestion.options.map((option, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={option}
                            onChange={(e) => handleOptionChange(index, e.target.value)}
                            placeholder={`Option ${index + 1}`}
                          />
                          {currentQuestion.options.length > 1 && (
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleRemoveOption(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button variant="outline" size="sm" onClick={handleAddOption} className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Option
                      </Button>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="required"
                    checked={currentQuestion.is_required}
                    onCheckedChange={(checked: boolean) => setCurrentQuestion({ ...currentQuestion, is_required: checked })}
                  />
                  <Label htmlFor="required" className="cursor-pointer">Required question</Label>
                </div>

                <Button onClick={handleAddQuestion} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Question to Survey
                </Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4 py-4">
              <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
                <div>
                  <Label className="text-sm text-muted-foreground">Title</Label>
                  <p className="font-medium">{formData.title}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Description</Label>
                  <p>{formData.description}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Deadline</Label>
                  <p>{format(formData.deadline, 'PPP')}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Target Audience</Label>
                  <div className="flex gap-2 mt-1">
                    {formData.target_audience === 'all_students' && <Badge>All Students</Badge>}
                    {formData.target_audience === 'specific_institution' && (
                      <Badge>{institutions.find((i: any) => i.id === formData.institution_id)?.name}</Badge>
                    )}
                    {formData.target_audience === 'specific_class' && (
                      <Badge>{formData.target_class_ids.length} classes selected</Badge>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Questions</Label>
                  <p className="font-medium">{formData.questions.length} questions added</p>
                </div>
              </div>
            </div>
          )}
        </ScrollArea>

        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          {step < 4 ? (
            <Button onClick={handleNext}>
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Publish Survey
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
