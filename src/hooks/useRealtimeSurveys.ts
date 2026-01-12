import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useRealtimeSurveys() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('surveys-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'surveys',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['surveys'] });
          queryClient.invalidateQueries({ queryKey: ['active-surveys'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'survey_responses',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['survey-responses'] });
          queryClient.invalidateQueries({ queryKey: ['surveys'] });
          queryClient.invalidateQueries({ queryKey: ['survey-analytics'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}

export function useRealtimeFeedback() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('feedback-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'student_feedback',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['feedback-list'] });
          queryClient.invalidateQueries({ queryKey: ['feedback-stats'] });
          queryClient.invalidateQueries({ queryKey: ['student-feedback'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
