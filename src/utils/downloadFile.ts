import { toast } from 'sonner';

/**
 * Downloads a file from a URL by fetching it as a blob and triggering a download.
 * This works for cross-origin URLs like Supabase storage where the `download` attribute fails.
 */
export async function downloadFile(fileUrl: string, fileName: string): Promise<void> {
  try {
    toast.loading('Downloading...', { id: 'download' });
    
    const response = await fetch(fileUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the blob URL after a short delay
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
    }, 100);
    
    toast.success('Download started', { id: 'download' });
  } catch (error) {
    console.error('Download failed:', error);
    toast.error('Failed to download file', { id: 'download' });
    throw error;
  }
}
