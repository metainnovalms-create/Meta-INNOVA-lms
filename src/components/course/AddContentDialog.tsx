import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Upload } from 'lucide-react';
import { uploadCourseContent } from '@/services/courseStorage.service';

type ContentType = 'pdf' | 'ppt' | 'youtube';

interface AddContentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (content: {
    title: string;
    type: ContentType;
    file_path?: string;
    youtube_url?: string;
    duration_minutes?: number;
    file_size_mb?: number;
  }) => void;
  sessionName: string;
  courseId: string;
}

export function AddContentDialog({ 
  open, 
  onOpenChange, 
  onSave, 
  sessionName,
  courseId 
}: AddContentDialogProps) {
  const [contentType, setContentType] = useState<ContentType>('pdf');
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [duration, setDuration] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    if (['pdf', 'ppt'].includes(contentType) && !file) {
      toast.error('Please upload a file');
      return;
    }

    if (contentType === 'youtube' && !url.trim()) {
      toast.error('Please enter a YouTube URL');
      return;
    }

    try {
      setIsUploading(true);

      let filePath: string | undefined;
      let fileSizeMb: number | undefined;

      // Upload file if it's PDF or PPT
      if (['pdf', 'ppt'].includes(contentType) && file) {
        const uploadResult = await uploadCourseContent(
          file, 
          courseId, 
          contentType as 'pdf' | 'ppt'
        );
        filePath = uploadResult.path;
        fileSizeMb = uploadResult.fileSizeMb;
        
        // CRITICAL VALIDATION: Ensure file_path is set after upload
        if (!filePath) {
          throw new Error('File upload succeeded but storage path was not returned. Please try again.');
        }
      }

      const contentData: {
        title: string;
        type: ContentType;
        file_path?: string;
        youtube_url?: string;
        duration_minutes?: number;
        file_size_mb?: number;
      } = {
        title: title.trim(),
        type: contentType,
      };

      // For PDF/PPT, file_path is required
      if (['pdf', 'ppt'].includes(contentType)) {
        if (!filePath) {
          throw new Error('File path is required for PDF/PPT content');
        }
        contentData.file_path = filePath;
        contentData.file_size_mb = fileSizeMb;
      }

      if (contentType === 'youtube' && url) {
        contentData.youtube_url = url;
      }

      if (duration) {
        contentData.duration_minutes = parseInt(duration);
      }

      onSave(contentData);
      resetForm();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(`Failed to upload content: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setUrl('');
    setDuration('');
    setFile(null);
    setContentType('pdf');
  };

  const getAcceptedFileTypes = (type: ContentType) => {
    const acceptMap: Record<ContentType, string> = {
      pdf: '.pdf',
      ppt: '.ppt,.pptx',
      youtube: '',
    };
    return acceptMap[type];
  };

  const getMaxFileSize = (type: ContentType) => {
    const sizeMap: Record<ContentType, string> = {
      pdf: '50MB',
      ppt: '50MB',
      youtube: '',
    };
    return sizeMap[type];
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const maxSizes: Record<string, number> = {
      pdf: 50 * 1024 * 1024,
      ppt: 50 * 1024 * 1024,
    };

    if (selectedFile.size > maxSizes[contentType]) {
      toast.error(`File size exceeds ${getMaxFileSize(contentType)}`);
      return;
    }

    setFile(selectedFile);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Content to {sessionName}</DialogTitle>
          <DialogDescription>
            Upload PDF, PowerPoint files or add YouTube video links. Content will be displayed securely without download options.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Content Type *</Label>
            <Select 
              value={contentType} 
              onValueChange={(value) => {
                setContentType(value as ContentType);
                setFile(null);
                setUrl('');
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF Document</SelectItem>
                <SelectItem value="ppt">Presentation (PPT/PPTX)</SelectItem>
                <SelectItem value="youtube">YouTube Video</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="content-title">Content Title *</Label>
            <Input
              id="content-title"
              placeholder="e.g., Introduction to AI Concepts"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          
          {['pdf', 'ppt'].includes(contentType) && (
            <div>
              <Label htmlFor="content-file">Upload File *</Label>
              <div className="mt-2">
                {!file ? (
                  <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer">
                    <input
                      id="content-file"
                      type="file"
                      accept={getAcceptedFileTypes(contentType)}
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label htmlFor="content-file" className="cursor-pointer">
                      <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm font-medium">Click to upload</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {contentType === 'pdf' ? 'PDF files' : 'PPT/PPTX files'} up to {getMaxFileSize(contentType)}
                      </p>
                    </label>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{file.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setFile(null)}
                    >
                      Remove
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {contentType === 'youtube' && (
            <>
              <div>
                <Label htmlFor="content-url">YouTube URL *</Label>
                <Input
                  id="content-url"
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Paste the full YouTube video URL
                </p>
              </div>

              <div>
                <Label htmlFor="content-duration">Duration (minutes)</Label>
                <Input
                  id="content-duration"
                  type="number"
                  min="1"
                  placeholder="15"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                />
              </div>
            </>
          )}
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Add Content'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
