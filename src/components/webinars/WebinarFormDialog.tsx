import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Webinar, WebinarFormData } from '@/services/webinar.service';
import { toast } from 'sonner';

interface WebinarFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  webinar?: Webinar | null;
  onSubmit: (data: WebinarFormData) => Promise<void>;
}

export function WebinarFormDialog({ open, onOpenChange, webinar, onSubmit }: WebinarFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<WebinarFormData>({
    title: '',
    description: '',
    youtube_url: '',
    guest_name: '',
    guest_details: '',
    webinar_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (webinar) {
      setFormData({
        title: webinar.title,
        description: webinar.description || '',
        youtube_url: webinar.youtube_url,
        guest_name: webinar.guest_name || '',
        guest_details: webinar.guest_details || '',
        webinar_date: webinar.webinar_date.split('T')[0]
      });
    } else {
      setFormData({
        title: '',
        description: '',
        youtube_url: '',
        guest_name: '',
        guest_details: '',
        webinar_date: new Date().toISOString().split('T')[0]
      });
    }
  }, [webinar, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }
    
    if (!formData.youtube_url.trim()) {
      toast.error('YouTube URL is required');
      return;
    }

    // Validate YouTube URL
    const youtubePattern = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|^[a-zA-Z0-9_-]{11}$)/;
    if (!youtubePattern.test(formData.youtube_url)) {
      toast.error('Please enter a valid YouTube URL');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        ...formData,
        webinar_date: new Date(formData.webinar_date).toISOString()
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving webinar:', error);
      toast.error('Failed to save webinar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{webinar ? 'Edit Webinar' : 'Create Webinar'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Webinar Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter webinar title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter webinar description"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="youtube_url">YouTube URL *</Label>
            <Input
              id="youtube_url"
              value={formData.youtube_url}
              onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
              placeholder="https://youtube.com/watch?v=..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="guest_name">Guest Name</Label>
            <Input
              id="guest_name"
              value={formData.guest_name}
              onChange={(e) => setFormData({ ...formData, guest_name: e.target.value })}
              placeholder="Enter guest speaker name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="guest_details">Guest Details</Label>
            <Textarea
              id="guest_details"
              value={formData.guest_details}
              onChange={(e) => setFormData({ ...formData, guest_details: e.target.value })}
              placeholder="Enter guest speaker bio/details"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="webinar_date">Webinar Date *</Label>
            <Input
              id="webinar_date"
              type="date"
              value={formData.webinar_date}
              onChange={(e) => setFormData({ ...formData, webinar_date: e.target.value })}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : webinar ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
