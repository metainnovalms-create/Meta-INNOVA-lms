import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useScheduleInterview, useUpdateInterview } from '@/hooks/useHRManagement';
import { InterviewStage, CandidateInterview } from '@/types/hr';
import { Mail } from 'lucide-react';

interface ScheduleInterviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicationId: string;
  jobId: string;
  stages: InterviewStage[];
  candidateEmail?: string;
  candidateName?: string;
  jobTitle?: string;
  editInterview?: CandidateInterview | null;
}

export function ScheduleInterviewDialog({ 
  open, 
  onOpenChange, 
  applicationId, 
  jobId, 
  stages,
  candidateEmail,
  candidateName,
  jobTitle,
  editInterview
}: ScheduleInterviewDialogProps) {
  const scheduleInterview = useScheduleInterview();
  const updateInterview = useUpdateInterview();
  const isEditMode = !!editInterview;

  const [formData, setFormData] = useState({
    stage_id: '',
    interview_type: 'online',
    scheduled_date: '',
    scheduled_time: '',
    duration_minutes: 60,
    location: '',
    meeting_link: '',
    interviewer_names: '',
  });

  // Populate form when editing
  useEffect(() => {
    if (editInterview) {
      setFormData({
        stage_id: editInterview.stage_id || '',
        interview_type: editInterview.interview_type || 'online',
        scheduled_date: editInterview.scheduled_date || '',
        scheduled_time: editInterview.scheduled_time || '',
        duration_minutes: editInterview.duration_minutes || 60,
        location: editInterview.location || '',
        meeting_link: editInterview.meeting_link || '',
        interviewer_names: editInterview.interviewer_names?.join(', ') || '',
      });
    } else {
      setFormData({
        stage_id: '',
        interview_type: 'online',
        scheduled_date: '',
        scheduled_time: '',
        duration_minutes: 60,
        location: '',
        meeting_link: '',
        interviewer_names: '',
      });
    }
  }, [editInterview, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const interviewData = {
      stage_id: formData.stage_id,
      interview_type: formData.interview_type as any,
      scheduled_date: formData.scheduled_date,
      scheduled_time: formData.scheduled_time,
      duration_minutes: formData.duration_minutes,
      location: formData.location || undefined,
      meeting_link: formData.meeting_link || undefined,
      interviewer_names: formData.interviewer_names.split(',').map(s => s.trim()).filter(Boolean),
    };

    if (isEditMode && editInterview) {
      updateInterview.mutate({ id: editInterview.id, ...interviewData });
    } else {
      scheduleInterview.mutate({
        application_id: applicationId,
        ...interviewData,
      });
    }
    onOpenChange(false);
  };

  const openGmailCompose = () => {
    if (!candidateEmail) return;
    
    const selectedStage = stages.find(s => s.id === formData.stage_id);
    const stageName = selectedStage?.stage_name || 'Interview';
    
    const subject = encodeURIComponent(`Interview Scheduled - ${jobTitle || 'Position'} at Metasage`);
    const body = encodeURIComponent(`Dear ${candidateName || 'Candidate'},

We are pleased to invite you for ${stageName} for the position of ${jobTitle || 'the role'}.

Interview Details:
- Date: ${formData.scheduled_date || '[Date to be confirmed]'}
- Time: ${formData.scheduled_time || '[Time to be confirmed]'}
- Type: ${formData.interview_type === 'online' ? 'Online' : formData.interview_type === 'in_person' ? 'In-Person' : 'Phone'}
${formData.meeting_link ? `- Meeting Link: ${formData.meeting_link}` : formData.location ? `- Location: ${formData.location}` : ''}
- Duration: ${formData.duration_minutes} minutes
${formData.interviewer_names ? `- Interviewer(s): ${formData.interviewer_names}` : ''}

Please confirm your availability by replying to this email.

Best regards,
HR Team
Metasage Alliance`);
    
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${candidateEmail}&su=${subject}&body=${body}`, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Interview' : 'Schedule Interview'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Interview Stage *</Label>
            <Select value={formData.stage_id} onValueChange={(v) => setFormData({ ...formData, stage_id: v })}>
              <SelectTrigger><SelectValue placeholder="Select stage" /></SelectTrigger>
              <SelectContent>
                {stages.map(stage => (
                  <SelectItem key={stage.id} value={stage.id}>{stage.stage_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date *</Label>
              <Input type="date" value={formData.scheduled_date} onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Time *</Label>
              <Input type="time" value={formData.scheduled_time} onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Interview Type</Label>
            <Select value={formData.interview_type} onValueChange={(v) => setFormData({ ...formData, interview_type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="in_person">In-Person</SelectItem>
                <SelectItem value="phone">Phone</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Meeting Link / Location</Label>
            <Input value={formData.meeting_link || formData.location} onChange={(e) => setFormData({ ...formData, meeting_link: e.target.value })} placeholder="Paste meeting link or enter location" />
          </div>
          <div className="space-y-2">
            <Label>Interviewers (comma-separated names)</Label>
            <Input value={formData.interviewer_names} onChange={(e) => setFormData({ ...formData, interviewer_names: e.target.value })} placeholder="John Doe, Jane Smith" />
          </div>
          <div className="flex justify-between gap-2">
            {candidateEmail && (
              <Button type="button" variant="outline" onClick={openGmailCompose}>
                <Mail className="h-4 w-4 mr-2" />
                Send via Gmail
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit">{isEditMode ? 'Update' : 'Schedule'}</Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
