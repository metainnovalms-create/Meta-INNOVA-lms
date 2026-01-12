import { Badge } from '@/components/ui/badge';
import { ApplicationStatus } from '@/types/events';

interface ApplicationStatusBadgeProps {
  status: ApplicationStatus;
}

export function ApplicationStatusBadge({ status }: ApplicationStatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'pending':
        return { label: 'Pending', className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20 dark:text-yellow-400' };
      case 'approved':
        return { label: 'Approved', className: 'bg-green-500/10 text-green-600 border-green-500/20 dark:text-green-400' };
      case 'rejected':
        return { label: 'Rejected', className: 'bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400' };
      case 'shortlisted':
        return { label: 'Shortlisted', className: 'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400' };
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
