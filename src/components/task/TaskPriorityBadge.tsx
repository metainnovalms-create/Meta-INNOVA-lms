import { TaskPriority } from '@/types/task';
import { Badge } from '@/components/ui/badge';
import { getPriorityColor } from '@/utils/taskHelpers';
import { AlertCircle, Circle } from 'lucide-react';

interface TaskPriorityBadgeProps {
  priority: TaskPriority;
}

const priorityLabels: Record<TaskPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

export function TaskPriorityBadge({ priority }: TaskPriorityBadgeProps) {
  return (
    <Badge variant="outline" className={getPriorityColor(priority)}>
      {priority === 'urgent' ? (
        <AlertCircle className="h-3 w-3 mr-1" />
      ) : (
        <Circle className="h-3 w-3 mr-1" />
      )}
      {priorityLabels[priority]}
    </Badge>
  );
}
