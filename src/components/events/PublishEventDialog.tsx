import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Building, GraduationCap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { usePublishEvent } from '@/hooks/useEvents';
import { Event } from '@/types/events';
import { toast } from 'sonner';

interface PublishEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: Event | null;
}

interface Institution {
  id: string;
  name: string;
  classes: { id: string; class_name: string; section?: string }[];
}

export function PublishEventDialog({ open, onOpenChange, event }: PublishEventDialogProps) {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<{ institution_id: string; class_id: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedInstitutions, setExpandedInstitutions] = useState<Set<string>>(new Set());

  const publishEvent = usePublishEvent();

  useEffect(() => {
    if (open) {
      fetchInstitutionsAndClasses();
    }
  }, [open]);

  const fetchInstitutionsAndClasses = async () => {
    setLoading(true);
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
      setLoading(false);
    }
  };

  const toggleInstitution = (instId: string) => {
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
      // Deselect all
      setSelectedClasses(
        selectedClasses.filter((s) => s.institution_id !== institution.id)
      );
    } else {
      // Select all
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
    return institution.classes.every((cls) =>
      selectedClasses.some((s) => s.institution_id === institution.id && s.class_id === cls.id)
    );
  };

  const handlePublish = async () => {
    if (!event) return;

    if (selectedClasses.length === 0) {
      toast.error('Please select at least one class');
      return;
    }

    try {
      await publishEvent.mutateAsync({
        event_id: event.id,
        assignments: selectedClasses,
      });
      onOpenChange(false);
      setSelectedClasses([]);
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Publish Event</DialogTitle>
          <DialogDescription>
            Select the schools and classes to publish "{event?.title}" to.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {institutions.map((institution) => (
                <div key={institution.id} className="border rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id={`inst-${institution.id}`}
                      checked={isAllClassesSelected(institution)}
                      onCheckedChange={() => toggleAllClassesInInstitution(institution)}
                    />
                    <div
                      className="flex items-center gap-2 flex-1 cursor-pointer"
                      onClick={() => toggleInstitution(institution.id)}
                    >
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <Label className="cursor-pointer font-medium">
                        {institution.name}
                      </Label>
                      <span className="text-xs text-muted-foreground">
                        ({institution.classes.length} classes)
                      </span>
                    </div>
                  </div>

                  {expandedInstitutions.has(institution.id) && institution.classes.length > 0 && (
                    <div className="ml-8 mt-3 space-y-2">
                      {institution.classes.map((cls) => (
                        <div key={cls.id} className="flex items-center gap-3">
                          <Checkbox
                            id={`class-${cls.id}`}
                            checked={isClassSelected(institution.id, cls.id)}
                            onCheckedChange={() => toggleClass(institution.id, cls.id)}
                          />
                          <GraduationCap className="h-4 w-4 text-muted-foreground" />
                          <Label htmlFor={`class-${cls.id}`} className="cursor-pointer">
                            {cls.class_name} {cls.section ? `- ${cls.section}` : ''}
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {institutions.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No institutions found
                </p>
              )}
            </div>
          </ScrollArea>
        )}

        <DialogFooter>
          <div className="flex items-center justify-between w-full">
            <span className="text-sm text-muted-foreground">
              {selectedClasses.length} class(es) selected
            </span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handlePublish}
                disabled={publishEvent.isPending || selectedClasses.length === 0}
              >
                {publishEvent.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  'Publish Event'
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
