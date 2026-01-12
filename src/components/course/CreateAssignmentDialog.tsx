import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarIcon, Plus, Trash2, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Course, Assignment, AssignmentQuestion } from '@/types/course';
import { AddAssignmentQuestionDialog } from './AddAssignmentQuestionDialog';

const assignmentSchema = z.object({
  course_id: z.string().min(1, 'Course is required'),
  module_id: z.string().min(1, 'Level is required'),
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().min(1, 'Description is required'),
  assignment_type: z.enum(['traditional', 'timed_questions']),
  due_date: z.date().optional(),
  total_points: z.number().min(1, 'Points must be greater than 0'),
  submission_type: z.enum(['file', 'text', 'url']).optional(),
  allow_late_submission: z.boolean().default(false),
  late_penalty_percentage: z.number().min(0).max(100).optional(),
});

type AssignmentFormData = z.infer<typeof assignmentSchema>;

interface CreateAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courses: Course[];
  modules: { course_id: string; id: string; title: string; }[];
  onSubmit: (data: Partial<Assignment>) => Promise<void>;
}

export function CreateAssignmentDialog({ open, onOpenChange, courses, modules, onSubmit }: CreateAssignmentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [createdAssignment, setCreatedAssignment] = useState<Assignment | null>(null);
  const [questions, setQuestions] = useState<Partial<AssignmentQuestion>[]>([]);
  const [showQuestionDialog, setShowQuestionDialog] = useState(false);

  const form = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      assignment_type: 'traditional',
      allow_late_submission: false,
      late_penalty_percentage: 0,
    },
  });

  const courseModules = modules.filter(m => m.course_id === selectedCourseId);
  const allowLateSubmission = form.watch('allow_late_submission');
  const assignmentType = form.watch('assignment_type');

  const totalEstimatedTime = questions.reduce((sum, q) => sum + (q.time_limit_seconds || 0), 0);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  };

  const handleSubmit = async (data: AssignmentFormData) => {
    setLoading(true);
    try {
      const assignmentData: Partial<Assignment> = {
        ...data,
        due_date: data.due_date?.toISOString(),
        has_questions: data.assignment_type === 'timed_questions',
        total_time_seconds: data.assignment_type === 'timed_questions' ? totalEstimatedTime : undefined,
      };

      await onSubmit(assignmentData);
      
      // If timed assignment, show question management
      if (data.assignment_type === 'timed_questions') {
        // Mock created assignment
        const mockAssignment: Assignment = {
          id: `assign-${Date.now()}`,
          ...assignmentData,
          created_at: new Date().toISOString(),
        } as Assignment;
        setCreatedAssignment(mockAssignment);
      } else {
        form.reset();
        setSelectedCourseId('');
        setQuestions([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = async (questionData: Partial<AssignmentQuestion>) => {
    setQuestions([...questions, questionData]);
    setShowQuestionDialog(false);
  };

  const handleDeleteQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleFinish = () => {
    form.reset();
    setSelectedCourseId('');
    setQuestions([]);
    setCreatedAssignment(null);
    onOpenChange(false);
  };

  // Question management view (after creating timed assignment)
  if (createdAssignment) {
    return (
      <>
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Manage Assignment Questions</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold mb-2">📝 {createdAssignment.title}</h3>
                <p className="text-sm text-muted-foreground">{createdAssignment.description}</p>
                <div className="flex gap-4 mt-2 text-sm">
                  <span>📊 Total Points: {createdAssignment.total_points}</span>
                  {questions.length > 0 && (
                    <span>⏱️ Estimated Time: {formatTime(totalEstimatedTime)}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Questions ({questions.length})</h3>
                <Button onClick={() => setShowQuestionDialog(true)} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Question
                </Button>
              </div>

              {questions.length === 0 ? (
                <div className="text-center py-12 border rounded-lg bg-muted/20">
                  <p className="text-muted-foreground">No questions added yet.</p>
                  <p className="text-sm text-muted-foreground mt-1">Click "Add Question" to start building your timed assignment.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {questions.map((q, idx) => (
                    <div key={idx} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">Q{idx + 1}</Badge>
                            <Badge>{q.question_type?.toUpperCase().replace('_', ' ')}</Badge>
                            <Badge variant="secondary">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatTime(q.time_limit_seconds || 0)}
                            </Badge>
                          </div>
                          <p className="font-medium mb-1">{q.question_text}</p>
                          <p className="text-sm text-muted-foreground">Points: {q.points}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteQuestion(idx)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleFinish}>
                Finish Later
              </Button>
              <Button onClick={handleFinish} disabled={questions.length === 0}>
                Complete Assignment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AddAssignmentQuestionDialog
          open={showQuestionDialog}
          onOpenChange={setShowQuestionDialog}
          assignmentId={createdAssignment.id}
          orderNumber={questions.length + 1}
          onSubmit={handleAddQuestion}
        />
      </>
    );
  }

  // Initial assignment creation form
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Assignment</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="course_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value);
                      setSelectedCourseId(value);
                      form.setValue('module_id', '');
                    }} 
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a course" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="module_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Level</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={!selectedCourseId}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {courseModules.map((module) => (
                        <SelectItem key={module.id} value={module.id}>
                          {module.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="assignment_type"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Assignment Type</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="grid grid-cols-2 gap-4"
                    >
                      <div className={cn(
                        "flex items-center space-x-2 p-4 border rounded-lg cursor-pointer hover:bg-accent",
                        field.value === 'traditional' && "border-primary bg-accent"
                      )}>
                        <RadioGroupItem value="traditional" id="traditional" />
                        <label htmlFor="traditional" className="flex-1 cursor-pointer">
                          <div className="font-medium">📝 Traditional</div>
                          <p className="text-xs text-muted-foreground">File/text submission with due date</p>
                        </label>
                      </div>
                      <div className={cn(
                        "flex items-center space-x-2 p-4 border rounded-lg cursor-pointer hover:bg-accent",
                        field.value === 'timed_questions' && "border-primary bg-accent"
                      )}>
                        <RadioGroupItem value="timed_questions" id="timed_questions" />
                        <label htmlFor="timed_questions" className="flex-1 cursor-pointer">
                          <div className="font-medium">⏱️ Timed Assessment</div>
                          <p className="text-xs text-muted-foreground">Questions with per-question timers</p>
                        </label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assignment Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter assignment title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter assignment description" rows={4} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="total_points"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Points</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="100" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {assignmentType === 'traditional' && (
              <>
                <FormField
                  control={form.control}
                  name="due_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Due Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button variant="outline" className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                              {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date < new Date()} initialFocus className="pointer-events-auto" />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="submission_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Submission Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select submission type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="file">File Upload</SelectItem>
                          <SelectItem value="text">Text Response</SelectItem>
                          <SelectItem value="url">URL Link</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="allow_late_submission"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Allow Late Submission</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                {allowLateSubmission && (
                  <FormField
                    control={form.control}
                    name="late_penalty_percentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Late Penalty Percentage</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="10" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </>
            )}

            {assignmentType === 'timed_questions' && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  ℹ️ After creating the assignment, you'll be able to add timed questions with individual time limits for each question.
                </p>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : assignmentType === 'timed_questions' ? 'Create & Add Questions' : 'Create Assignment'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
