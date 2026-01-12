import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CRMTask } from "@/hooks/useCRMTasks";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { loadMetaStaff, MetaStaffUser } from "@/data/mockMetaStaffData";

const taskSchema = z.object({
  institution_id: z.string().min(1, "Institution is required"),
  task_type: z.enum(['renewal_reminder', 'follow_up', 'payment_reminder', 'meeting_scheduled', 'support_ticket']),
  description: z.string().min(10, "Description must be at least 10 characters"),
  assigned_to: z.string().min(1, "Assignee is required"),
  due_date: z.string().min(1, "Due date is required"),
  priority: z.enum(['high', 'medium', 'low']),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']),
  notes: z.string().optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface EditTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: CRMTask | null;
  onSave: (data: CRMTask) => void;
  institutions: { id: string; name: string }[];
}

export function EditTaskDialog({ 
  open, 
  onOpenChange, 
  task, 
  onSave,
  institutions 
}: EditTaskDialogProps) {
  const [metaStaff, setMetaStaff] = useState<MetaStaffUser[]>([]);
  
  const { register, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: task ? {
      institution_id: task.institution_id,
      task_type: task.task_type,
      description: task.description,
      assigned_to: task.assigned_to,
      due_date: format(new Date(task.due_date), 'yyyy-MM-dd'),
      priority: task.priority,
      status: task.status,
      notes: task.notes || '',
    } : undefined
  });

  // Load meta staff users
  useEffect(() => {
    const staff = loadMetaStaff();
    setMetaStaff(staff);
  }, []);

  // Reset form when task changes
  useEffect(() => {
    if (task) {
      reset({
        institution_id: task.institution_id,
        task_type: task.task_type,
        description: task.description,
        assigned_to: task.assigned_to,
        due_date: format(new Date(task.due_date), 'yyyy-MM-dd'),
        priority: task.priority,
        status: task.status,
        notes: task.notes || '',
      });
    }
  }, [task, reset]);

  const onSubmit = (data: TaskFormData) => {
    if (!task) return;
    
    const selectedInstitution = institutions.find(i => i.id === data.institution_id);
    
    const updatedTask: CRMTask = {
      ...task,
      institution_id: data.institution_id,
      institution_name: selectedInstitution?.name || task.institution_name,
      task_type: data.task_type,
      description: data.description,
      assigned_to: data.assigned_to,
      due_date: data.due_date,
      priority: data.priority,
      status: data.status,
      notes: data.notes || null,
    };
    
    onSave(updatedTask);
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="task_type">Task Type *</Label>
              <Select
                value={watch('task_type')}
                onValueChange={(value: any) => setValue('task_type', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="renewal_reminder">Renewal Reminder</SelectItem>
                  <SelectItem value="follow_up">Follow-up</SelectItem>
                  <SelectItem value="payment_reminder">Payment Reminder</SelectItem>
                  <SelectItem value="meeting_scheduled">Meeting Scheduled</SelectItem>
                  <SelectItem value="support_ticket">Support Ticket</SelectItem>
                </SelectContent>
              </Select>
              {errors.task_type && <p className="text-sm text-red-500">{errors.task_type.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="institution_id">Institution *</Label>
              <Select
                value={watch('institution_id')}
                onValueChange={(value) => setValue('institution_id', value)}
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
                <p className="text-sm text-red-500">{errors.institution_id.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              {...register('description')}
              placeholder="Describe the task..."
              rows={3}
            />
            {errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="assigned_to">Assigned To *</Label>
              <Select
                value={watch('assigned_to')}
                onValueChange={(value) => setValue('assigned_to', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {metaStaff.map((staff) => (
                    <SelectItem key={staff.id} value={staff.name}>
                      {staff.name} - {staff.position_name?.toUpperCase() || 'Staff'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.assigned_to && <p className="text-sm text-red-500">{errors.assigned_to.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="due_date">Due Date *</Label>
              <Input type="date" {...register('due_date')} />
              {errors.due_date && <p className="text-sm text-red-500">{errors.due_date.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority *</Label>
              <Select
                value={watch('priority')}
                onValueChange={(value: any) => setValue('priority', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              {errors.priority && <p className="text-sm text-red-500">{errors.priority.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={watch('status')}
                onValueChange={(value: any) => setValue('status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              {errors.status && <p className="text-sm text-red-500">{errors.status.message}</p>}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              {...register('notes')}
              placeholder="Add any additional notes..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
