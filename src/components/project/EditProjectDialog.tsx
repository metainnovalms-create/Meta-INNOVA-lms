import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SDGGoalSelector } from "./SDGGoalSelector";
import { useUpdateProject, ProjectWithRelations } from "@/hooks/useProjects";
import { Loader2 } from "lucide-react";

interface EditProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: ProjectWithRelations;
}

const CATEGORIES = [
  "Technology",
  "Environment",
  "Social Impact",
  "Healthcare",
  "Education",
  "Agriculture",
  "Energy",
  "Other",
];

export function EditProjectDialog({
  open,
  onOpenChange,
  project,
}: EditProjectDialogProps) {
  const updateProject = useUpdateProject();

  const [title, setTitle] = useState(project.title);
  const [description, setDescription] = useState(project.description || "");
  const [category, setCategory] = useState(project.category);
  const [sdgGoals, setSdgGoals] = useState<number[]>((project.sdg_goals as number[]) || []);
  const [remarks, setRemarks] = useState(project.remarks || "");
  const [startDate, setStartDate] = useState(project.start_date || "");
  const [targetCompletionDate, setTargetCompletionDate] = useState(project.target_completion_date || "");

  useEffect(() => {
    if (open) {
      setTitle(project.title);
      setDescription(project.description || "");
      setCategory(project.category);
      setSdgGoals((project.sdg_goals as number[]) || []);
      setRemarks(project.remarks || "");
      setStartDate(project.start_date || "");
      setTargetCompletionDate(project.target_completion_date || "");
    }
  }, [open, project]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await updateProject.mutateAsync({
      id: project.id,
      title,
      description: description || undefined,
      category,
      sdg_goals: sdgGoals,
      remarks: remarks || undefined,
      start_date: startDate || undefined,
      target_completion_date: targetCompletionDate || undefined,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
          <DialogDescription>
            Update the project details below.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Project Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter project title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the project..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>SDG Goals</Label>
            <SDGGoalSelector selectedGoals={sdgGoals} onChange={setSdgGoals} compact />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetDate">Target Completion</Label>
              <Input
                id="targetDate"
                type="date"
                value={targetCompletionDate}
                onChange={(e) => setTargetCompletionDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks</Label>
            <Textarea
              id="remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Any additional notes..."
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateProject.isPending}>
              {updateProject.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
