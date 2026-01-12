import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PublishingSelector } from './PublishingSelector';
import { AssessmentPublishing } from '@/types/assessment';
import { toast } from 'sonner';

interface PublishAssessmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assessmentId: string;
  assessmentTitle: string;
  currentPublishing?: AssessmentPublishing[];
  onConfirm: (publishing: AssessmentPublishing[]) => void;
}

export const PublishAssessmentDialog = ({
  open,
  onOpenChange,
  assessmentId,
  assessmentTitle,
  currentPublishing = [],
  onConfirm
}: PublishAssessmentDialogProps) => {
  const [publishing, setPublishing] = useState<AssessmentPublishing[]>(currentPublishing);

  const handlePublish = () => {
    if (publishing.length === 0) {
      toast.error('Please select at least one institution and class');
      return;
    }

    onConfirm(publishing);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Publish Assessment: {assessmentTitle}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <p className="text-sm text-muted-foreground">
              Select the institutions and classes where this assessment should be published.
              Students in these classes will be able to view and attempt this assessment.
            </p>
          </div>

          <PublishingSelector value={publishing} onChange={setPublishing} />

          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handlePublish}>
              Publish Assessment
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
