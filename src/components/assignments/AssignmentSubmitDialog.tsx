import { useState, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, X, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { assignmentService, AssignmentWithClasses } from '@/services/assignment.service';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface AssignmentSubmitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignment: AssignmentWithClasses;
  studentId: string;
  institutionId: string;
  classId: string;
  onSubmitSuccess: () => void;
}

export function AssignmentSubmitDialog({
  open,
  onOpenChange,
  assignment,
  studentId,
  institutionId,
  classId,
  onSubmitSuccess,
}: AssignmentSubmitDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const validateFile = (file: File): boolean => {
    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are allowed');
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error('File size must be less than 10MB');
      return false;
    }
    return true;
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (validateFile(droppedFile)) {
        setFile(droppedFile);
      }
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      setUploading(true);
      setUploadProgress(10);

      // Upload to storage
      const fileName = `${studentId}/${assignment.id}/${Date.now()}.pdf`;
      
      setUploadProgress(30);
      
      const { data, error } = await supabase.storage
        .from('assignment-submissions')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) throw error;

      setUploadProgress(60);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('assignment-submissions')
        .getPublicUrl(data.path);

      setUploadProgress(80);

      // Submit assignment
      await assignmentService.submitAssignment({
        assignmentId: assignment.id,
        studentId,
        institutionId,
        classId,
        pdfUrl: urlData.publicUrl,
      });

      setUploadProgress(100);

      toast.success('Assignment submitted successfully!');
      onSubmitSuccess();
      handleClose();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to submit assignment');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleClose = () => {
    setFile(null);
    setUploadProgress(0);
    onOpenChange(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Submit Assignment</DialogTitle>
          <DialogDescription>
            Upload your PDF submission for "{assignment.title}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Assignment details */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Due Date:</span>
              <span className="font-medium">
                {format(new Date(assignment.submission_end_date), 'MMM d, yyyy HH:mm')}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Marks:</span>
              <span className="font-medium">{assignment.total_marks}</span>
            </div>
          </div>

          {/* Drop zone */}
          <div
            className={cn(
              'relative border-2 border-dashed rounded-lg p-8 transition-colors',
              dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25',
              file && 'border-green-500 bg-green-500/5'
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={handleFileSelect}
            />

            {file ? (
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                  <FileText className="h-6 w-6 text-red-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setFile(null)}
                  disabled={uploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="text-center">
                <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground mb-2">
                  Drag and drop your PDF here, or
                </p>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Browse Files
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  PDF files only, max 10MB
                </p>
              </div>
            )}
          </div>

          {/* Upload progress */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}

          {/* Action buttons */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose} disabled={uploading}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={!file || uploading}>
              {uploading ? (
                <>Submitting...</>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Submit Assignment
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
