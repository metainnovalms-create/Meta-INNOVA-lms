import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  getNewsletters,
  getPublishedNewsletters,
  uploadNewsletter,
  deleteNewsletter,
  downloadNewsletter,
  CreateNewsletterData,
  NewsletterFilters,
} from "@/services/newsletter.service";

// Hook for fetching all newsletters (admin)
export function useNewsletters(filters: NewsletterFilters = {}) {
  return useQuery({
    queryKey: ['newsletters', filters],
    queryFn: () => getNewsletters(filters),
  });
}

// Hook for fetching published newsletters (other roles)
export function usePublishedNewsletters(userRole: string) {
  return useQuery({
    queryKey: ['published-newsletters', userRole],
    queryFn: () => getPublishedNewsletters(userRole),
  });
}

// Hook for real-time newsletter updates
export function useRealtimeNewsletters() {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    const channel = supabase
      .channel('newsletters-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'newsletters',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['newsletters'] });
          queryClient.invalidateQueries({ queryKey: ['published-newsletters'] });
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}

// Hook for newsletter mutations
export function useNewsletterMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const upload = useMutation({
    mutationFn: (data: CreateNewsletterData) => uploadNewsletter(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['newsletters'] });
      queryClient.invalidateQueries({ queryKey: ['published-newsletters'] });
      toast({
        title: "Success",
        description: "Newsletter uploaded successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upload newsletter",
        variant: "destructive",
      });
    },
  });
  
  const remove = useMutation({
    mutationFn: deleteNewsletter,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['newsletters'] });
      queryClient.invalidateQueries({ queryKey: ['published-newsletters'] });
      toast({
        title: "Success",
        description: "Newsletter deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete newsletter",
        variant: "destructive",
      });
    },
  });
  
  const download = useMutation({
    mutationFn: downloadNewsletter,
    onSuccess: () => {
      // Invalidate queries to update download count
      queryClient.invalidateQueries({ queryKey: ['newsletters'] });
      queryClient.invalidateQueries({ queryKey: ['published-newsletters'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to download newsletter",
        variant: "destructive",
      });
    },
  });
  
  return {
    uploadNewsletter: upload,
    deleteNewsletter: remove,
    downloadNewsletter: download,
  };
}
