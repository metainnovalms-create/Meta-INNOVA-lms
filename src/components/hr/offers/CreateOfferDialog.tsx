import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Trash2 } from 'lucide-react';
import { useCreateOffer, useUpdateOffer, useDeleteOffer } from '@/hooks/useHRManagement';
import { JobApplication, JobPosting, CandidateOffer } from '@/types/hr';

interface CreateOfferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: JobApplication & { job: JobPosting };
  editOffer?: CandidateOffer | null;
}

export function CreateOfferDialog({ open, onOpenChange, application, editOffer }: CreateOfferDialogProps) {
  const createOffer = useCreateOffer();
  const updateOffer = useUpdateOffer();
  const deleteOffer = useDeleteOffer();
  const isEditMode = !!editOffer;

  const [formData, setFormData] = useState({
    job_title: application.job?.job_title || '',
    department: application.job?.department || '',
    offered_salary: application.expected_salary || 0,
    joining_date: '',
    probation_period_months: 6,
    benefits: '',
    expiry_date: '',
  });

  // Pre-fill form when editing
  useEffect(() => {
    if (editOffer) {
      setFormData({
        job_title: editOffer.job_title || '',
        department: editOffer.department || '',
        offered_salary: editOffer.offered_salary || 0,
        joining_date: editOffer.joining_date ? editOffer.joining_date.split('T')[0] : '',
        probation_period_months: editOffer.probation_period_months || 6,
        benefits: editOffer.benefits || '',
        expiry_date: editOffer.expiry_date ? editOffer.expiry_date.split('T')[0] : '',
      });
    } else {
      setFormData({
        job_title: application.job?.job_title || '',
        department: application.job?.department || '',
        offered_salary: application.expected_salary || 0,
        joining_date: '',
        probation_period_months: 6,
        benefits: '',
        expiry_date: '',
      });
    }
  }, [editOffer, application, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditMode && editOffer) {
      updateOffer.mutate({
        id: editOffer.id,
        ...formData,
        joining_date: formData.joining_date || undefined,
        expiry_date: formData.expiry_date || undefined,
      });
    } else {
      createOffer.mutate({
        application_id: application.id,
        ...formData,
        joining_date: formData.joining_date || undefined,
        expiry_date: formData.expiry_date || undefined,
      });
    }
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (editOffer) {
      deleteOffer.mutate(editOffer.id);
      onOpenChange(false);
    }
  };

  const handleSendViaGmail = () => {
    const subject = `Job Offer: ${formData.job_title} at Your Company`;
    const body = `Dear ${application.candidate_name},

We are pleased to offer you the position of ${formData.job_title}${formData.department ? ` in our ${formData.department} department` : ''}.

Offer Details:
- Position: ${formData.job_title}
- Salary: ₹${formData.offered_salary?.toLocaleString()} per annum
${formData.joining_date ? `- Start Date: ${new Date(formData.joining_date).toLocaleDateString()}` : ''}
${formData.probation_period_months ? `- Probation Period: ${formData.probation_period_months} months` : ''}
${formData.benefits ? `- Benefits: ${formData.benefits}` : ''}
${formData.expiry_date ? `\nThis offer is valid until ${new Date(formData.expiry_date).toLocaleDateString()}.` : ''}

Please confirm your acceptance by replying to this email.

Best regards,
HR Team`;

    // Use Gmail compose URL directly - works better in iframe environments
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(application.candidate_email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(gmailUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Edit Offer' : 'Create Offer'} for {application.candidate_name}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Job Title *</Label>
              <Input value={formData.job_title} onChange={(e) => setFormData({ ...formData, job_title: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Input value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Offered Salary (₹) *</Label>
              <Input type="number" value={formData.offered_salary} onChange={(e) => setFormData({ ...formData, offered_salary: parseFloat(e.target.value) })} required />
            </div>
            <div className="space-y-2">
              <Label>Probation (months)</Label>
              <Input type="number" value={formData.probation_period_months} onChange={(e) => setFormData({ ...formData, probation_period_months: parseInt(e.target.value) })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Joining Date</Label>
              <Input type="date" value={formData.joining_date} onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Offer Expiry Date</Label>
              <Input type="date" value={formData.expiry_date} onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Benefits</Label>
            <Textarea value={formData.benefits} onChange={(e) => setFormData({ ...formData, benefits: e.target.value })} placeholder="Health insurance, PF, etc." rows={3} />
          </div>
          <div className="flex justify-between">
            <div>
              {isEditMode && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button type="button" variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Offer</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this offer? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={handleSendViaGmail}>
                <Mail className="h-4 w-4 mr-2" />
                Send via Gmail
              </Button>
              <Button type="submit">
                {isEditMode ? 'Update Offer' : 'Create Offer'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
