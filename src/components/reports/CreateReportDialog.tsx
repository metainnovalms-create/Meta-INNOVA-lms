import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { CreateReportData, Trainer, Activity } from '@/types/report';
import { reportService } from '@/services/report.service';
import { supabase } from '@/integrations/supabase/client';

interface Institution {
  id: string;
  name: string;
}

interface CreateReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateReportDialog({ open, onOpenChange, onSuccess }: CreateReportDialogProps) {
  const [loading, setLoading] = useState(false);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  
  // Form state
  const [reportMonth, setReportMonth] = useState('');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [institutionId, setInstitutionId] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientLocation, setClientLocation] = useState('');
  const [trainers, setTrainers] = useState<Trainer[]>([{ name: '', designation: '', attendance: undefined }]);
  const [hoursHandled, setHoursHandled] = useState<number | undefined>();
  const [hoursUnit, setHoursUnit] = useState('Hours (Sessions Handled)');
  const [portionCovered, setPortionCovered] = useState<number | undefined>();
  const [assessmentsCompleted, setAssessmentsCompleted] = useState('');
  const [assessmentResults, setAssessmentResults] = useState('');
  const [activities, setActivities] = useState<Activity[]>([{ activity: '', remarks: '' }]);
  const [signatoryName, setSignatoryName] = useState('Mr. Vasanthaseelan');
  const [signatoryDesignation, setSignatoryDesignation] = useState('AGM - Metasage Alliance');

  useEffect(() => {
    if (open) {
      fetchInstitutions();
    }
  }, [open]);

  const fetchInstitutions = async () => {
    try {
      const { data, error } = await supabase
        .from('institutions')
        .select('id, name')
        .eq('status', 'active')
        .order('name');
      
      if (error) throw error;
      setInstitutions(data || []);
    } catch (error) {
      console.error('Error fetching institutions:', error);
    }
  };

  const handleInstitutionChange = (id: string) => {
    setInstitutionId(id);
    const institution = institutions.find(i => i.id === id);
    if (institution) {
      setClientName(institution.name);
    }
  };

  // Trainer management
  const addTrainer = () => {
    setTrainers([...trainers, { name: '', designation: '', attendance: undefined }]);
  };

  const removeTrainer = (index: number) => {
    if (trainers.length > 1) {
      setTrainers(trainers.filter((_, i) => i !== index));
    }
  };

  const updateTrainer = (index: number, field: keyof Trainer, value: string | number | undefined) => {
    const updated = [...trainers];
    updated[index] = { ...updated[index], [field]: value };
    setTrainers(updated);
  };

  // Activity management
  const addActivity = () => {
    setActivities([...activities, { activity: '', remarks: '' }]);
  };

  const removeActivity = (index: number) => {
    if (activities.length > 1) {
      setActivities(activities.filter((_, i) => i !== index));
    }
  };

  const updateActivity = (index: number, field: keyof Activity, value: string) => {
    const updated = [...activities];
    updated[index] = { ...updated[index], [field]: value };
    setActivities(updated);
  };

  const handleSubmit = async (status: 'draft' | 'final') => {
    if (!reportMonth || !clientName) {
      toast.error('Please fill in required fields (Report Month and Client Name)');
      return;
    }

    const validTrainers = trainers.filter(t => t.name.trim() !== '');
    if (validTrainers.length === 0) {
      toast.error('Please add at least one trainer');
      return;
    }

    setLoading(true);
    try {
      const reportData: CreateReportData = {
        report_type: 'activity',
        report_month: reportMonth,
        report_date: reportDate,
        institution_id: institutionId || undefined,
        client_name: clientName,
        client_location: clientLocation || undefined,
        trainers: validTrainers,
        hours_handled: hoursHandled,
        hours_unit: hoursUnit,
        portion_covered_percentage: portionCovered,
        assessments_completed: assessmentsCompleted || undefined,
        assessment_results: assessmentResults || undefined,
        activities: activities.filter(a => a.activity.trim() !== ''),
        signatory_name: signatoryName,
        signatory_designation: signatoryDesignation,
        status,
      };

      await reportService.createReport(reportData);
      toast.success(`Report ${status === 'draft' ? 'saved as draft' : 'created'} successfully`);
      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error creating report:', error);
      toast.error('Failed to create report');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setReportMonth('');
    setReportDate(new Date().toISOString().split('T')[0]);
    setInstitutionId('');
    setClientName('');
    setClientLocation('');
    setTrainers([{ name: '', designation: '', attendance: undefined }]);
    setHoursHandled(undefined);
    setHoursUnit('Hours (Sessions Handled)');
    setPortionCovered(undefined);
    setAssessmentsCompleted('');
    setAssessmentResults('');
    setActivities([{ activity: '', remarks: '' }]);
    setSignatoryName('Mr. Vasanthaseelan');
    setSignatoryDesignation('AGM - Metasage Alliance');
  };

  // Generate month options
  const monthOptions = () => {
    const months = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      months.push(monthYear);
    }
    return months;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Activity Report</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Report Month *</Label>
              <Select value={reportMonth} onValueChange={setReportMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions().map(month => (
                    <SelectItem key={month} value={month}>{month}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Report Date</Label>
              <Input
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
              />
            </div>
          </div>

          {/* Institution/Client */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Select Institution</Label>
              <Select value={institutionId} onValueChange={handleInstitutionChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select institution" />
                </SelectTrigger>
                <SelectContent>
                  {institutions.map(inst => (
                    <SelectItem key={inst.id} value={inst.id}>{inst.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Client Name *</Label>
              <Input
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Enter client name"
              />
            </div>
          </div>

          {/* Trainers Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Trainers</Label>
              <Button type="button" variant="outline" size="sm" onClick={addTrainer}>
                <Plus className="h-4 w-4 mr-1" /> Add Trainer
              </Button>
            </div>
            {trainers.map((trainer, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-4 space-y-1">
                  <Label className="text-xs">Name</Label>
                  <Input
                    value={trainer.name}
                    onChange={(e) => updateTrainer(index, 'name', e.target.value)}
                    placeholder="Trainer name"
                  />
                </div>
                <div className="col-span-4 space-y-1">
                  <Label className="text-xs">Designation</Label>
                  <Input
                    value={trainer.designation}
                    onChange={(e) => updateTrainer(index, 'designation', e.target.value)}
                    placeholder="e.g., Project Manager"
                  />
                </div>
                <div className="col-span-3 space-y-1">
                  <Label className="text-xs">Attendance (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={trainer.attendance ?? ''}
                    onChange={(e) => updateTrainer(index, 'attendance', e.target.value ? parseFloat(e.target.value) : undefined)}
                    placeholder="e.g., 93.5"
                  />
                </div>
                <div className="col-span-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeTrainer(index)}
                    disabled={trainers.length === 1}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Training Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Hours Handled</Label>
              <Input
                type="number"
                value={hoursHandled ?? ''}
                onChange={(e) => setHoursHandled(e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="e.g., 52"
              />
            </div>
            <div className="space-y-2">
              <Label>Portion Covered (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={portionCovered ?? ''}
                onChange={(e) => setPortionCovered(e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="e.g., 7"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Assessments Completed</Label>
              <Input
                value={assessmentsCompleted}
                onChange={(e) => setAssessmentsCompleted(e.target.value)}
                placeholder="e.g., 2 or -"
              />
            </div>
            <div className="space-y-2">
              <Label>Assessment Results</Label>
              <Input
                value={assessmentResults}
                onChange={(e) => setAssessmentResults(e.target.value)}
                placeholder="e.g., 85% average or -"
              />
            </div>
          </div>

          {/* Activities Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Other Activities</Label>
              <Button type="button" variant="outline" size="sm" onClick={addActivity}>
                <Plus className="h-4 w-4 mr-1" /> Add Activity
              </Button>
            </div>
            {activities.map((activity, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-start">
                <div className="col-span-4 space-y-1">
                  <Label className="text-xs">Activity</Label>
                  <Input
                    value={activity.activity}
                    onChange={(e) => updateActivity(index, 'activity', e.target.value)}
                    placeholder="Activity name"
                  />
                </div>
                <div className="col-span-7 space-y-1">
                  <Label className="text-xs">Remarks</Label>
                  <Textarea
                    value={activity.remarks}
                    onChange={(e) => updateActivity(index, 'remarks', e.target.value)}
                    placeholder="Details about the activity"
                    rows={2}
                  />
                </div>
                <div className="col-span-1 pt-6">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeActivity(index)}
                    disabled={activities.length === 1}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Signature */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Signatory Name</Label>
              <Input
                value={signatoryName}
                onChange={(e) => setSignatoryName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Signatory Designation</Label>
              <Input
                value={signatoryDesignation}
                onChange={(e) => setSignatoryDesignation(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="secondary" onClick={() => handleSubmit('draft')} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save as Draft
          </Button>
          <Button onClick={() => handleSubmit('final')} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create Report
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
