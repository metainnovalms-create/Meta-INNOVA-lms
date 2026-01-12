import { supabase } from "@/integrations/supabase/client";
import { 
  CommunicationLog, 
  CreateCommunicationLogInput, 
  CommunicationLogFilters,
  CommunicationLogAttachment
} from "@/types/communicationLog";

export async function fetchCommunicationLogs(
  filters?: CommunicationLogFilters
): Promise<CommunicationLog[]> {
  let query = supabase
    .from('communication_logs')
    .select('*')
    .order('date', { ascending: false });

  if (filters?.institutionId) {
    query = query.eq('institution_id', filters.institutionId);
  }
  if (filters?.type) {
    query = query.eq('type', filters.type);
  }
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.startDate) {
    query = query.gte('date', filters.startDate);
  }
  if (filters?.endDate) {
    query = query.lte('date', filters.endDate);
  }
  if (filters?.search) {
    query = query.or(`subject.ilike.%${filters.search}%,notes.ilike.%${filters.search}%,contact_person.ilike.%${filters.search}%,institution_name.ilike.%${filters.search}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching communication logs:', error);
    throw error;
  }

  return (data || []) as CommunicationLog[];
}

export async function createCommunicationLog(
  input: CreateCommunicationLogInput
): Promise<CommunicationLog> {
  const { data, error } = await supabase
    .from('communication_logs')
    .insert(input)
    .select()
    .single();

  if (error) {
    console.error('Error creating communication log:', error);
    throw error;
  }

  return data as CommunicationLog;
}

export async function updateCommunicationLog(
  id: string,
  updates: Partial<CommunicationLog>
): Promise<CommunicationLog> {
  const { data, error } = await supabase
    .from('communication_logs')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating communication log:', error);
    throw error;
  }

  return data as CommunicationLog;
}

export async function deleteCommunicationLog(id: string): Promise<void> {
  const { error } = await supabase
    .from('communication_logs')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting communication log:', error);
    throw error;
  }
}

export async function fetchInstitutions(): Promise<{ id: string; name: string }[]> {
  const { data, error } = await supabase
    .from('institutions')
    .select('id, name')
    .eq('status', 'active')
    .order('name');

  if (error) {
    console.error('Error fetching institutions:', error);
    throw error;
  }

  return data || [];
}

// Attachment functions
export async function uploadCommunicationAttachment(
  communicationLogId: string,
  file: File,
  userId: string,
  userName: string
): Promise<CommunicationLogAttachment> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${communicationLogId}/${Date.now()}.${fileExt}`;

  // Upload to storage
  const { error: uploadError } = await supabase.storage
    .from('crm-attachments')
    .upload(fileName, file);

  if (uploadError) {
    console.error('Error uploading file:', uploadError);
    throw uploadError;
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('crm-attachments')
    .getPublicUrl(fileName);

  // Save attachment record
  const { data, error } = await supabase
    .from('communication_log_attachments')
    .insert({
      communication_log_id: communicationLogId,
      file_name: file.name,
      file_size: file.size,
      file_type: file.type,
      storage_path: fileName,
      public_url: publicUrl,
      uploaded_by_id: userId,
      uploaded_by_name: userName,
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving attachment record:', error);
    throw error;
  }

  return data as CommunicationLogAttachment;
}

export async function fetchCommunicationAttachments(
  communicationLogId: string
): Promise<CommunicationLogAttachment[]> {
  const { data, error } = await supabase
    .from('communication_log_attachments')
    .select('*')
    .eq('communication_log_id', communicationLogId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching attachments:', error);
    throw error;
  }

  return (data || []) as CommunicationLogAttachment[];
}

export async function deleteCommunicationAttachment(
  attachment: CommunicationLogAttachment
): Promise<void> {
  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from('crm-attachments')
    .remove([attachment.storage_path]);

  if (storageError) {
    console.error('Error deleting file from storage:', storageError);
  }

  // Delete record
  const { error } = await supabase
    .from('communication_log_attachments')
    .delete()
    .eq('id', attachment.id);

  if (error) {
    console.error('Error deleting attachment record:', error);
    throw error;
  }
}
