import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { X } from "lucide-react";

interface MarkAsShowcaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectTitle: string;
  onSubmit: (achievements: string[], awards: string[]) => void;
}

export function MarkAsShowcaseDialog({
  open,
  onOpenChange,
  projectTitle,
  onSubmit
}: MarkAsShowcaseDialogProps) {
  const [achievements, setAchievements] = useState<string[]>([]);
  const [currentAchievement, setCurrentAchievement] = useState("");
  const [awards, setAwards] = useState<string[]>([]);
  const [currentAward, setCurrentAward] = useState("");

  const addAchievement = () => {
    if (currentAchievement.trim()) {
      setAchievements([...achievements, currentAchievement.trim()]);
      setCurrentAchievement("");
    }
  };

  const removeAchievement = (index: number) => {
    setAchievements(achievements.filter((_, i) => i !== index));
  };

  const addAward = () => {
    if (currentAward.trim()) {
      setAwards([...awards, currentAward.trim()]);
      setCurrentAward("");
    }
  };

  const removeAward = (index: number) => {
    setAwards(awards.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (achievements.length === 0 && awards.length === 0) {
      toast.error("Please add at least one achievement or award");
      return;
    }

    onSubmit(achievements, awards);
    setAchievements([]);
    setAwards([]);
    toast.success("Project marked as showcase");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Mark as Showcase Project</DialogTitle>
          <DialogDescription>
            {projectTitle}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Achievements Section */}
          <div>
            <Label htmlFor="achievement">Achievements</Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="achievement"
                value={currentAchievement}
                onChange={(e) => setCurrentAchievement(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addAchievement()}
                placeholder="e.g., Published paper in IJAER journal"
              />
              <Button type="button" onClick={addAchievement} size="sm">
                Add
              </Button>
            </div>
            
            {achievements.length > 0 && (
              <div className="mt-3 space-y-2">
                {achievements.map((achievement, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-muted rounded text-sm"
                  >
                    <span>{achievement}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAchievement(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Awards Section */}
          <div>
            <Label htmlFor="award">Awards</Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="award"
                value={currentAward}
                onChange={(e) => setCurrentAward(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addAward()}
                placeholder="e.g., Gold Medal - Smart India Hackathon"
              />
              <Button type="button" onClick={addAward} size="sm">
                Add
              </Button>
            </div>
            
            {awards.length > 0 && (
              <div className="mt-3 space-y-2">
                {awards.map((award, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-muted rounded text-sm"
                  >
                    <span>{award}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAward(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="text-sm text-muted-foreground">
            This project will appear in the Project Gallery and be visible to all management users.
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Mark as Showcase
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
