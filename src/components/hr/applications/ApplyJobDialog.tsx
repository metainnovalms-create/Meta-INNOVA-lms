import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateApplication } from '@/hooks/useHRManagement';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Upload, Loader2 } from 'lucide-react';

interface ApplyJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
}

export function ApplyJobDialog({ open, onOpenChange, jobId }: ApplyJobDialogProps) {
  const createApplication = useCreateApplication();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    candidate_name: '',
    candidate_email: '',
    candidate_phone: '',
    experience_years: '',
    skills: '',
    current_company: '',
    current_designation: '',
    expected_salary: '',
    notice_period_days: '',
    cover_letter: '',
    resume_url: '',
  });

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      toast({ title: 'Invalid file type', description: 'Please upload a PDF or Word document', variant: 'destructive' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Maximum file size is 5MB', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const filePath = `resumes/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('hr-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('hr-documents')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, resume_url: publicUrl }));
      toast({ title: 'Resume uploaded successfully' });
    } catch (error: any) {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createApplication.mutate({
      job_id: jobId,
      candidate_name: formData.candidate_name,
      candidate_email: formData.candidate_email,
      candidate_phone: formData.candidate_phone || undefined,
      experience_years: formData.experience_years ? parseInt(formData.experience_years) : undefined,
      skills: formData.skills ? formData.skills.split(',').map(s => s.trim()).filter(Boolean) : undefined,
      current_company: formData.current_company || undefined,
      current_designation: formData.current_designation || undefined,
      expected_salary: formData.expected_salary ? parseFloat(formData.expected_salary) : undefined,
      notice_period_days: formData.notice_period_days ? parseInt(formData.notice_period_days) : undefined,
      cover_letter: formData.cover_letter || undefined,
      resume_url: formData.resume_url || undefined,
    });
    onOpenChange(false);
    setFormData({
      candidate_name: '',
      candidate_email: '',
      candidate_phone: '',
      experience_years: '',
      skills: '',
      current_company: '',
      current_designation: '',
      expected_salary: '',
      notice_period_days: '',
      cover_letter: '',
      resume_url: '',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Application</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input 
                value={formData.candidate_name} 
                onChange={(e) => setFormData({ ...formData, candidate_name: e.target.value })} 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input 
                type="email"
                value={formData.candidate_email} 
                onChange={(e) => setFormData({ ...formData, candidate_email: e.target.value })} 
                required 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input 
                value={formData.candidate_phone} 
                onChange={(e) => setFormData({ ...formData, candidate_phone: e.target.value })} 
              />
            </div>
            <div className="space-y-2">
              <Label>Experience (years)</Label>
              <Input 
                type="number"
                value={formData.experience_years} 
                onChange={(e) => setFormData({ ...formData, experience_years: e.target.value })} 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Current Company</Label>
              <Input 
                value={formData.current_company} 
                onChange={(e) => setFormData({ ...formData, current_company: e.target.value })} 
              />
            </div>
            <div className="space-y-2">
              <Label>Current Designation</Label>
              <Input 
                value={formData.current_designation} 
                onChange={(e) => setFormData({ ...formData, current_designation: e.target.value })} 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Expected Salary (₹)</Label>
              <Input 
                type="number"
                value={formData.expected_salary} 
                onChange={(e) => setFormData({ ...formData, expected_salary: e.target.value })} 
              />
            </div>
            <div className="space-y-2">
              <Label>Notice Period (days)</Label>
              <Input 
                type="number"
                value={formData.notice_period_days} 
                onChange={(e) => setFormData({ ...formData, notice_period_days: e.target.value })} 
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Skills (comma-separated)</Label>
            <Input 
              value={formData.skills} 
              onChange={(e) => setFormData({ ...formData, skills: e.target.value })} 
              placeholder="React, TypeScript, Node.js"
            />
          </div>

          <div className="space-y-2">
            <Label>Resume (PDF/Word)</Label>
            <div className="flex items-center gap-4">
              <Button type="button" variant="outline" disabled={uploading} asChild>
                <label className="cursor-pointer">
                  {uploading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  {formData.resume_url ? 'Change Resume' : 'Upload Resume'}
                  <input 
                    type="file" 
                    className="hidden" 
                    accept=".pdf,.doc,.docx"
                    onChange={handleResumeUpload}
                  />
                </label>
              </Button>
              {formData.resume_url && (
                <span className="text-sm text-green-600">✓ Resume uploaded</span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Cover Letter</Label>
            <Textarea 
              value={formData.cover_letter} 
              onChange={(e) => setFormData({ ...formData, cover_letter: e.target.value })} 
              rows={4}
              placeholder="Brief introduction and motivation..."
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={createApplication.isPending}>
              {createApplication.isPending ? 'Submitting...' : 'Submit Application'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
