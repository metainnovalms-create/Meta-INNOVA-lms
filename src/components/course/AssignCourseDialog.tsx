import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { Course, CourseAssignmentRequest } from '@/types/course';
import { toast } from 'sonner';

const assignCourseSchema = z.object({
  course_id: z.string().min(1, 'Course is required'),
  institution_id: z.string().min(1, 'Institution is required'),
  class_level: z.string().min(1, 'Class level is required'),
  officer_ids: z.array(z.string()).min(1, 'At least one officer is required'),
  primary_officer_id: z.string().min(1, 'Primary officer is required'),
  start_date: z.date({ required_error: 'Start date is required' }),
  end_date: z.date({ required_error: 'End date is required' }),
  max_enrollments: z.number().min(1).optional(),
}).refine(data => data.end_date > data.start_date, {
  message: 'End date must be after start date',
  path: ['end_date'],
}).refine(data => data.officer_ids.includes(data.primary_officer_id), {
  message: 'Primary officer must be one of the selected officers',
  path: ['primary_officer_id'],
});

type AssignCourseFormData = z.infer<typeof assignCourseSchema>;

interface AssignCourseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courses: Course[];
  onSubmit: (data: CourseAssignmentRequest) => Promise<void>;
}

// Mock data for institutions and officers
const mockInstitutions = [
  { id: '1', name: 'Central High School' },
  { id: '2', name: 'Westside Academy' },
  { id: '3', name: 'Eastview Institute' },
];

const mockOfficers = [
  { id: '1', name: 'John Smith', institution_id: '1' },
  { id: '2', name: 'Sarah Johnson', institution_id: '1' },
  { id: '3', name: 'Michael Brown', institution_id: '2' },
  { id: '4', name: 'Emily Davis', institution_id: '2' },
  { id: '5', name: 'David Wilson', institution_id: '3' },
  { id: '6', name: 'Jessica Martinez', institution_id: '3' },
];

export function AssignCourseDialog({ open, onOpenChange, courses, onSubmit }: AssignCourseDialogProps) {
  const [loading, setLoading] = useState(false);
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<string>('');
  const [availableOfficers, setAvailableOfficers] = useState<typeof mockOfficers>([]);

  const form = useForm<AssignCourseFormData>({
    resolver: zodResolver(assignCourseSchema),
    defaultValues: {
      officer_ids: [],
    },
  });

  const selectedOfficerIds = form.watch('officer_ids');

  useEffect(() => {
    if (selectedInstitutionId) {
      const officers = mockOfficers.filter(o => o.institution_id === selectedInstitutionId);
      setAvailableOfficers(officers);
      form.setValue('officer_ids', []);
      form.setValue('primary_officer_id', '');
    }
  }, [selectedInstitutionId, form]);

  const handleOfficerToggle = (officerId: string) => {
    const currentOfficers = form.getValues('officer_ids');
    const newOfficers = currentOfficers.includes(officerId)
      ? currentOfficers.filter(id => id !== officerId)
      : [...currentOfficers, officerId];
    form.setValue('officer_ids', newOfficers);
    
    // Reset primary officer if they're removed
    if (!newOfficers.includes(form.getValues('primary_officer_id'))) {
      form.setValue('primary_officer_id', '');
    }
  };

  const handleSubmit = async (data: AssignCourseFormData) => {
    setLoading(true);
    try {
      await onSubmit({
        ...data,
        start_date: data.start_date.toISOString(),
        end_date: data.end_date.toISOString(),
      } as CourseAssignmentRequest);
      form.reset();
      setSelectedInstitutionId('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Assign Course to Institution</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="course_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
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
              name="institution_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Institution</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value);
                      setSelectedInstitutionId(value);
                    }} 
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an institution" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {mockInstitutions.map((institution) => (
                        <SelectItem key={institution.id} value={institution.id}>
                          {institution.name}
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
              name="class_level"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Class Level</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select class level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {[...Array(12)].map((_, i) => (
                        <SelectItem key={i + 1} value={`Class ${i + 1}`}>
                          Class {i + 1}
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
              name="officer_ids"
              render={() => (
                <FormItem>
                  <FormLabel>Assign Officers</FormLabel>
                  <FormDescription>Select officers who will manage this course</FormDescription>
                  {availableOfficers.length > 0 ? (
                    <div className="space-y-2 border rounded-md p-4 max-h-40 overflow-y-auto">
                      {availableOfficers.map((officer) => (
                        <div key={officer.id} className="flex items-center space-x-2">
                          <Checkbox
                            checked={selectedOfficerIds.includes(officer.id)}
                            onCheckedChange={() => handleOfficerToggle(officer.id)}
                          />
                          <label className="text-sm cursor-pointer" onClick={() => handleOfficerToggle(officer.id)}>
                            {officer.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Select an institution first</p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="primary_officer_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Primary Officer</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value}
                    disabled={selectedOfficerIds.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select primary officer" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableOfficers
                        .filter(o => selectedOfficerIds.includes(o.id))
                        .map((officer) => (
                          <SelectItem key={officer.id} value={officer.id}>
                            {officer.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>Main officer responsible for the course</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
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
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus className="pointer-events-auto" />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date</FormLabel>
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
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus className="pointer-events-auto" />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="max_enrollments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maximum Enrollments (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="No limit" 
                      {...field} 
                      onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)} 
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormDescription>Leave empty for unlimited enrollments</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Assigning...' : 'Assign Course'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
