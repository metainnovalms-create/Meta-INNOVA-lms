import { Badge } from '@/components/ui/badge';
import { EventStatus } from '@/types/events';

interface EventStatusBadgeProps {
  status: EventStatus;
}

export function EventStatusBadge({ status }: EventStatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'draft':
        return { label: 'Draft', className: 'bg-muted text-muted-foreground border-muted' };
      case 'published':
        return { label: 'Published', className: 'bg-green-500/10 text-green-600 border-green-500/20 dark:text-green-400' };
      case 'ongoing':
        return { label: 'Ongoing', className: 'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400' };
      case 'completed':
        return { label: 'Completed', className: 'bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400' };
      case 'cancelled':
        return { label: 'Cancelled', className: 'bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400' };
      default:
        return { label: status, className: '' };
    }
  };

  const config = getStatusConfig();

  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}
