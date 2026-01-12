import { supabase } from '@/integrations/supabase/client';

const BUCKET_NAME = 'course-content';

export interface UploadResult {
  path: string;
  publicUrl: string | null;
  signedUrl: string | null;
  fileSizeMb: number;
}

/**
 * Upload a course thumbnail to storage
 */
export async function uploadCourseThumbnail(
  file: File,
  courseId: string
): Promise<UploadResult> {
  const timestamp = Date.now();
  const ext = file.name.split('.').pop() || 'jpg';
  const filePath = `${courseId}/thumbnails/${timestamp}.${ext}`;

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true
    });

  if (error) {
    throw new Error(`Failed to upload thumbnail: ${error.message}`);
  }

  // Get signed URL for the thumbnail
  const { data: signedUrlData } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(data.path, 3600 * 24 * 7); // 7 days for thumbnails

  return {
    path: data.path,
    publicUrl: null,
    signedUrl: signedUrlData?.signedUrl || null,
    fileSizeMb: file.size / (1024 * 1024)
  };
}

/**
 * Upload a file to the course-content storage bucket
 */
export async function uploadCourseContent(
  file: File,
  courseId: string,
  contentType: 'pdf' | 'ppt'
): Promise<UploadResult> {
  // Generate unique file path
  const timestamp = Date.now();
  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const filePath = `${courseId}/${contentType}/${timestamp}_${sanitizedFileName}`;

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    throw new Error(`Failed to upload file: ${error.message}`);
  }

  // Get signed URL (valid for 1 hour - will be refreshed when viewing)
  const { data: signedUrlData } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(data.path, 3600);

  return {
    path: data.path,
    publicUrl: null, // Bucket is private
    signedUrl: signedUrlData?.signedUrl || null,
    fileSizeMb: file.size / (1024 * 1024)
  };
}

/**
 * Get a signed URL for viewing content (short-lived for security)
 * The URL expires after the specified seconds (default 10 minutes)
 */
export async function getContentSignedUrl(
  filePath: string,
  expiresInSeconds: number = 600 // 10 minutes
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(filePath, expiresInSeconds);

  if (error) {
    console.error('Failed to get signed URL:', error);
    return null;
  }

  return data.signedUrl;
}

/**
 * Download a file as blob from storage (bypasses CORS issues)
 */
export async function downloadCourseContent(filePath: string): Promise<Blob | null> {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .download(filePath);

  if (error) {
    console.error('Failed to download content:', error);
    return null;
  }

  return data;
}

/**
 * Delete a file from storage
 */
export async function deleteCourseContent(filePath: string): Promise<boolean> {
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([filePath]);

  if (error) {
    console.error('Failed to delete file:', error);
    return false;
  }

  return true;
}

/**
 * List files in a course folder
 */
export async function listCourseFiles(courseId: string): Promise<{ name: string; path: string }[]> {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .list(courseId, {
      limit: 100,
      sortBy: { column: 'created_at', order: 'desc' }
    });

  if (error) {
    console.error('Failed to list files:', error);
    return [];
  }

  return data.map(file => ({
    name: file.name,
    path: `${courseId}/${file.name}`
  }));
}
