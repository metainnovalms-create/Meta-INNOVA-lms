import { Task } from '@/types/task';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { TaskStatusBadge } from './TaskStatusBadge';
import { TaskPriorityBadge } from './TaskPriorityBadge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Calendar, User, AlertCircle } from 'lucide-react';
import { format, isAfter } from 'date-fns';
import { isTaskOverdue, getDaysUntilDue } from '@/utils/taskHelpers';
import { Progress } from '@/components/ui/progress';

interface TaskCardProps {
  task: Task;
  onClick: () => void;
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const overdue = isTaskOverdue(task);
  const daysUntil = getDaysUntilDue(task.due_date);

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-1">
            <h3 className="font-semibold text-base leading-tight">{task.title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {task.description}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <TaskStatusBadge status={task.status} />
            <TaskPriorityBadge priority={task.priority} />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {task.progress_percentage !== undefined && task.status !== 'completed' && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>{task.progress_percentage}%</span>
            </div>
            <Progress value={task.progress_percentage} className="h-2" />
          </div>
        )}

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <User className="h-4 w-4" />
            <span className="truncate">{task.assigned_to_name}</span>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className={overdue ? 'text-destructive font-medium' : 'text-muted-foreground'}>
              {format(new Date(task.due_date), 'MMM d, yyyy')}
            </span>
          </div>
        </div>

        {overdue && task.status !== 'completed' && (
          <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-md">
            <AlertCircle className="h-3 w-3" />
            <span>Overdue by {Math.abs(daysUntil)} {Math.abs(daysUntil) === 1 ? 'day' : 'days'}</span>
          </div>
        )}

        {!overdue && task.status !== 'completed' && daysUntil <= 3 && daysUntil > 0 && (
          <div className="flex items-center gap-2 text-xs text-orange-600 bg-orange-100 dark:bg-orange-950 px-3 py-2 rounded-md">
            <AlertCircle className="h-3 w-3" />
            <span>Due in {daysUntil} {daysUntil === 1 ? 'day' : 'days'}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
