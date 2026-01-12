import { supabase } from '@/integrations/supabase/client';

export interface Webinar {
  id: string;
  title: string;
  description: string | null;
  youtube_url: string;
  guest_name: string | null;
  guest_details: string | null;
  webinar_date: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface WebinarFormData {
  title: string;
  description?: string;
  youtube_url: string;
  guest_name?: string;
  guest_details?: string;
  webinar_date: string;
}

export const webinarService = {
  async getWebinars(): Promise<Webinar[]> {
    const { data, error } = await (supabase as any)
      .from('webinars')
      .select('*')
      .eq('is_active', true)
      .order('webinar_date', { ascending: false });
    
    if (error) throw error;
    return (data || []) as Webinar[];
  },

  async getAllWebinars(): Promise<Webinar[]> {
    const { data, error } = await (supabase as any)
      .from('webinars')
      .select('*')
      .order('webinar_date', { ascending: false });
    
    if (error) throw error;
    return (data || []) as Webinar[];
  },

  async getWebinar(id: string): Promise<Webinar | null> {
    const { data, error } = await (supabase as any)
      .from('webinars')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data as Webinar;
  },

  async createWebinar(webinar: WebinarFormData): Promise<Webinar> {
    const { data: user } = await supabase.auth.getUser();
    
    const { data, error } = await (supabase as any)
      .from('webinars')
      .insert({
        title: webinar.title,
        description: webinar.description || null,
        youtube_url: webinar.youtube_url,
        guest_name: webinar.guest_name || null,
        guest_details: webinar.guest_details || null,
        webinar_date: webinar.webinar_date,
        created_by: user?.user?.id,
        is_active: true
      })
      .select()
      .single();
    
    if (error) throw error;
    return data as Webinar;
  },

  async updateWebinar(id: string, webinar: Partial<WebinarFormData>): Promise<Webinar> {
    const { data, error } = await (supabase as any)
      .from('webinars')
      .update({
        title: webinar.title,
        description: webinar.description,
        youtube_url: webinar.youtube_url,
        guest_name: webinar.guest_name,
        guest_details: webinar.guest_details,
        webinar_date: webinar.webinar_date,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Webinar;
  },

  async deleteWebinar(id: string): Promise<void> {
    const { error } = await (supabase as any)
      .from('webinars')
      .update({ is_active: false })
      .eq('id', id);
    
    if (error) throw error;
  },

  async hardDeleteWebinar(id: string): Promise<void> {
    const { error } = await (supabase as any)
      .from('webinars')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Extract YouTube video ID from URL
  getYouTubeVideoId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  },

  // Get embed URL for YouTube video
  getEmbedUrl(url: string): string | null {
    const videoId = this.getYouTubeVideoId(url);
    if (!videoId) return null;
    return `https://www.youtube.com/embed/${videoId}`;
  }
};
