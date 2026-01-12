import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Calendar, 
  User, 
  Building2, 
  RefreshCw, 
  MessageSquare, 
  DollarSign, 
  Users, 
  AlertCircle,
  CheckCircle,
  Trash2,
  Pencil,
  Clock,
  FileText
} from "lucide-react";
import { format, isPast } from "date-fns";
import { CRMTask } from "@/services/crmTaskService";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ViewTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: CRMTask | null;
  onEdit: (task: CRMTask) => void;
  onComplete: (task: CRMTask) => void;
  onDelete: (taskId: string) => void;
}

const taskTypeIcons = {
  renewal_reminder: RefreshCw,
  follow_up: MessageSquare,
  payment_reminder: DollarSign,
  meeting_scheduled: Users,
  support_ticket: AlertCircle,
};

const taskTypeLabels = {
  renewal_reminder: "Renewal Reminder",
  follow_up: "Follow-up",
  payment_reminder: "Payment Reminder",
  meeting_scheduled: "Meeting Scheduled",
  support_ticket: "Support Ticket",
};

const taskTypeColors = {
  renewal_reminder: "bg-blue-500/10 text-blue-600",
  follow_up: "bg-purple-500/10 text-purple-600",
  payment_reminder: "bg-green-500/10 text-green-600",
  meeting_scheduled: "bg-orange-500/10 text-orange-600",
  support_ticket: "bg-red-500/10 text-red-600",
};

const priorityColors = {
  high: "bg-red-500/10 text-red-600 border-red-200",
  medium: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
  low: "bg-blue-500/10 text-blue-600 border-blue-200",
};

const statusColors = {
  pending: "bg-gray-500/10 text-gray-600 border-gray-200",
  in_progress: "bg-blue-500/10 text-blue-600 border-blue-200",
  completed: "bg-green-500/10 text-green-600 border-green-200",
  cancelled: "bg-red-500/10 text-red-600 border-red-200",
};

export function ViewTaskDialog({ 
  open, 
  onOpenChange, 
  task, 
  onEdit, 
  onComplete,
  onDelete 
}: ViewTaskDialogProps) {
  if (!task) return null;

  const TypeIcon = taskTypeIcons[task.task_type];
  const isOverdue = isPast(new Date(task.due_date)) && task.status !== 'completed';
  const isCompleted = task.status === 'completed';

  const handleEdit = () => {
    onOpenChange(false);
    onEdit(task);
  };

  const handleComplete = () => {
    onComplete(task);
    onOpenChange(false);
  };

  const handleDelete = () => {
    onDelete(task.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${taskTypeColors[task.task_type]}`}>
              <TypeIcon className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg">{taskTypeLabels[task.task_type]}</DialogTitle>
              <p className="text-sm text-muted-foreground">{task.institution_name}</p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status and Priority Badges */}
          <div className="flex gap-2 flex-wrap">
            <Badge variant="outline" className={priorityColors[task.priority]}>
              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
            </Badge>
            <Badge variant="outline" className={statusColors[task.status]}>
              {task.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Badge>
            {isOverdue && (
              <Badge variant="destructive">
                Overdue
              </Badge>
            )}
          </div>

          <Separator />

          {/* Description */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-muted-foreground">Description</h4>
            <p className="text-sm">{task.description}</p>
          </div>

          {/* Notes */}
          {task.notes && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Notes
              </h4>
              <p className="text-sm bg-muted/50 p-3 rounded-md">{task.notes}</p>
            </div>
          )}

          <Separator />

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Institution
              </h4>
              <p className="text-sm">{task.institution_name}</p>
            </div>

            <div className="space-y-1">
              <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                <User className="h-4 w-4" />
                Assigned To
              </h4>
              <p className="text-sm">{task.assigned_to}</p>
            </div>

            <div className="space-y-1">
              <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Due Date
              </h4>
              <p className={`text-sm ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
                {format(new Date(task.due_date), 'PPP')}
                {isOverdue && ' (Overdue)'}
              </p>
            </div>

            {task.completed_at && (
              <div className="space-y-1">
                <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Completed At
                </h4>
                <p className="text-sm text-green-600">
                  {format(new Date(task.completed_at), 'PPP')}
                </p>
              </div>
            )}

            {task.created_at && (
              <div className="space-y-1">
                <h4 className="font-medium text-sm text-muted-foreground">Created</h4>
                <p className="text-sm">{format(new Date(task.created_at), 'PPP')}</p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Task?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the task.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <div className="flex gap-2 flex-1 justify-end">
            <Button variant="outline" onClick={handleEdit}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
            {!isCompleted && (
              <Button onClick={handleComplete}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark Complete
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
