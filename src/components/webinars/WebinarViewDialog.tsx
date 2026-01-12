import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Webinar } from '@/services/webinar.service';
import { YouTubePlayer } from './YouTubePlayer';
import { Calendar, User } from 'lucide-react';
import { format } from 'date-fns';

interface WebinarViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  webinar: Webinar | null;
}

export function WebinarViewDialog({ open, onOpenChange, webinar }: WebinarViewDialogProps) {
  if (!webinar) return null;

  const isUpcoming = new Date(webinar.webinar_date) > new Date();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle className="text-xl">{webinar.title}</DialogTitle>
            {isUpcoming && <Badge variant="secondary">Upcoming</Badge>}
          </div>
        </DialogHeader>
        
        <div className="space-y-4">
          <YouTubePlayer url={webinar.youtube_url} title={webinar.title} />
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{format(new Date(webinar.webinar_date), 'PPP')}</span>
              </div>
              
              {webinar.guest_name && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 font-medium">
                    <User className="h-4 w-4" />
                    <span>Guest Speaker</span>
                  </div>
                  <p className="text-sm ml-6">{webinar.guest_name}</p>
                  {webinar.guest_details && (
                    <p className="text-sm text-muted-foreground ml-6">{webinar.guest_details}</p>
                  )}
                </div>
              )}
            </div>
            
            {webinar.description && (
              <div className="space-y-1">
                <p className="font-medium">Description</p>
                <p className="text-sm text-muted-foreground">{webinar.description}</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
