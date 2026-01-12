import { supabase } from '@/integrations/supabase/client';
import { Event, EventUpdate, EventInterest, CreateEventData, PublishEventData, EventClassAssignment } from '@/types/events';

class EventService {
  async createEvent(data: CreateEventData): Promise<Event> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: event, error } = await supabase
      .from('events')
      .insert({
        ...data,
        created_by: user.id,
        status: 'draft'
      })
      .select()
      .single();

    if (error) throw error;
    return event as Event;
  }

  async updateEvent(id: string, data: Partial<CreateEventData>): Promise<Event> {
    const { data: event, error } = await supabase
      .from('events')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return event as Event;
  }

  async deleteEvent(id: string): Promise<void> {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async getEvents(status?: string): Promise<Event[]> {
    let query = supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as Event[];
  }

  async getEventById(id: string): Promise<Event | null> {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data as Event | null;
  }

  async publishEvent(data: PublishEventData): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Insert class assignments
    const assignments = data.assignments.map(a => ({
      event_id: data.event_id,
      institution_id: a.institution_id,
      class_id: a.class_id,
      assigned_by: user.id
    }));

    const { error: assignError } = await supabase
      .from('event_class_assignments')
      .insert(assignments);

    if (assignError) throw assignError;

    // Update event status to published
    const { error: updateError } = await supabase
      .from('events')
      .update({ status: 'published' })
      .eq('id', data.event_id);

    if (updateError) throw updateError;
  }

  async unpublishEvent(eventId: string): Promise<void> {
    // Remove all class assignments
    const { error: deleteError } = await supabase
      .from('event_class_assignments')
      .delete()
      .eq('event_id', eventId);

    if (deleteError) throw deleteError;

    // Update status back to draft
    const { error: updateError } = await supabase
      .from('events')
      .update({ status: 'draft' })
      .eq('id', eventId);

    if (updateError) throw updateError;
  }

  async getEventAssignments(eventId: string): Promise<EventClassAssignment[]> {
    const { data, error } = await supabase
      .from('event_class_assignments')
      .select(`
        *,
        institutions:institution_id (id, name),
        classes:class_id (id, class_name, section)
      `)
      .eq('event_id', eventId);

    if (error) throw error;
    return (data || []) as unknown as EventClassAssignment[];
  }

  // Event Updates
  async addEventUpdate(eventId: string, update: { title: string; content?: string; link_url?: string }): Promise<EventUpdate> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('event_updates')
      .insert({
        event_id: eventId,
        ...update,
        created_by: user.id
      })
      .select()
      .single();

    if (error) throw error;
    return data as EventUpdate;
  }

  async getEventUpdates(eventId: string): Promise<EventUpdate[]> {
    const { data, error } = await supabase
      .from('event_updates')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as EventUpdate[];
  }

  async deleteEventUpdate(updateId: string): Promise<void> {
    const { error } = await supabase
      .from('event_updates')
      .delete()
      .eq('id', updateId);

    if (error) throw error;
  }

  // Event Interests
  async expressInterest(eventId: string): Promise<EventInterest> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Check registration deadline
    const event = await this.getEventById(eventId);
    if (event?.registration_end) {
      const regEnd = new Date(event.registration_end);
      if (regEnd < new Date()) {
        throw new Error('Registration deadline has passed');
      }
    }

    // Get student profile info
    const { data: profile } = await supabase
      .from('profiles')
      .select('name, institution_id, class_id')
      .eq('id', user.id)
      .single();

    // Get class info separately if class_id exists
    let className: string | undefined;
    if (profile?.class_id) {
      const { data: classInfo } = await supabase
        .from('classes')
        .select('class_name')
        .eq('id', profile.class_id)
        .single();
      className = classInfo?.class_name;
    }

    // Get institution info
    let institutionName: string | undefined;
    if (profile?.institution_id) {
      const { data: instInfo } = await supabase
        .from('institutions')
        .select('name')
        .eq('id', profile.institution_id)
        .single();
      institutionName = instInfo?.name;
    }

    const { data, error } = await supabase
      .from('event_interests')
      .insert({
        event_id: eventId,
        student_id: user.id,
        student_name: profile?.name,
        email: user.email, // Get email from auth user
        institution_id: profile?.institution_id,
        institution_name: institutionName,
        class_id: profile?.class_id,
        class_name: className,
      })
      .select()
      .single();

    if (error) throw error;

    // Increment participant count manually
    const { data: currentEvent } = await supabase
      .from('events')
      .select('current_participants')
      .eq('id', eventId)
      .single();

    if (currentEvent) {
      await supabase
        .from('events')
        .update({ current_participants: (currentEvent.current_participants || 0) + 1 })
        .eq('id', eventId);
    }

    return data as EventInterest;
  }

  async removeInterest(eventId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Check registration deadline
    const event = await this.getEventById(eventId);
    if (event?.registration_end) {
      const regEnd = new Date(event.registration_end);
      if (regEnd < new Date()) {
        throw new Error('Cannot remove interest after registration deadline');
      }
    }

    const { error } = await supabase
      .from('event_interests')
      .delete()
      .eq('event_id', eventId)
      .eq('student_id', user.id);

    if (error) throw error;

    // Decrement participant count
    const { data: currentEvent } = await supabase
      .from('events')
      .select('current_participants')
      .eq('id', eventId)
      .single();

    if (currentEvent && currentEvent.current_participants > 0) {
      await supabase
        .from('events')
        .update({ current_participants: currentEvent.current_participants - 1 })
        .eq('id', eventId);
    }
  }

  async getEventInterests(eventId: string, institutionId?: string): Promise<EventInterest[]> {
    let query = supabase
      .from('event_interests')
      .select(`
        *,
        classes:class_id (class_name),
        institutions:institution_id (name)
      `)
      .eq('event_id', eventId)
      .order('registered_at', { ascending: false });

    if (institutionId) {
      query = query.eq('institution_id', institutionId);
    }

    const { data, error } = await query;
    if (error) throw error;

    const mapped = (data || []).map((row: any) => ({
      ...row,
      class_name: row.class_name ?? row.classes?.class_name ?? null,
      institution_name: row.institution_name ?? row.institutions?.name ?? null,
    }));

    return mapped as EventInterest[];
  }

  // Get all interests for an event (CEO view - all institutions)
  async getAllEventInterests(eventId: string): Promise<EventInterest[]> {
    const { data, error } = await supabase
      .from('event_interests')
      .select(`
        *,
        classes:class_id (class_name),
        institutions:institution_id (name)
      `)
      .eq('event_id', eventId)
      .order('registered_at', { ascending: false });

    if (error) throw error;

    const mapped = (data || []).map((row: any) => ({
      ...row,
      class_name: row.class_name ?? row.classes?.class_name ?? null,
      institution_name: row.institution_name ?? row.institutions?.name ?? null,
    }));

    return mapped as EventInterest[];
  }

  async hasExpressedInterest(eventId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('event_interests')
      .select('id')
      .eq('event_id', eventId)
      .eq('student_id', user.id)
      .maybeSingle();

    if (error) return false;
    return !!data;
  }

  // File upload
  async uploadBrochure(file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `brochures/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('event-files')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('event-files')
      .getPublicUrl(filePath);

    return publicUrl;
  }

  async uploadAttachment(file: File): Promise<{ name: string; url: string }> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `attachments/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('event-files')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('event-files')
      .getPublicUrl(filePath);

    return { name: file.name, url: publicUrl };
  }

  // Check if user can manage events (for UI purposes)
  async canManageEvents(): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // Check user role
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const userRoles = roles?.map(r => r.role) || [];
    
    if (userRoles.includes('super_admin') || userRoles.includes('system_admin')) {
      return true;
    }

    // Check if CEO
    const { data: profile } = await supabase
      .from('profiles')
      .select(`
        is_ceo,
        position_id
      `)
      .eq('id', user.id)
      .maybeSingle();

    if (profile?.is_ceo) return true;

    // Check position
    if (profile?.position_id) {
      const { data: position } = await supabase
        .from('positions')
        .select('is_ceo_position, visible_features')
        .eq('id', profile.position_id)
        .single();

      if (position?.is_ceo_position) {
        const features = position.visible_features as string[] || [];
        if (features.includes('event_management')) {
          return true;
        }
      }
    }

    return false;
  }
}

export const eventService = new EventService();
