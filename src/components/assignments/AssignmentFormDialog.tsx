import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { AssignmentWithClasses, AssignmentFormData } from '@/services/assignment.service';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface Institution {
  id: string;
  name: string;
}

interface Class {
  id: string;
  class_name: string;
  section: string | null;
  institution_id: string;
}

interface AssignmentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignment?: AssignmentWithClasses | null;
  onSubmit: (data: AssignmentFormData) => Promise<void>;
}

export function AssignmentFormDialog({
  open,
  onOpenChange,
  assignment,
  onSubmit,
}: AssignmentFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedInstitution, setSelectedInstitution] = useState<string>('');
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: '',
    submission_end_date: '',
    total_marks: 100,
    passing_marks: 40,
    allow_resubmit: true,
    status: 'draft' as 'draft' | 'published',
  });

  const isEdit = !!assignment;

  useEffect(() => {
    if (open) {
      fetchInstitutions();
      if (assignment) {
        setFormData({
          title: assignment.title,
          description: assignment.description || '',
          start_date: assignment.start_date.split('T')[0],
          submission_end_date: assignment.submission_end_date.split('T')[0],
          total_marks: assignment.total_marks || 100,
          passing_marks: assignment.passing_marks || 40,
          allow_resubmit: assignment.allow_resubmit !== false,
          status: assignment.status as 'draft' | 'published',
        });
        setSelectedInstitution(assignment.institution_id || '');
        setSelectedClasses(assignment.classes.map(c => c.id));
      } else {
        resetForm();
      }
    }
  }, [open, assignment]);

  useEffect(() => {
    if (selectedInstitution) {
      fetchClasses(selectedInstitution);
    } else {
      setClasses([]);
      setSelectedClasses([]);
    }
  }, [selectedInstitution]);

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      start_date: '',
      submission_end_date: '',
      total_marks: 100,
      passing_marks: 40,
      allow_resubmit: true,
      status: 'draft',
    });
    setSelectedInstitution('');
    setSelectedClasses([]);
  };

  const fetchInstitutions = async () => {
    const { data, error } = await supabase
      .from('institutions')
      .select('id, name')
      .eq('status', 'active')
      .order('name');

    if (error) {
      console.error('Error fetching institutions:', error);
      return;
    }
    setInstitutions(data || []);
  };

  const fetchClasses = async (institutionId: string) => {
    const { data, error } = await supabase
      .from('classes')
      .select('id, class_name, section, institution_id')
      .eq('institution_id', institutionId)
      .eq('status', 'active')
      .order('class_name');

    if (error) {
      console.error('Error fetching classes:', error);
      return;
    }
    setClasses(data || []);
  };

  const handleClassToggle = (classId: string) => {
    setSelectedClasses(prev =>
      prev.includes(classId)
        ? prev.filter(id => id !== classId)
        : [...prev, classId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!selectedInstitution) {
      toast.error('Please select an institution');
      return;
    }
    if (selectedClasses.length === 0) {
      toast.error('Please select at least one class');
      return;
    }
    if (!formData.start_date || !formData.submission_end_date) {
      toast.error('Please set both start and end dates');
      return;
    }
    if (new Date(formData.start_date) > new Date(formData.submission_end_date)) {
      toast.error('Start date must be before submission end date');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        title: formData.title,
        description: formData.description || undefined,
        institution_id: selectedInstitution,
        class_ids: selectedClasses,
        start_date: formData.start_date,
        submission_end_date: formData.submission_end_date,
        total_marks: formData.total_marks,
        allow_resubmit: formData.allow_resubmit,
        status: formData.status,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting assignment:', error);
      toast.error('Failed to save assignment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Assignment' : 'Create Assignment'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update assignment details' : 'Create a new assignment for students'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter assignment title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter assignment description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="institution">Institution *</Label>
              <Select
                value={selectedInstitution}
                onValueChange={setSelectedInstitution}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select institution" />
                </SelectTrigger>
                <SelectContent>
                  {institutions.map((inst) => (
                    <SelectItem key={inst.id} value={inst.id}>
                      {inst.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: 'draft' | 'published') =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedInstitution && classes.length > 0 && (
            <div className="space-y-2">
              <Label>Classes *</Label>
              <div className="border rounded-md p-3 max-h-40 overflow-y-auto space-y-2">
                {classes.map((cls) => (
                  <div key={cls.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={cls.id}
                      checked={selectedClasses.includes(cls.id)}
                      onCheckedChange={() => handleClassToggle(cls.id)}
                    />
                    <label
                      htmlFor={cls.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {cls.class_name}
                      {cls.section && ` - ${cls.section}`}
                    </label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {selectedClasses.length} class(es) selected
              </p>
            </div>
          )}

          {selectedInstitution && classes.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No classes found for this institution
            </p>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date *</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="submission_end_date">Submission End Date *</Label>
              <Input
                id="submission_end_date"
                type="date"
                value={formData.submission_end_date}
                onChange={(e) => setFormData({ ...formData, submission_end_date: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="total_marks">Total Marks</Label>
              <Input
                id="total_marks"
                type="number"
                min={1}
                value={formData.total_marks}
                onChange={(e) => setFormData({ ...formData, total_marks: parseInt(e.target.value) || 100 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="passing_marks">Passing Marks</Label>
              <Input
                id="passing_marks"
                type="number"
                min={0}
                max={formData.total_marks}
                value={formData.passing_marks}
                onChange={(e) => setFormData({ ...formData, passing_marks: parseInt(e.target.value) || 40 })}
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-3 border rounded-md">
            <div>
              <Label>Allow Resubmission</Label>
              <p className="text-xs text-muted-foreground">
                Students can resubmit their assignment before the deadline
              </p>
            </div>
            <Switch
              checked={formData.allow_resubmit}
              onCheckedChange={(checked) => setFormData({ ...formData, allow_resubmit: checked })}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEdit ? 'Update Assignment' : 'Create Assignment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
