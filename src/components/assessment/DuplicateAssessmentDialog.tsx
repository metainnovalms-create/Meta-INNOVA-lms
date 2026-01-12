import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

interface DuplicateAssessmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assessmentId: string;
  assessmentTitle: string;
  onConfirm: (newTitle: string, includeQuestions: boolean) => void;
}

export const DuplicateAssessmentDialog = ({
  open,
  onOpenChange,
  assessmentId,
  assessmentTitle,
  onConfirm
}: DuplicateAssessmentDialogProps) => {
  const [newTitle, setNewTitle] = useState(`${assessmentTitle} (Copy)`);
  const [includeQuestions, setIncludeQuestions] = useState(true);

  const handleDuplicate = () => {
    if (!newTitle.trim()) {
      toast.error('Title is required');
      return;
    }

    onConfirm(newTitle, includeQuestions);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Duplicate Assessment</DialogTitle>
          <DialogDescription>
            Create a copy of this assessment with a new name
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-title">New Assessment Title</Label>
            <Input
              id="new-title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Enter a title for the duplicated assessment"
            />
          </div>

          <div className="flex items-start gap-2">
            <Checkbox
              id="include-questions"
              checked={includeQuestions}
              onCheckedChange={(checked) => setIncludeQuestions(checked as boolean)}
            />
            <div className="space-y-1">
              <Label htmlFor="include-questions" className="cursor-pointer">
                Include all questions
              </Label>
              <p className="text-sm text-muted-foreground">
                Copy all questions from the original assessment. Uncheck to create an empty assessment.
              </p>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleDuplicate}>
              Duplicate Assessment
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
