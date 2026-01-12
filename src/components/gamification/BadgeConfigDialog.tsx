import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { BadgeConfig } from "@/types/gamification";
import { toast } from "sonner";

interface BadgeConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  badge?: BadgeConfig;
  onSave: (badge: Partial<BadgeConfig>) => void;
}

const iconOptions = ['🎯', '⭐', '🏆', '🚀', '🔥', '💯', '🎖️', '👑', '💎', '🌟'];

export const BadgeConfigDialog = ({ open, onOpenChange, badge, onSave }: BadgeConfigDialogProps) => {
  const [formData, setFormData] = useState<Partial<BadgeConfig>>(badge || {
    name: '',
    description: '',
    icon: '🎯',
    category: 'achievement',
    unlock_criteria: {
      type: 'points',
      threshold: 100,
      description: ''
    },
    xp_reward: 50,
    is_active: true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.description) {
      toast.error("Please fill all required fields");
      return;
    }

    onSave({
      ...formData,
      created_at: badge?.created_at || new Date().toISOString(),
      created_by: 'System Admin'
    });
    
    toast.success(badge ? "Badge updated successfully" : "Badge created successfully");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{badge ? 'Edit Badge' : 'Create New Badge'}</DialogTitle>
          <DialogDescription>
            Configure badge properties and unlock criteria
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Badge Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., First Steps"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="icon">Icon</Label>
              <Select
                value={formData.icon}
                onValueChange={(value) => setFormData({ ...formData, icon: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {iconOptions.map((icon) => (
                    <SelectItem key={icon} value={icon}>
                      <span className="text-2xl">{icon}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of the badge"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value: any) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="achievement">Achievement</SelectItem>
                  <SelectItem value="participation">Participation</SelectItem>
                  <SelectItem value="excellence">Excellence</SelectItem>
                  <SelectItem value="milestone">Milestone</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="xp_reward">XP Reward</Label>
              <Input
                id="xp_reward"
                type="number"
                value={formData.xp_reward}
                onChange={(e) => setFormData({ ...formData, xp_reward: parseInt(e.target.value) })}
              />
            </div>
          </div>

          <div className="border rounded-lg p-4 space-y-4">
            <h4 className="font-medium">Unlock Criteria</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="criteria_type">Type</Label>
                <Select
                  value={formData.unlock_criteria?.type}
                  onValueChange={(value: any) => setFormData({
                    ...formData,
                    unlock_criteria: { ...formData.unlock_criteria!, type: value }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="points">Points</SelectItem>
                    <SelectItem value="attendance">Attendance</SelectItem>
                    <SelectItem value="projects">Projects</SelectItem>
                    <SelectItem value="assessments">Assessments</SelectItem>
                    <SelectItem value="streak">Streak</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="threshold">Threshold</Label>
                <Input
                  id="threshold"
                  type="number"
                  value={formData.unlock_criteria?.threshold}
                  onChange={(e) => setFormData({
                    ...formData,
                    unlock_criteria: { ...formData.unlock_criteria!, threshold: parseInt(e.target.value) }
                  })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="criteria_description">Criteria Description</Label>
              <Input
                id="criteria_description"
                value={formData.unlock_criteria?.description}
                onChange={(e) => setFormData({
                  ...formData,
                  unlock_criteria: { ...formData.unlock_criteria!, description: e.target.value }
                })}
                placeholder="e.g., Earn 100 points"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="is_active">Active Status</Label>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {badge ? 'Update' : 'Create'} Badge
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
