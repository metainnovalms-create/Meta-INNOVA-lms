import { useQuery } from '@tanstack/react-query';
import { reportService } from '@/services/report.service';

export function usePublishedReports(institutionId: string | undefined) {
  return useQuery({
    queryKey: ['published-reports', institutionId],
    queryFn: async () => {
      if (!institutionId) return [];
      return reportService.getPublishedReportsForInstitution(institutionId);
    },
    enabled: !!institutionId,
  });
}
