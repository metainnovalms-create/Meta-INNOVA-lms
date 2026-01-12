import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CourseContent } from '@/types/course';
import { toast } from 'sonner';

interface EditContentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (content: any) => void;
  content: CourseContent | null;
}

export function EditContentDialog({ open, onOpenChange, onSave, content }: EditContentDialogProps) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [duration, setDuration] = useState('');

  useEffect(() => {
    if (content) {
      setTitle(content.title);
      setUrl(content.youtube_url || content.external_url || content.file_url || '');
      setDuration(content.duration_minutes?.toString() || '');
    }
  }, [content, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    const contentData: any = {
      title: title.trim()
    };

    if (url) {
      if (content?.type === 'youtube') {
        contentData.youtube_url = url;
      } else if (content?.type === 'link' || content?.type === 'simulation') {
        contentData.external_url = url;
      } else {
        contentData.file_url = url;
      }
    }

    if (duration) {
      contentData.duration_minutes = parseInt(duration);
    }

    onSave(contentData);
    onOpenChange(false);
  };

  if (!content) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Content</DialogTitle>
          <DialogDescription>Update content information</DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="edit-title">Content Title *</Label>
            <Input
              id="edit-title"
              placeholder="e.g., Introduction to AI Concepts"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          
          {['youtube', 'link', 'simulation'].includes(content.type) && (
            <div>
              <Label htmlFor="edit-url">
                {content.type === 'youtube' ? 'YouTube URL' : 'URL'}
              </Label>
              <Input
                id="edit-url"
                type="url"
                placeholder="https://..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
          )}
          
          {['video', 'youtube'].includes(content.type) && (
            <div>
              <Label htmlFor="edit-duration">Duration (minutes)</Label>
              <Input
                id="edit-duration"
                type="number"
                min="1"
                placeholder="15"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>
          )}

          <div className="text-sm text-muted-foreground">
            <p>Type: {content.type.toUpperCase()}</p>
            {content.file_size_mb && <p>Size: {content.file_size_mb.toFixed(1)} MB</p>}
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
