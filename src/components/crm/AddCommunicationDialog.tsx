import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon, Upload, X, Loader2, User } from 'lucide-react';
import { CommunicationLog, CreateCommunicationLogInput } from '@/types/communicationLog';

const communicationSchema = z.object({
  institution_id: z.string().min(1, 'Institution is required'),
  institution_name: z.string().min(1, 'Institution name is required'),
  type: z.enum(['call', 'email', 'meeting', 'visit', 'follow_up']),
  date: z.date({
    required_error: 'Date is required',
  }),
  subject: z.string().min(5, 'Subject must be at least 5 characters').max(200, 'Subject must be less than 200 characters'),
  contact_person: z.string().min(2, 'Contact person is required'),
  contact_role: z.string().min(2, 'Contact role is required'),
  notes: z.string().min(10, 'Notes must be at least 10 characters').max(1000, 'Notes must be less than 1000 characters'),
  priority: z.enum(['high', 'medium', 'low']),
  status: z.enum(['completed', 'pending', 'follow_up_required']),
  next_action: z.string().optional(),
  next_action_date: z.date().optional(),
}).refine((data) => {
  if (data.status !== 'completed') {
    return data.next_action && data.next_action_date;
  }
  return true;
}, {
  message: 'Next action and date are required when status is not completed',
  path: ['next_action'],
});

type CommunicationFormValues = z.infer<typeof communicationSchema>;

interface AddCommunicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (log: Omit<CommunicationLog, 'id' | 'created_at' | 'updated_at'>) => void;
  institutions: Array<{ id: string; name: string }>;
  currentUser: { id: string; name: string } | null;
}

export function AddCommunicationDialog({
  open,
  onOpenChange,
  onSave,
  institutions,
  currentUser,
}: AddCommunicationDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CommunicationFormValues>({
    resolver: zodResolver(communicationSchema),
    defaultValues: {
      type: 'call',
      date: new Date(),
      priority: 'medium',
      status: 'completed',
    },
  });

  const watchStatus = form.watch('status');
  const watchNotes = form.watch('notes');

  const handleInstitutionChange = (value: string) => {
    const institution = institutions.find((i) => i.id === value);
    if (institution) {
      form.setValue('institution_name', institution.name);
    }
  };

  const onSubmit = async (data: CommunicationFormValues) => {
    if (!currentUser) {
      return;
    }
    
    setIsSubmitting(true);
    try {
      const newLog: Omit<CommunicationLog, 'id' | 'created_at' | 'updated_at'> = {
        institution_id: data.institution_id,
        institution_name: data.institution_name,
        date: data.date.toISOString(),
        type: data.type,
        subject: data.subject,
        notes: data.notes,
        contact_person: data.contact_person,
        contact_role: data.contact_role,
        conducted_by_id: currentUser.id,
        conducted_by_name: currentUser.name,
        next_action: data.next_action || null,
        next_action_date: data.next_action_date?.toISOString() || null,
        priority: data.priority,
        status: data.status,
      };

      await onSave(newLog);
      form.reset();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [open, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log New Communication</DialogTitle>
          <DialogDescription>
            Record details of your communication with an institution
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Conducted By (Read-only - current user) */}
            <div className="p-3 bg-muted rounded-lg flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Logged by</p>
                <p className="text-sm text-muted-foreground">
                  {currentUser?.name || 'Loading...'}
                </p>
              </div>
            </div>

            {/* Institution Selection */}
            <FormField
              control={form.control}
              name="institution_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Institution *</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      handleInstitutionChange(value);
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select institution" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {institutions.length === 0 ? (
                        <SelectItem value="no-institutions" disabled>
                          No institutions available
                        </SelectItem>
                      ) : (
                        institutions.map((inst) => (
                          <SelectItem key={inst.id} value={inst.id}>
                            {inst.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Communication Type */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Communication Type *</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="flex flex-wrap gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="call" id="call" />
                          <Label htmlFor="call">Call</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="email" id="email" />
                          <Label htmlFor="email">Email</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="meeting" id="meeting" />
                          <Label htmlFor="meeting">Meeting</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="visit" id="visit" />
                          <Label htmlFor="visit">Visit</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="follow_up" id="follow_up" />
                          <Label htmlFor="follow_up">Follow-up</Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Date & Time */}
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date & Time *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'PPP')
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Subject */}
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject *</FormLabel>
                  <FormControl>
                    <Input placeholder="Brief subject of communication" {...field} />
                  </FormControl>
                  <FormDescription>
                    {field.value?.length || 0}/200 characters
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Contact Person */}
              <FormField
                control={form.control}
                name="contact_person"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Person *</FormLabel>
                    <FormControl>
                      <Input placeholder="Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Contact Role */}
              <FormField
                control={form.control}
                name="contact_role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Role *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Principal, IT Head" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Priority */}
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="follow_up_required">Follow-up Required</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Communication Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Communication Notes *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detailed notes about the conversation..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {watchNotes?.length || 0}/1000 characters (minimum 10)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Next Action (conditional) */}
            {watchStatus !== 'completed' && (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                <h4 className="font-medium">Next Action Required</h4>
                
                <FormField
                  control={form.control}
                  name="next_action"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Action Description *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the next action to be taken..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="next_action_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Due Date *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                'w-full pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              {field.value ? (
                                format(field.value, 'PPP')
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset();
                  onOpenChange(false);
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !currentUser}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save & Log'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
