import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface ProgressUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectTitle: string;
  currentProgress: number;
  onSubmit: (notes: string, progress: number) => void;
}

export function ProgressUpdateDialog({
  open,
  onOpenChange,
  projectTitle,
  currentProgress,
  onSubmit
}: ProgressUpdateDialogProps) {
  const [notes, setNotes] = useState("");
  const [progress, setProgress] = useState(currentProgress.toString());

  const handleSubmit = () => {
    if (!notes.trim()) {
      toast.error("Please enter progress notes");
      return;
    }

    const progressValue = parseInt(progress);
    if (isNaN(progressValue) || progressValue < 0 || progressValue > 100) {
      toast.error("Progress must be between 0 and 100");
      return;
    }

    onSubmit(notes, progressValue);
    setNotes("");
    setProgress(currentProgress.toString());
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Update Project Progress</DialogTitle>
          <DialogDescription>
            {projectTitle}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="progress">Progress Percentage *</Label>
            <div className="flex items-center gap-2">
              <Input
                id="progress"
                type="number"
                min="0"
                max="100"
                value={progress}
                onChange={(e) => setProgress(e.target.value)}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Progress Notes *</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe what has been completed, any challenges faced, and next steps..."
              rows={6}
            />
          </div>

          <div className="text-sm text-muted-foreground">
            This update will be visible to management and students
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Submit Update
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
