import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { InstitutionEvent } from '@/types/calendar';
import { Badge } from '@/components/ui/badge';
import { getEventTypeColor } from '@/utils/calendarHelpers';
import { format } from 'date-fns';
import { Calendar, Clock, MapPin, User, Edit } from 'lucide-react';

interface EventDialogProps {
  event?: InstitutionEvent;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: () => void;
}

export function EventDialog({ event, isOpen, onClose, onEdit }: EventDialogProps) {
  if (!event) return null;

  const typeColors = getEventTypeColor(event.event_type);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">{event.title}</DialogTitle>
          <DialogDescription>{event.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center gap-2">
            <Badge className={`${typeColors.bg} ${typeColors.text} border ${typeColors.border}`}>
              {event.event_type.replace('_', ' ')}
            </Badge>
          </div>

          <div className="grid gap-4">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Date & Time</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(event.start_datetime), 'EEEE, MMMM dd, yyyy')}
                </p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(event.start_datetime), 'HH:mm')} -{' '}
                  {format(new Date(event.end_datetime), 'HH:mm')}
                </p>
              </div>
            </div>

            {event.location && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Location</p>
                  <p className="text-sm text-muted-foreground">{event.location}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Institution</p>
                <p className="text-sm text-muted-foreground">
                  {event.institution_name || 'All Institutions'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Created By</p>
                <p className="text-sm text-muted-foreground">
                  {event.created_by} on {format(new Date(event.created_at), 'MMM dd, yyyy')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {onEdit && (
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Event
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
