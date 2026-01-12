import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CertificateSelector } from '@/components/gamification/CertificateSelector';
import { addEvent } from '@/data/mockEventsData';
import { format } from 'date-fns';
import { CalendarIcon, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ActivityEventType, ActivityEvent, EVENT_TYPE_LABELS } from '@/types/events';
import { useToast } from '@/hooks/use-toast';

export function CreateEventTab() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState<ActivityEventType>('competition');
  const [venue, setVenue] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('');
  const [eligibility, setEligibility] = useState('');
  const [rules, setRules] = useState('');
  const [prizes, setPrizes] = useState<string[]>(['']);
  const [registrationStart, setRegistrationStart] = useState<Date>();
  const [registrationEnd, setRegistrationEnd] = useState<Date>();
  const [eventStart, setEventStart] = useState<Date>();
  const [eventEnd, setEventEnd] = useState<Date>();
  const [certificateTemplateId, setCertificateTemplateId] = useState<string | undefined>(undefined);
  const { toast } = useToast();

  const handleAddPrize = () => {
    setPrizes([...prizes, '']);
  };

  const handleRemovePrize = (index: number) => {
    setPrizes(prizes.filter((_, i) => i !== index));
  };

  const handlePrizeChange = (index: number, value: string) => {
    const newPrizes = [...prizes];
    newPrizes[index] = value;
    setPrizes(newPrizes);
  };

  const handleSubmit = (status: 'draft' | 'published') => {
    // Validation
    if (!title || !description || !eventType) {
      toast({
        title: 'Missing Required Fields',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    if (!registrationStart || !registrationEnd || !eventStart || !eventEnd) {
      toast({
        title: 'Missing Dates',
        description: 'Please select all date fields.',
        variant: 'destructive',
      });
      return;
    }

    const newEvent: ActivityEvent = {
      id: `evt-${Date.now()}`,
      title,
      description,
      event_type: eventType,
      status,
      registration_start: registrationStart.toISOString(),
      registration_end: registrationEnd.toISOString(),
      event_start: eventStart.toISOString(),
      event_end: eventEnd.toISOString(),
      venue,
      max_participants: maxParticipants ? parseInt(maxParticipants) : undefined,
      current_participants: 0,
      eligibility_criteria: eligibility,
      rules,
      prizes: prizes.filter(p => p.trim() !== ''),
      institution_ids: [],
      linked_project_ids: [],
      certificate_template_id: certificateTemplateId,
      created_by: 'sysadmin-001',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Save to localStorage
    addEvent(newEvent);

    toast({
      title: `Event ${status === 'published' ? 'Published' : 'Saved as Draft'}`,
      description: `"${title}" has been ${status === 'published' ? 'published' : 'saved'} successfully.`,
    });

    // Reset form
    setTitle('');
    setDescription('');
    setEventType('competition');
    setVenue('');
    setMaxParticipants('');
    setEligibility('');
    setRules('');
    setPrizes(['']);
    setRegistrationStart(undefined);
    setRegistrationEnd(undefined);
    setEventStart(undefined);
    setEventEnd(undefined);
    setCertificateTemplateId(undefined);
  };

  const eventTypeLabels = EVENT_TYPE_LABELS;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Event</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="title">Event Title *</Label>
              <Input
                id="title"
                placeholder="e.g., National Innovation Hackathon 2025"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe the event, its objectives, and what participants can expect..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="eventType">Event Type *</Label>
                <Select value={eventType} onValueChange={(value) => setEventType(value as ActivityEventType)}>
                  <SelectTrigger id="eventType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(eventTypeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="venue">Venue</Label>
                <Input
                  id="venue"
                  placeholder="e.g., Innovation Center, Tech Park"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Important Dates *</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Registration Start</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !registrationStart && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {registrationStart ? format(registrationStart, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={registrationStart}
                      onSelect={setRegistrationStart}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Registration End</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !registrationEnd && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {registrationEnd ? format(registrationEnd, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={registrationEnd}
                      onSelect={setRegistrationEnd}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Event Start</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !eventStart && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {eventStart ? format(eventStart, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={eventStart}
                      onSelect={setEventStart}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Event End</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !eventEnd && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {eventEnd ? format(eventEnd, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={eventEnd}
                      onSelect={setEventEnd}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Event Details</h3>
            
            <div className="space-y-2">
              <Label htmlFor="maxParticipants">Maximum Participants</Label>
              <Input
                id="maxParticipants"
                type="number"
                placeholder="e.g., 200"
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="eligibility">Eligibility Criteria</Label>
              <Textarea
                id="eligibility"
                placeholder="Who can participate? Any grade/class restrictions?"
                value={eligibility}
                onChange={(e) => setEligibility(e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rules">Rules & Guidelines</Label>
              <Textarea
                id="rules"
                placeholder="List the rules and guidelines for participation..."
                value={rules}
                onChange={(e) => setRules(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          {/* Prizes */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Prizes</h3>
              <Button type="button" variant="outline" size="sm" onClick={handleAddPrize}>
                <Plus className="h-4 w-4 mr-2" />
                Add Prize
              </Button>
            </div>
            
            <div className="space-y-2">
              {prizes.map((prize, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder={`Prize ${index + 1}`}
                    value={prize}
                    onChange={(e) => handlePrizeChange(index, e.target.value)}
                  />
                  {prizes.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => handleRemovePrize(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Certificate */}
          <CertificateSelector
            category="event"
            selectedTemplateId={certificateTemplateId}
            onSelect={setCertificateTemplateId}
          />

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <Button
              variant="outline"
              onClick={() => handleSubmit('draft')}
            >
              Save as Draft
            </Button>
            <Button onClick={() => handleSubmit('published')}>
              Publish Event
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
