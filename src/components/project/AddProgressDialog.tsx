import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { useAddProgressUpdate } from '@/hooks/useProjectProgress';
import { format } from 'date-fns';
import { Calendar, TrendingUp } from 'lucide-react';

interface AddProgressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectTitle: string;
  currentProgress: number;
  officerId: string;
  officerName: string;
}

export function AddProgressDialog({
  open,
  onOpenChange,
  projectId,
  projectTitle,
  currentProgress,
  officerId,
  officerName,
}: AddProgressDialogProps) {
  const [notes, setNotes] = useState('');
  const [progress, setProgress] = useState(currentProgress);

  const addProgressUpdate = useAddProgressUpdate();
  const currentDate = new Date();

  const handleSubmit = async () => {
    if (!notes.trim()) return;

    try {
      await addProgressUpdate.mutateAsync({
        project_id: projectId,
        notes,
        progress_percentage: progress,
        updated_by_officer_id: officerId,
        updated_by_officer_name: officerName,
      });

      setNotes('');
      setProgress(currentProgress);
      onOpenChange(false);
    } catch (error) {
      console.error('Error adding progress update:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Update Progress</DialogTitle>
          <p className="text-sm text-muted-foreground">{projectTitle}</p>
        </DialogHeader>

        <div className="space-y-4">
          {/* Date Display - Prominent */}
          <div className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Update Date</p>
                <p className="font-semibold text-primary">
                  {format(currentDate, 'EEEE, MMMM dd, yyyy')}
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="text-xs">
              {format(currentDate, 'HH:mm')}
            </Badge>
          </div>

          {/* Progress Slider */}
          <div className="space-y-3 p-3 border rounded-lg">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Progress
              </Label>
              <Badge variant={progress === 100 ? 'default' : 'secondary'} className="font-bold">
                {progress}%
              </Badge>
            </div>
            <Slider
              value={[progress]}
              onValueChange={([value]) => setProgress(value)}
              min={0}
              max={100}
              step={5}
              className="py-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span>Current: {currentProgress}%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Notes/Remarks */}
          <div className="space-y-2">
            <Label htmlFor="notes">Remarks / Update Notes *</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe the progress made, milestones achieved, challenges faced, or next steps..."
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              This will be recorded with your name and today's date.
            </p>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={addProgressUpdate.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!notes.trim() || addProgressUpdate.isPending}>
            {addProgressUpdate.isPending ? 'Saving...' : 'Save Update'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
