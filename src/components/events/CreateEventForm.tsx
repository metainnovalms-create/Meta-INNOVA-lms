import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { CalendarIcon, Upload, X, FileText, Loader2, Building, GraduationCap, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ActivityEventType, EVENT_TYPE_LABELS } from '@/types/events';
import { useCreateEvent, useUploadBrochure, useUploadAttachment, usePublishEvent } from '@/hooks/useEvents';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CreateEventFormProps {
  onSuccess?: () => void;
}

interface Institution {
  id: string;
  name: string;
  classes: { id: string; class_name: string; section?: string }[];
}

export function CreateEventForm({ onSuccess }: CreateEventFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState<ActivityEventType>('competition');
  const [venue, setVenue] = useState('');
  const [registrationStart, setRegistrationStart] = useState<Date>();
  const [registrationEnd, setRegistrationEnd] = useState<Date>();
  const [eventStart, setEventStart] = useState<Date>();
  const [eventEnd, setEventEnd] = useState<Date>();
  const [brochureFile, setBrochureFile] = useState<File | null>(null);
  const [brochureUrl, setBrochureUrl] = useState<string>('');
  const [attachments, setAttachments] = useState<{ name: string; url: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  // Institution/Class selection
  const [showPublishing, setShowPublishing] = useState(false);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loadingInstitutions, setLoadingInstitutions] = useState(false);
  const [selectedClasses, setSelectedClasses] = useState<{ institution_id: string; class_id: string }[]>([]);
  const [expandedInstitutions, setExpandedInstitutions] = useState<Set<string>>(new Set());

  const createEvent = useCreateEvent();
  const uploadBrochure = useUploadBrochure();
  const uploadAttachment = useUploadAttachment();
  const publishEvent = usePublishEvent();

  useEffect(() => {
    if (showPublishing && institutions.length === 0) {
      fetchInstitutionsAndClasses();
    }
  }, [showPublishing]);

  const fetchInstitutionsAndClasses = async () => {
    setLoadingInstitutions(true);
    try {
      const { data: institutionsData, error: instError } = await supabase
        .from('institutions')
        .select('id, name')
        .eq('status', 'active')
        .order('name');

      if (instError) throw instError;

      const institutionsWithClasses: Institution[] = [];

      for (const inst of institutionsData || []) {
        const { data: classesData } = await supabase
          .from('classes')
          .select('id, class_name, section')
          .eq('institution_id', inst.id)
          .eq('status', 'active')
          .order('display_order');

        institutionsWithClasses.push({
          id: inst.id,
          name: inst.name,
          classes: classesData || [],
        });
      }

      setInstitutions(institutionsWithClasses);
    } catch (error) {
      console.error('Error fetching institutions:', error);
      toast.error('Failed to load institutions');
    } finally {
      setLoadingInstitutions(false);
    }
  };

  const toggleInstitutionExpand = (instId: string) => {
    const newExpanded = new Set(expandedInstitutions);
    if (newExpanded.has(instId)) {
      newExpanded.delete(instId);
    } else {
      newExpanded.add(instId);
    }
    setExpandedInstitutions(newExpanded);
  };

  const toggleClass = (institutionId: string, classId: string) => {
    const exists = selectedClasses.find(
      (c) => c.institution_id === institutionId && c.class_id === classId
    );

    if (exists) {
      setSelectedClasses(
        selectedClasses.filter(
          (c) => !(c.institution_id === institutionId && c.class_id === classId)
        )
      );
    } else {
      setSelectedClasses([...selectedClasses, { institution_id: institutionId, class_id: classId }]);
    }
  };

  const toggleAllClassesInInstitution = (institution: Institution) => {
    const allSelected = institution.classes.every((cls) =>
      selectedClasses.some((s) => s.institution_id === institution.id && s.class_id === cls.id)
    );

    if (allSelected) {
      setSelectedClasses(
        selectedClasses.filter((s) => s.institution_id !== institution.id)
      );
    } else {
      const newSelections = institution.classes.map((cls) => ({
        institution_id: institution.id,
        class_id: cls.id,
      }));
      const filtered = selectedClasses.filter((s) => s.institution_id !== institution.id);
      setSelectedClasses([...filtered, ...newSelections]);
    }
  };

  const isClassSelected = (institutionId: string, classId: string) => {
    return selectedClasses.some(
      (c) => c.institution_id === institutionId && c.class_id === classId
    );
  };

  const isAllClassesSelected = (institution: Institution) => {
    return institution.classes.length > 0 && institution.classes.every((cls) =>
      selectedClasses.some((s) => s.institution_id === institution.id && s.class_id === cls.id)
    );
  };

  const handleBrochureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBrochureFile(file);
    setIsUploading(true);

    try {
      const url = await uploadBrochure.mutateAsync(file);
      setBrochureUrl(url);
      toast.success('Brochure uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload brochure');
      setBrochureFile(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAttachmentAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const attachment = await uploadAttachment.mutateAsync(file);
      setAttachments([...attachments, attachment]);
      toast.success('Attachment uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload attachment');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title || !description || !eventType || !eventStart || !registrationEnd) {
      toast.error('Please fill in all required fields including Registration End date');
      return;
    }

    try {
      const createdEvent = await createEvent.mutateAsync({
        title,
        description,
        event_type: eventType,
        venue: venue || undefined,
        registration_start: registrationStart?.toISOString(),
        registration_end: registrationEnd?.toISOString(),
        event_start: eventStart.toISOString(),
        event_end: eventEnd?.toISOString(),
        brochure_url: brochureUrl || undefined,
        attachments: attachments.length > 0 ? attachments : undefined,
      });

      // If classes are selected, publish immediately
      if (selectedClasses.length > 0 && createdEvent) {
        await publishEvent.mutateAsync({
          event_id: createdEvent.id,
          assignments: selectedClasses,
        });
      }

      // Reset form
      setTitle('');
      setDescription('');
      setEventType('competition');
      setVenue('');
      setRegistrationStart(undefined);
      setRegistrationEnd(undefined);
      setEventStart(undefined);
      setEventEnd(undefined);
      setBrochureFile(null);
      setBrochureUrl('');
      setAttachments([]);
      setSelectedClasses([]);
      setShowPublishing(false);
      setExpandedInstitutions(new Set());

      onSuccess?.();
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Event</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
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
                    {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="venue">Venue (Optional)</Label>
                <Input
                  id="venue"
                  placeholder="e.g., Innovation Center, Tech Park"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Important Dates */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Important Dates</h3>
            
            {/* Registration Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Registration Start (Optional)</Label>
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
                <Label>Registration End *</Label>
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
            </div>

            {/* Event Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Event Start *</Label>
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
                <Label>Event End (Optional)</Label>
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

          {/* Brochure/Document Upload */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Brochure / Document</h3>
            
            <div className="space-y-2">
              <Label>Upload Brochure (PDF, DOC, etc.)</Label>
              <div className="flex items-center gap-4">
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx"
                  onChange={handleBrochureChange}
                  disabled={isUploading}
                  className="max-w-xs"
                />
                {isUploading && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>
              {brochureFile && brochureUrl && (
                <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm">{brochureFile.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => {
                      setBrochureFile(null);
                      setBrochureUrl('');
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Additional Attachments</Label>
              <Input
                type="file"
                onChange={handleAttachmentAdd}
                disabled={isUploading}
                className="max-w-xs"
              />
              {attachments.length > 0 && (
                <div className="space-y-2 mt-2">
                  {attachments.map((att, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded-md">
                      <FileText className="h-4 w-4" />
                      <span className="text-sm flex-1">{att.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleRemoveAttachment(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Institution & Class Selection */}
          <div className="space-y-4">
            <Collapsible open={showPublishing} onOpenChange={setShowPublishing}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <span className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Publish to Institutions/Classes (Optional)
                  </span>
                  {showPublishing ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4">
                <div className="border rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    Select institutions and classes to publish this event immediately. 
                    If none selected, the event will be saved as a draft.
                  </p>
                  
                  {loadingInstitutions ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                  ) : (
                    <ScrollArea className="h-[250px]">
                      <div className="space-y-3">
                        {institutions.map((institution) => (
                          <div key={institution.id} className="border rounded-lg p-3">
                            <div className="flex items-center gap-3">
                              <Checkbox
                                id={`create-inst-${institution.id}`}
                                checked={isAllClassesSelected(institution)}
                                onCheckedChange={() => toggleAllClassesInInstitution(institution)}
                              />
                              <div
                                className="flex items-center gap-2 flex-1 cursor-pointer"
                                onClick={() => toggleInstitutionExpand(institution.id)}
                              >
                                <Building className="h-4 w-4 text-muted-foreground" />
                                <Label className="cursor-pointer font-medium text-sm">
                                  {institution.name}
                                </Label>
                                <span className="text-xs text-muted-foreground">
                                  ({institution.classes.length} classes)
                                </span>
                                {expandedInstitutions.has(institution.id) ? (
                                  <ChevronDown className="h-4 w-4 ml-auto" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 ml-auto" />
                                )}
                              </div>
                            </div>

                            {expandedInstitutions.has(institution.id) && institution.classes.length > 0 && (
                              <div className="ml-8 mt-3 space-y-2">
                                {institution.classes.map((cls) => (
                                  <div key={cls.id} className="flex items-center gap-3">
                                    <Checkbox
                                      id={`create-class-${cls.id}`}
                                      checked={isClassSelected(institution.id, cls.id)}
                                      onCheckedChange={() => toggleClass(institution.id, cls.id)}
                                    />
                                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                                    <Label htmlFor={`create-class-${cls.id}`} className="cursor-pointer text-sm">
                                      {cls.class_name} {cls.section ? `- ${cls.section}` : ''}
                                    </Label>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}

                        {institutions.length === 0 && (
                          <p className="text-center text-muted-foreground py-4 text-sm">
                            No institutions found
                          </p>
                        )}
                      </div>
                    </ScrollArea>
                  )}
                  
                  {selectedClasses.length > 0 && (
                    <p className="text-sm text-muted-foreground mt-3">
                      {selectedClasses.length} class(es) selected - Event will be published immediately
                    </p>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <Button
              onClick={handleSubmit}
              disabled={createEvent.isPending || publishEvent.isPending || isUploading}
            >
              {createEvent.isPending || publishEvent.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {selectedClasses.length > 0 ? 'Creating & Publishing...' : 'Creating...'}
                </>
              ) : (
                selectedClasses.length > 0 ? 'Create & Publish Event' : 'Create Event (Draft)'
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
