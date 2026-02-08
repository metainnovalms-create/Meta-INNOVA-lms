import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateJobPosting, useUpdateJobPosting, useCreateInterviewStages } from '@/hooks/useHRManagement';
import { JobPosting } from '@/types/hr';

interface CreateJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editJob?: JobPosting | null;
}

const DEFAULT_STAGES = [
  { stage_name: 'HR Screening', stage_order: 1, is_mandatory: true, description: null },
  { stage_name: 'Technical Interview', stage_order: 2, is_mandatory: true, description: null },
  { stage_name: 'Manager Interview', stage_order: 3, is_mandatory: true, description: null },
  { stage_name: 'Final Interview', stage_order: 4, is_mandatory: false, description: null },
];

export function CreateJobDialog({ open, onOpenChange, editJob }: CreateJobDialogProps) {
  const createJob = useCreateJobPosting();
  const updateJob = useUpdateJobPosting();
  const createStages = useCreateInterviewStages();

  const [formData, setFormData] = useState({
    job_title: editJob?.job_title || '',
    department: editJob?.department || '',
    location: editJob?.location || '',
    employment_type: editJob?.employment_type || 'full_time',
    description: editJob?.description || '',
    required_skills: editJob?.required_skills?.join(', ') || '',
    experience_level: editJob?.experience_level || 'mid',
    min_experience_years: editJob?.min_experience_years || 0,
    number_of_openings: editJob?.number_of_openings || 1,
    target_role: editJob?.target_role || 'officer',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      ...formData,
      required_skills: formData.required_skills.split(',').map(s => s.trim()).filter(Boolean),
    };

    if (editJob) {
      updateJob.mutate({ id: editJob.id, ...data });
    } else {
      const result = await createJob.mutateAsync(data);
      // Create default interview stages
      if (result?.id) {
        createStages.mutate(DEFAULT_STAGES.map(stage => ({ ...stage, job_id: result.id })));
      }
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editJob ? 'Edit Job Posting' : 'Create Job Posting'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="job_title">Job Title *</Label>
              <Input
                id="job_title"
                value={formData.job_title}
                onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employment_type">Employment Type</Label>
              <Select value={formData.employment_type} onValueChange={(v) => setFormData({ ...formData, employment_type: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="full_time">Full-time</SelectItem>
                  <SelectItem value="part_time">Part-time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="experience_level">Experience Level</Label>
              <Select value={formData.experience_level} onValueChange={(v) => setFormData({ ...formData, experience_level: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fresher">Fresher</SelectItem>
                  <SelectItem value="junior">Junior</SelectItem>
                  <SelectItem value="mid">Mid-Level</SelectItem>
                  <SelectItem value="senior">Senior</SelectItem>
                  <SelectItem value="lead">Lead</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="number_of_openings">Number of Openings</Label>
              <Input
                id="number_of_openings"
                type="number"
                min={1}
                value={formData.number_of_openings}
                onChange={(e) => setFormData({ ...formData, number_of_openings: parseInt(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="target_role">Onboard As</Label>
              <Select value={formData.target_role} onValueChange={(v) => setFormData({ ...formData, target_role: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="officer">Officer</SelectItem>
                  <SelectItem value="meta_staff">Meta Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="required_skills">Required Skills (comma-separated)</Label>
            <Input
              id="required_skills"
              value={formData.required_skills}
              onChange={(e) => setFormData({ ...formData, required_skills: e.target.value })}
              placeholder="React, TypeScript, Node.js"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <RichTextEditor
              value={formData.description}
              onChange={(value) => setFormData({ ...formData, description: value })}
              placeholder="Enter job description with formatting..."
              minHeight="120px"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{editJob ? 'Update' : 'Create'} Job</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
