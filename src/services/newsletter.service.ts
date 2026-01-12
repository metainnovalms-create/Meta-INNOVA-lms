import { supabase } from "@/integrations/supabase/client";

export type NewsletterStatus = 'draft' | 'published';
export type TargetAudience = 'all' | 'management' | 'officer' | 'student';

export interface Newsletter {
  id: string;
  title: string;
  pdf_url: string;
  file_path: string | null;
  file_name: string;
  file_size: number | null;
  status: NewsletterStatus;
  target_audience: TargetAudience[];
  institution_id: string | null;
  download_count: number;
  published_at: string | null;
  created_by: string | null;
  created_by_name: string;
  created_at: string;
  updated_at: string;
}

export interface CreateNewsletterData {
  title: string;
  file: File;
  target_audience: TargetAudience[];
  created_by: string;
  created_by_name: string;
}

export interface NewsletterFilters {
  status?: NewsletterStatus;
  search?: string;
}

// Upload newsletter PDF and create record
export async function uploadNewsletter(data: CreateNewsletterData): Promise<Newsletter> {
  const { title, file, target_audience, created_by, created_by_name } = data;
  
  // Generate unique file path
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  const filePath = `newsletters/${fileName}`;
  
  // Upload PDF to storage
  const { error: uploadError } = await supabase.storage
    .from('newsletters')
    .upload(filePath, file, {
      contentType: 'application/pdf',
      cacheControl: '3600',
    });
  
  if (uploadError) throw uploadError;
  
  // Get public URL
  const { data: publicUrlData } = supabase.storage
    .from('newsletters')
    .getPublicUrl(filePath);
  
  // Create newsletter record with file_path for Edge Function
  const { data: newsletter, error } = await supabase
    .from('newsletters')
    .insert({
      title,
      pdf_url: publicUrlData.publicUrl,
      file_path: filePath,
      file_name: file.name,
      file_size: file.size,
      target_audience,
      created_by,
      created_by_name,
      status: 'published',
      published_at: new Date().toISOString(),
    })
    .select()
    .single();
  
  if (error) throw error;
  return newsletter as Newsletter;
}

// Get all newsletters (for admin)
export async function getNewsletters(filters: NewsletterFilters = {}): Promise<Newsletter[]> {
  let query = supabase
    .from('newsletters')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  
  if (filters.search) {
    query = query.ilike('title', `%${filters.search}%`);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data as Newsletter[];
}

// Get published newsletters for a specific role
export async function getPublishedNewsletters(userRole: string): Promise<Newsletter[]> {
  const { data, error } = await supabase
    .from('newsletters')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  
  // Filter by target audience
  const newsletters = data as Newsletter[];
  return newsletters.filter(n => 
    n.target_audience.includes('all') || 
    n.target_audience.includes(userRole as TargetAudience)
  );
}

// Delete newsletter and its PDF from storage
export async function deleteNewsletter(id: string): Promise<void> {
  // Get the newsletter to find the PDF URL
  const { data: newsletter, error: fetchError } = await supabase
    .from('newsletters')
    .select('pdf_url')
    .eq('id', id)
    .single();
  
  if (fetchError) throw fetchError;
  
  // Extract file path from URL and delete from storage
  if (newsletter?.pdf_url) {
    const url = new URL(newsletter.pdf_url);
    const pathParts = url.pathname.split('/');
    const bucketIndex = pathParts.indexOf('newsletters');
    if (bucketIndex !== -1) {
      const filePath = pathParts.slice(bucketIndex + 1).join('/');
      await supabase.storage.from('newsletters').remove([filePath]);
    }
  }
  
  // Delete the newsletter record
  const { error } = await supabase
    .from('newsletters')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// Increment download count
export async function incrementDownloadCount(id: string): Promise<void> {
  const { data: newsletter, error: fetchError } = await supabase
    .from('newsletters')
    .select('download_count')
    .eq('id', id)
    .single();
  
  if (fetchError) throw fetchError;
  
  const { error } = await supabase
    .from('newsletters')
    .update({ download_count: (newsletter?.download_count || 0) + 1 })
    .eq('id', id);
  
  if (error) throw error;
}

// Download newsletter via Edge Function (hides storage URL)
export async function downloadNewsletter(id: string): Promise<void> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const downloadUrl = `${supabaseUrl}/functions/v1/download-newsletter?id=${id}`;
  
  // Create anchor element for download
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
