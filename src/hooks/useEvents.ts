import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventService } from '@/services/event.service';
import { CreateEventData, PublishEventData } from '@/types/events';
import { toast } from 'sonner';

export function useEvents(status?: string) {
  return useQuery({
    queryKey: ['events', status],
    queryFn: () => eventService.getEvents(status),
  });
}

export function useEvent(id: string | undefined) {
  return useQuery({
    queryKey: ['event', id],
    queryFn: () => eventService.getEventById(id!),
    enabled: !!id,
  });
}

export function useEventAssignments(eventId: string | undefined) {
  return useQuery({
    queryKey: ['event-assignments', eventId],
    queryFn: () => eventService.getEventAssignments(eventId!),
    enabled: !!eventId,
  });
}

export function useEventUpdates(eventId: string | undefined) {
  return useQuery({
    queryKey: ['event-updates', eventId],
    queryFn: () => eventService.getEventUpdates(eventId!),
    enabled: !!eventId,
  });
}

export function useEventInterests(eventId: string | undefined, institutionId?: string) {
  return useQuery({
    queryKey: ['event-interests', eventId, institutionId],
    queryFn: () => eventService.getEventInterests(eventId!, institutionId),
    enabled: !!eventId,
  });
}

export function useAllEventInterests(eventId: string | undefined) {
  return useQuery({
    queryKey: ['event-interests-all', eventId],
    queryFn: () => eventService.getAllEventInterests(eventId!),
    enabled: !!eventId,
  });
}

export function useHasExpressedInterest(eventId: string | undefined) {
  return useQuery({
    queryKey: ['event-interest-check', eventId],
    queryFn: () => eventService.hasExpressedInterest(eventId!),
    enabled: !!eventId,
  });
}

export function useCanManageEvents() {
  return useQuery({
    queryKey: ['can-manage-events'],
    queryFn: () => eventService.canManageEvents(),
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateEventData) => eventService.createEvent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Event created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create event: ${error.message}`);
    },
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateEventData> }) => 
      eventService.updateEvent(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['event', id] });
      toast.success('Event updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update event: ${error.message}`);
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => eventService.deleteEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Event deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete event: ${error.message}`);
    },
  });
}

export function usePublishEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PublishEventData) => eventService.publishEvent(data),
    onSuccess: (_, { event_id }) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['event', event_id] });
      queryClient.invalidateQueries({ queryKey: ['event-assignments', event_id] });
      toast.success('Event published successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to publish event: ${error.message}`);
    },
  });
}

export function useUnpublishEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (eventId: string) => eventService.unpublishEvent(eventId),
    onSuccess: (_, eventId) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      queryClient.invalidateQueries({ queryKey: ['event-assignments', eventId] });
      toast.success('Event unpublished');
    },
    onError: (error: Error) => {
      toast.error(`Failed to unpublish event: ${error.message}`);
    },
  });
}

export function useAddEventUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, update }: { eventId: string; update: { title: string; content?: string; link_url?: string } }) => 
      eventService.addEventUpdate(eventId, update),
    onSuccess: (_, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: ['event-updates', eventId] });
      toast.success('Update added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add update: ${error.message}`);
    },
  });
}

export function useDeleteEventUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ updateId, eventId }: { updateId: string; eventId: string }) => 
      eventService.deleteEventUpdate(updateId),
    onSuccess: (_, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: ['event-updates', eventId] });
      toast.success('Update deleted');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete update: ${error.message}`);
    },
  });
}

export function useExpressInterest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (eventId: string) => eventService.expressInterest(eventId),
    onSuccess: (_, eventId) => {
      queryClient.invalidateQueries({ queryKey: ['event-interest-check', eventId] });
      queryClient.invalidateQueries({ queryKey: ['event-interests', eventId] });
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      toast.success('Interest registered successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to express interest: ${error.message}`);
    },
  });
}

export function useRemoveInterest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (eventId: string) => eventService.removeInterest(eventId),
    onSuccess: (_, eventId) => {
      queryClient.invalidateQueries({ queryKey: ['event-interest-check', eventId] });
      queryClient.invalidateQueries({ queryKey: ['event-interests', eventId] });
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      toast.success('Interest removed');
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove interest: ${error.message}`);
    },
  });
}

export function useUploadBrochure() {
  return useMutation({
    mutationFn: (file: File) => eventService.uploadBrochure(file),
    onError: (error: Error) => {
      toast.error(`Failed to upload brochure: ${error.message}`);
    },
  });
}

export function useUploadAttachment() {
  return useMutation({
    mutationFn: (file: File) => eventService.uploadAttachment(file),
    onError: (error: Error) => {
      toast.error(`Failed to upload attachment: ${error.message}`);
    },
  });
}
