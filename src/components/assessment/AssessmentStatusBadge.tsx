import { Badge } from '@/components/ui/badge';
import { AssessmentStatus } from '@/types/assessment';
import { getStatusColor } from '@/utils/assessmentHelpers';

interface AssessmentStatusBadgeProps {
  status: AssessmentStatus;
}

export const AssessmentStatusBadge = ({ status }: AssessmentStatusBadgeProps) => {
  const getStatusLabel = (status: AssessmentStatus): string => {
    switch (status) {
      case 'draft':
        return 'Draft';
      case 'published':
        return 'Published';
      case 'unpublished':
        return 'Unpublished';
      case 'upcoming':
        return 'Upcoming';
      case 'ongoing':
        return 'Ongoing';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };

  return (
    <Badge variant="outline" className={getStatusColor(status)}>
      {getStatusLabel(status)}
    </Badge>
  );
};
