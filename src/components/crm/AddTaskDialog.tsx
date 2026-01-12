import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CRMTask } from "@/hooks/useCRMTasks";
import { supabase } from "@/integrations/supabase/client";
import { AssigneeSelector } from "@/components/task/AssigneeSelector";

const taskSchema = z.object({
  institution_id: z.string().min(1, "Institution is required"),
  institution_name: z.string().min(1, "Institution name is required"),
  task_type: z.enum(['renewal_reminder', 'follow_up', 'payment_reminder', 'meeting_scheduled', 'support_ticket']),
  description: z.string().min(10, "Description must be at least 10 characters").max(500),
  assigned_to: z.string().min(1, "Assignee is required"),
  assigned_to_id: z.string().optional(),
  due_date: z.string().min(1, "Due date is required"),
  priority: z.enum(['high', 'medium', 'low']),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']),
  notes: z.string().optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface AddTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (task: Omit<CRMTask, 'id' | 'created_at' | 'updated_at' | 'completed_at'>) => void;
  institutions: { id: string; name: string }[];
}

export function AddTaskDialog({ open, onOpenChange, onSave, institutions }: AddTaskDialogProps) {
  const [dueDate, setDueDate] = useState<Date>();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [selectedAssignee, setSelectedAssignee] = useState<string>('');

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    };
    getUser();
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      task_type: 'follow_up',
      priority: 'medium',
      status: 'pending',
    },
  });

  const onSubmit = (data: TaskFormData) => {
    const newTask: Omit<CRMTask, 'id' | 'created_at' | 'updated_at' | 'completed_at'> = {
      institution_id: data.institution_id,
      institution_name: data.institution_name,
      task_type: data.task_type,
      description: data.description,
      due_date: data.due_date,
      assigned_to: data.assigned_to,
      priority: data.priority,
      status: data.status,
      notes: data.notes || null,
      created_by: currentUserId,
    };

    onSave(newTask);
    handleClose();
  };

  const handleClose = () => {
    reset();
    setDueDate(undefined);
    setSelectedAssignee('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>
            Add a new task or reminder for client relationship management.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Task Type */}
          <div className="space-y-2">
            <Label htmlFor="task_type">Task Type *</Label>
            <Select 
              onValueChange={(value) => setValue("task_type", value as any)} 
              defaultValue="follow_up"
            >
              <SelectTrigger>
                <SelectValue placeholder="Select task type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="renewal_reminder">🔔 Renewal Reminder</SelectItem>
                <SelectItem value="follow_up">📞 Follow-up Call</SelectItem>
                <SelectItem value="payment_reminder">💰 Payment Reminder</SelectItem>
                <SelectItem value="meeting_scheduled">📅 Meeting Scheduled</SelectItem>
                <SelectItem value="support_ticket">🎫 Support Ticket</SelectItem>
              </SelectContent>
            </Select>
            {errors.task_type && (
              <p className="text-sm text-destructive">{errors.task_type.message}</p>
            )}
          </div>

          {/* Institution Selection */}
          <div className="space-y-2">
            <Label htmlFor="institution">Related To (Institution) *</Label>
            <Select
              onValueChange={(value) => {
                setValue("institution_id", value);
                const institution = institutions.find(i => i.id === value);
                if (institution) {
                  setValue("institution_name", institution.name);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select institution" />
              </SelectTrigger>
              <SelectContent>
                {institutions.map((inst) => (
                  <SelectItem key={inst.id} value={inst.id}>
                    {inst.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.institution_id && (
              <p className="text-sm text-destructive">{errors.institution_id.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe the task in detail..."
              {...register("description")}
              rows={4}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          {/* Assignment */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="assigned_to">Assigned To *</Label>
              <AssigneeSelector
                value={selectedAssignee}
                onValueChange={(assignee) => {
                  if (assignee) {
                    setSelectedAssignee(assignee.id);
                    setValue("assigned_to", assignee.name);
                    setValue("assigned_to_id", assignee.id);
                  } else {
                    setSelectedAssignee('');
                    setValue("assigned_to", '');
                    setValue("assigned_to_id", '');
                  }
                }}
              />
              {errors.assigned_to && (
                <p className="text-sm text-destructive">{errors.assigned_to.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Due Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={(date) => {
                      setDueDate(date);
                      if (date) {
                        setValue("due_date", format(date, "yyyy-MM-dd"));
                      }
                    }}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              {errors.due_date && (
                <p className="text-sm text-destructive">{errors.due_date.message}</p>
              )}
            </div>
          </div>

          {/* Priority */}
          <div className="space-y-3">
            <Label>Priority *</Label>
            <RadioGroup 
              defaultValue="medium" 
              onValueChange={(value) => setValue("priority", value as any)}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="high" id="high" />
                <Label htmlFor="high" className="cursor-pointer">
                  <span className="text-red-600 font-medium">High</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="medium" id="medium" />
                <Label htmlFor="medium" className="cursor-pointer">
                  <span className="text-yellow-600 font-medium">Medium</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="low" id="low" />
                <Label htmlFor="low" className="cursor-pointer">
                  <span className="text-green-600 font-medium">Low</span>
                </Label>
              </div>
            </RadioGroup>
            {errors.priority && (
              <p className="text-sm text-destructive">{errors.priority.message}</p>
            )}
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status *</Label>
            <Select 
              onValueChange={(value) => setValue("status", value as any)} 
              defaultValue="pending"
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            {errors.status && (
              <p className="text-sm text-destructive">{errors.status.message}</p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional notes..."
              {...register("notes")}
              rows={3}
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit">Create Task</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
