import { useState, useEffect } from 'react';
import { TaskAttachment } from '@/types/task';
import { fetchTaskAttachments, deleteTaskAttachment, formatFileSize } from '@/services/taskAttachment.service';
import { Button } from '@/components/ui/button';
import { Download, Trash2, FileText, Image, FileSpreadsheet, File, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface TaskAttachmentListProps {
  taskId: string;
  userId: string;
  userName: string;
  onAttachmentChange?: () => void;
}

const getFileIcon = (fileType: string) => {
  if (fileType.startsWith('image/')) {
    return <Image className="h-5 w-5 text-cyan-500" />;
  }
  if (fileType === 'application/pdf') {
    return <FileText className="h-5 w-5 text-red-500" />;
  }
  if (fileType.includes('spreadsheet') || fileType.includes('excel')) {
    return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
  }
  if (fileType.includes('document') || fileType.includes('word')) {
    return <FileText className="h-5 w-5 text-blue-500" />;
  }
  return <File className="h-5 w-5 text-muted-foreground" />;
};

export function TaskAttachmentList({
  taskId,
  userId,
  userName,
  onAttachmentChange,
}: TaskAttachmentListProps) {
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<TaskAttachment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const loadAttachments = async () => {
      setLoading(true);
      const data = await fetchTaskAttachments(taskId);
      setAttachments(data);
      setLoading(false);
    };

    loadAttachments();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`task-attachments-${taskId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'task_attachments',
          filter: `task_id=eq.${taskId}`,
        },
        (payload) => {
          const newAttachment = payload.new as any;
          setAttachments(prev => [{
            id: newAttachment.id,
            task_id: newAttachment.task_id,
            uploaded_by_id: newAttachment.uploaded_by_id,
            uploaded_by_name: newAttachment.uploaded_by_name,
            file_name: newAttachment.file_name,
            file_size: newAttachment.file_size,
            file_type: newAttachment.file_type,
            storage_path: newAttachment.storage_path,
            public_url: newAttachment.public_url,
            created_at: newAttachment.created_at,
          }, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'task_attachments',
          filter: `task_id=eq.${taskId}`,
        },
        (payload) => {
          const deletedId = (payload.old as any).id;
          setAttachments(prev => prev.filter(a => a.id !== deletedId));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [taskId]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    
    setIsDeleting(true);
    const success = await deleteTaskAttachment(deleteTarget, userId, userName);
    setIsDeleting(false);
    
    if (success) {
      toast.success('Attachment deleted');
      onAttachmentChange?.();
    } else {
      toast.error('Failed to delete attachment');
    }
    
    setDeleteTarget(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (attachments.length === 0) {
    return (
      <div className="text-center py-4 text-sm text-muted-foreground">
        No attachments yet
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {attachments.map((attachment) => (
          <div
            key={attachment.id}
            className="flex items-center gap-3 p-2 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
          >
            <div className="flex-shrink-0">
              {getFileIcon(attachment.file_type)}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" title={attachment.file_name}>
                {attachment.file_name}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(attachment.file_size)} • {attachment.uploaded_by_name} •{' '}
                {formatDistanceToNow(new Date(attachment.created_at), { addSuffix: true })}
              </p>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                asChild
              >
                <a href={attachment.public_url} download={attachment.file_name} target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4" />
                </a>
              </Button>
              
              {attachment.uploaded_by_id === userId && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => setDeleteTarget(attachment)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Attachment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget?.file_name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
