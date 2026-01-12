import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSubmitFeedback, useUpdateInterview } from '@/hooks/useHRManagement';
import { CandidateInterview } from '@/types/hr';
import { Star } from 'lucide-react';

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  interview: CandidateInterview | null;
}

const RatingInput = ({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) => (
  <div className="space-y-1">
    <Label className="text-sm">{label}</Label>
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((rating) => (
        <button key={rating} type="button" onClick={() => onChange(rating)} className="focus:outline-none">
          <Star className={`h-6 w-6 ${rating <= value ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
        </button>
      ))}
    </div>
  </div>
);

export function FeedbackDialog({ open, onOpenChange, interview }: FeedbackDialogProps) {
  const submitFeedback = useSubmitFeedback();
  const updateInterview = useUpdateInterview();
  const [formData, setFormData] = useState({
    technical_skills_rating: 3,
    communication_rating: 3,
    problem_solving_rating: 3,
    cultural_fit_rating: 3,
    overall_rating: 3,
    strengths: '',
    weaknesses: '',
    recommendation: 'hire',
    detailed_feedback: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!interview) return;
    
    submitFeedback.mutate({
      interview_id: interview.id,
      interviewer_id: null,
      interviewer_name: null,
      ...formData,
      recommendation: formData.recommendation as any,
    });
    
    const result = formData.recommendation.includes('hire') ? 'passed' : 'failed';
    updateInterview.mutate({ id: interview.id, result });
    
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Submit Interview Feedback</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <RatingInput label="Technical Skills" value={formData.technical_skills_rating} onChange={(v) => setFormData({ ...formData, technical_skills_rating: v })} />
            <RatingInput label="Communication" value={formData.communication_rating} onChange={(v) => setFormData({ ...formData, communication_rating: v })} />
            <RatingInput label="Problem Solving" value={formData.problem_solving_rating} onChange={(v) => setFormData({ ...formData, problem_solving_rating: v })} />
            <RatingInput label="Cultural Fit" value={formData.cultural_fit_rating} onChange={(v) => setFormData({ ...formData, cultural_fit_rating: v })} />
          </div>
          <RatingInput label="Overall Rating" value={formData.overall_rating} onChange={(v) => setFormData({ ...formData, overall_rating: v })} />
          <div className="space-y-2">
            <Label>Recommendation</Label>
            <Select value={formData.recommendation} onValueChange={(v) => setFormData({ ...formData, recommendation: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="strong_hire">Strong Hire</SelectItem>
                <SelectItem value="hire">Hire</SelectItem>
                <SelectItem value="no_hire">No Hire</SelectItem>
                <SelectItem value="strong_no_hire">Strong No Hire</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Strengths</Label>
            <Textarea value={formData.strengths} onChange={(e) => setFormData({ ...formData, strengths: e.target.value })} rows={2} />
          </div>
          <div className="space-y-2">
            <Label>Weaknesses</Label>
            <Textarea value={formData.weaknesses} onChange={(e) => setFormData({ ...formData, weaknesses: e.target.value })} rows={2} />
          </div>
          <div className="space-y-2">
            <Label>Detailed Feedback</Label>
            <Textarea value={formData.detailed_feedback} onChange={(e) => setFormData({ ...formData, detailed_feedback: e.target.value })} rows={3} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">Submit Feedback</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
