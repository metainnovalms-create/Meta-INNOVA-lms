import { useCallback, useState } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { uploadTaskAttachment } from '@/services/taskAttachment.service';
import { TaskAttachment } from '@/types/task';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface TaskAttachmentUploaderProps {
  taskId: string;
  userId: string;
  userName: string;
  onUploadComplete?: (attachment: TaskAttachment) => void;
}

export function TaskAttachmentUploader({
  taskId,
  userId,
  userName,
  onUploadComplete,
}: TaskAttachmentUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        await handleUpload(files[0]);
      }
    },
    [taskId, userId, userName]
  );

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        await handleUpload(files[0]);
      }
      // Reset input
      e.target.value = '';
    },
    [taskId, userId, userName]
  );

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const attachment = await uploadTaskAttachment(taskId, file, userId, userName);
      if (attachment) {
        toast.success(`Uploaded: ${file.name}`);
        onUploadComplete?.(attachment);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        'relative border-2 border-dashed rounded-lg p-4 transition-colors',
        isDragging
          ? 'border-primary bg-primary/5'
          : 'border-muted-foreground/25 hover:border-muted-foreground/50',
        isUploading && 'opacity-50 pointer-events-none'
      )}
    >
      <input
        type="file"
        id="file-upload"
        className="sr-only"
        onChange={handleFileSelect}
        disabled={isUploading}
      />
      
      <label
        htmlFor="file-upload"
        className="flex flex-col items-center justify-center cursor-pointer"
      >
        {isUploading ? (
          <>
            <Loader2 className="h-8 w-8 text-muted-foreground animate-spin mb-2" />
            <span className="text-sm text-muted-foreground">Uploading...</span>
          </>
        ) : (
          <>
            <Upload className="h-8 w-8 text-muted-foreground mb-2" />
            <span className="text-sm text-muted-foreground">
              {isDragging ? 'Drop file here' : 'Drop file or click to upload'}
            </span>
            <span className="text-xs text-muted-foreground/75 mt-1">
              Max 10MB • PDF, Images, Documents
            </span>
          </>
        )}
      </label>
    </div>
  );
}
