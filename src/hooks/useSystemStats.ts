import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { systemStatsService, SystemConfiguration } from '@/services/system-stats.service';
import { toast } from 'sonner';

export function useStorageStats() {
  return useQuery({
    queryKey: ['system-stats', 'storage'],
    queryFn: () => systemStatsService.getStorageStats(),
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000 // Refresh every minute
  });
}

export function useDatabaseStats() {
  return useQuery({
    queryKey: ['system-stats', 'database'],
    queryFn: () => systemStatsService.getDatabaseStats(),
    staleTime: 30000,
    refetchInterval: 60000
  });
}

export function useSecurityStats() {
  return useQuery({
    queryKey: ['system-stats', 'security'],
    queryFn: () => systemStatsService.getSecurityStats(),
    staleTime: 30000,
    refetchInterval: 60000
  });
}

export function useSystemConfigurations() {
  return useQuery({
    queryKey: ['system-configurations'],
    queryFn: () => systemStatsService.getSystemConfigurations(),
    staleTime: 10000
  });
}

export function useUpdateConfiguration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: Record<string, any> }) =>
      systemStatsService.updateSystemConfiguration(key, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-configurations'] });
      toast.success('Configuration updated successfully');
    },
    onError: () => {
      toast.error('Failed to update configuration');
    }
  });
}

// Helper to get a specific config by key
export function useConfigValue(configs: SystemConfiguration[] | undefined, key: string) {
  return configs?.find(c => c.key === key)?.value || {};
}
