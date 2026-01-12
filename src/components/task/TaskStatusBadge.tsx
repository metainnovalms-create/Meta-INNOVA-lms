import { TaskStatus } from '@/types/task';
import { Badge } from '@/components/ui/badge';
import { getStatusColor } from '@/utils/taskHelpers';

interface TaskStatusBadgeProps {
  status: TaskStatus;
}

const statusLabels: Record<TaskStatus, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  submitted_for_approval: 'Pending Approval',
  completed: 'Completed',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
};

export function TaskStatusBadge({ status }: TaskStatusBadgeProps) {
  return (
    <Badge variant="outline" className={getStatusColor(status)}>
      {statusLabels[status]}
    </Badge>
  );
}
