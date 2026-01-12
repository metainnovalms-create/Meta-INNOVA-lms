import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getSystemLogs, SystemLog, LogFilters } from '@/services/systemLog.service';

export function useSystemLogs(filters: LogFilters = {}) {
  return useQuery({
    queryKey: ['system-logs', filters],
    queryFn: () => getSystemLogs(filters),
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

export function useRealtimeSystemLogs(initialFilters: LogFilters = {}) {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);

  // Initial fetch
  useEffect(() => {
    const fetchLogs = async () => {
      setIsLoading(true);
      const result = await getSystemLogs(initialFilters);
      setLogs(result.logs);
      setTotal(result.total);
      setIsLoading(false);
    };
    fetchLogs();
  }, [JSON.stringify(initialFilters)]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('system-logs-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'system_logs',
        },
        (payload) => {
          const newLog = payload.new as SystemLog;
          setLogs((prev) => [newLog, ...prev].slice(0, initialFilters.limit || 50));
          setTotal((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [initialFilters.limit]);

  return { logs, total, isLoading };
}

export function useEntityTypes() {
  return useQuery({
    queryKey: ['system-logs-entity-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_logs')
        .select('entity_type')
        .limit(1000);

      if (error) {
        console.error('Error fetching entity types:', error);
        return [];
      }

      // Get unique entity types
      const uniqueTypes = [...new Set(data?.map(d => d.entity_type) || [])];
      return uniqueTypes.sort();
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}
