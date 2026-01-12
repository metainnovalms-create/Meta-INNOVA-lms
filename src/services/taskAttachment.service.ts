import { supabase } from "@/integrations/supabase/client";
import { TaskAttachment } from "@/types/task";
import { logAttachmentAdded, logAttachmentRemoved } from "./taskActivity.service";

const BUCKET_NAME = 'task-attachments';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const uploadTaskAttachment = async (
  taskId: string,
  file: File,
  userId: string,
  userName: string
): Promise<TaskAttachment | null> => {
  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File size exceeds 10MB limit');
  }

  // Create unique storage path
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  const storagePath = `${taskId}/${fileName}`;

  // Upload to storage
  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storagePath, file);

  if (uploadError) {
    console.error('Error uploading file:', uploadError);
    throw new Error('Failed to upload file');
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(storagePath);

  // Insert attachment record
  const { data, error } = await supabase
    .from('task_attachments')
    .insert({
      task_id: taskId,
      uploaded_by_id: userId,
      uploaded_by_name: userName,
      file_name: file.name,
      file_size: file.size,
      file_type: file.type,
      storage_path: storagePath,
      public_url: urlData.publicUrl,
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving attachment record:', error);
    // Try to clean up the uploaded file
    await supabase.storage.from(BUCKET_NAME).remove([storagePath]);
    throw new Error('Failed to save attachment');
  }

  // Log activity
  await logAttachmentAdded(taskId, userId, userName, file.name);

  return {
    id: data.id,
    task_id: data.task_id,
    uploaded_by_id: data.uploaded_by_id,
    uploaded_by_name: data.uploaded_by_name,
    file_name: data.file_name,
    file_size: data.file_size,
    file_type: data.file_type,
    storage_path: data.storage_path,
    public_url: data.public_url,
    created_at: data.created_at,
  };
};

export const fetchTaskAttachments = async (taskId: string): Promise<TaskAttachment[]> => {
  const { data, error } = await supabase
    .from('task_attachments')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching attachments:', error);
    return [];
  }

  return (data || []).map(item => ({
    id: item.id,
    task_id: item.task_id,
    uploaded_by_id: item.uploaded_by_id,
    uploaded_by_name: item.uploaded_by_name,
    file_name: item.file_name,
    file_size: item.file_size,
    file_type: item.file_type,
    storage_path: item.storage_path,
    public_url: item.public_url,
    created_at: item.created_at,
  }));
};

export const deleteTaskAttachment = async (
  attachment: TaskAttachment,
  userId: string,
  userName: string
): Promise<boolean> => {
  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([attachment.storage_path]);

  if (storageError) {
    console.error('Error deleting file from storage:', storageError);
  }

  // Delete record
  const { error } = await supabase
    .from('task_attachments')
    .delete()
    .eq('id', attachment.id);

  if (error) {
    console.error('Error deleting attachment record:', error);
    return false;
  }

  // Log activity
  await logAttachmentRemoved(attachment.task_id, userId, userName, attachment.file_name);

  return true;
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getFileIcon = (fileType: string): string => {
  if (fileType.startsWith('image/')) return 'image';
  if (fileType === 'application/pdf') return 'file-text';
  if (fileType.includes('spreadsheet') || fileType.includes('excel')) return 'file-spreadsheet';
  if (fileType.includes('document') || fileType.includes('word')) return 'file-text';
  return 'file';
};
