import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { InstitutionEvent, EventType } from '@/types/calendar';
import { mockInstitutions } from '@/data/mockInstitutionData';
import { Trash2, Building } from 'lucide-react';

interface CreateEditEventDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: InstitutionEvent) => void;
  onDelete: (eventId: string) => void;
  event?: InstitutionEvent;
  initialStart?: Date;
  initialEnd?: Date;
  mode?: 'company' | 'institution';
  institutionId?: string;
}

const colorOptions = [
  { label: 'Blue', value: '#3b82f6' },
  { label: 'Green', value: '#10b981' },
  { label: 'Red', value: '#ef4444' },
  { label: 'Orange', value: '#f97316' },
  { label: 'Purple', value: '#a855f7' },
  { label: 'Pink', value: '#ec4899' },
  { label: 'Yellow', value: '#eab308' },
  { label: 'Teal', value: '#14b8a6' },
  { label: 'Indigo', value: '#6366f1' },
  { label: 'Cyan', value: '#06b6d4' },
];

const eventTypes: { label: string; value: EventType }[] = [
  { label: 'Academic', value: 'academic' },
  { label: 'Extra Curricular', value: 'extra_curricular' },
  { label: 'Administrative', value: 'administrative' },
  { label: 'Important', value: 'important' },
];

export function CreateEditEventDialog({
  isOpen,
  onClose,
  onSave,
  onDelete,
  event,
  initialStart,
  initialEnd,
  mode = 'company',
  institutionId,
}: CreateEditEventDialogProps) {
  const isEditMode = !!event;
  
  // Get institution name from ID
  const getInstitutionName = (id?: string) => {
    if (!id) return undefined;
    const institutionsArray = Object.values(mockInstitutions);
    return institutionsArray.find(inst => inst.id === id)?.name;
  };

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_type: 'academic' as EventType,
    institution_name: '',
    start_datetime: '',
    end_datetime: '',
    location: '',
    color: '',
    notify_participants: true,
  });

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title,
        description: event.description,
        event_type: event.event_type,
        institution_name: event.institution_name || '',
        start_datetime: event.start_datetime.slice(0, 16), // Format for datetime-local
        end_datetime: event.end_datetime.slice(0, 16),
        location: event.location || '',
        color: event.color || '',
        notify_participants: event.notify_participants,
      });
    } else if (initialStart && initialEnd) {
      const formatDateTime = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      };

      setFormData(prev => ({
        ...prev,
        start_datetime: formatDateTime(initialStart),
        end_datetime: formatDateTime(initialEnd),
      }));
    }
  }, [event, initialStart, initialEnd]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const eventData: InstitutionEvent = {
      id: event?.id || `event_${Date.now()}`,
      title: formData.title,
      description: formData.description,
      event_type: formData.event_type,
      institution_id: mode === 'institution' ? institutionId : undefined,
      institution_name: mode === 'institution' && institutionId 
        ? getInstitutionName(institutionId) 
        : formData.institution_name || undefined,
      start_datetime: new Date(formData.start_datetime).toISOString(),
      end_datetime: new Date(formData.end_datetime).toISOString(),
      location: formData.location,
      color: formData.color,
      notify_participants: formData.notify_participants,
      recurrence: 'none',
      created_by: 'System Admin',
      created_at: event?.created_at || new Date().toISOString(),
    };

    onSave(eventData);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      event_type: 'academic',
      institution_name: '',
      start_datetime: '',
      end_datetime: '',
      location: '',
      color: '',
      notify_participants: true,
    });
    onClose();
  };

  const handleDelete = () => {
    if (event && confirm('Are you sure you want to delete this event?')) {
      onDelete(event.id);
      handleClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Event' : 'Create New Event'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Update event details below' : 'Fill in the details to create a new event'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Event Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter event title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter event description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="event_type">Event Type *</Label>
              <Select
                value={formData.event_type}
                onValueChange={(value: EventType) => setFormData(prev => ({ ...prev, event_type: value }))}
              >
                <SelectTrigger id="event_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {eventTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="institution">Institution</Label>
              <Input
                id="institution"
                value={formData.institution_name}
                onChange={(e) => setFormData(prev => ({ ...prev, institution_name: e.target.value }))}
                placeholder="All Institutions"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_datetime">Start Date & Time *</Label>
              <Input
                id="start_datetime"
                type="datetime-local"
                value={formData.start_datetime}
                onChange={(e) => setFormData(prev => ({ ...prev, start_datetime: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_datetime">End Date & Time *</Label>
              <Input
                id="end_datetime"
                type="datetime-local"
                value={formData.end_datetime}
                onChange={(e) => setFormData(prev => ({ ...prev, end_datetime: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="Enter event location"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Event Color</Label>
            <Select
              value={formData.color}
              onValueChange={(value) => setFormData(prev => ({ ...prev, color: value }))}
            >
              <SelectTrigger id="color">
                <SelectValue placeholder="Select a color (optional)" />
              </SelectTrigger>
              <SelectContent>
                {colorOptions.map(color => (
                  <SelectItem key={color.value} value={color.value}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full border"
                        style={{ backgroundColor: color.value }}
                      />
                      {color.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="notify"
              checked={formData.notify_participants}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, notify_participants: checked === true }))
              }
            />
            <Label htmlFor="notify" className="cursor-pointer">
              Notify participants about this event
            </Label>
          </div>

          <DialogFooter className="gap-2">
            {isEditMode && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                className="mr-auto"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit">
              {isEditMode ? 'Update Event' : 'Create Event'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
