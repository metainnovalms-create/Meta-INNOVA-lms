import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CommunicationLog, CommunicationLogFilters } from '@/types/communicationLog';
import { fetchCommunicationLogs } from '@/services/communicationLog.service';
import { toast } from 'sonner';

export function useRealtimeCommunicationLogs(filters?: CommunicationLogFilters) {
  const [logs, setLogs] = useState<CommunicationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchCommunicationLogs(filters);
      setLogs(data);
      setError(null);
    } catch (err) {
      console.error('Error loading communication logs:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  useEffect(() => {
    const channel = supabase
      .channel('communication-logs-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'communication_logs',
        },
        (payload) => {
          const newLog = payload.new as CommunicationLog;
          setLogs((prev) => [newLog, ...prev]);
          toast.success(`New communication log added by ${newLog.conducted_by_name}`);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'communication_logs',
        },
        (payload) => {
          const updatedLog = payload.new as CommunicationLog;
          setLogs((prev) =>
            prev.map((log) => (log.id === updatedLog.id ? updatedLog : log))
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'communication_logs',
        },
        (payload) => {
          const deletedId = payload.old.id;
          setLogs((prev) => prev.filter((log) => log.id !== deletedId));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    logs,
    loading,
    error,
    refetch: loadLogs,
  };
}
