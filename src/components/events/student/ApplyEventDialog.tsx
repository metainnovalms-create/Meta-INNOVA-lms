import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { mockActivityEvents } from '@/data/mockEventsData';
import { useToast } from '@/hooks/use-toast';
import { Plus, X, Upload } from 'lucide-react';
import { TeamMember } from '@/types/events';

interface ApplyEventDialogProps {
  eventId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ApplyEventDialog({ eventId, open, onOpenChange }: ApplyEventDialogProps) {
  const event = mockActivityEvents.find(e => e.id === eventId);
  const [ideaTitle, setIdeaTitle] = useState('');
  const [ideaDescription, setIdeaDescription] = useState('');
  const [isTeamApplication, setIsTeamApplication] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([{ name: '', role: 'Team Lead' }]);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const { toast } = useToast();

  if (!event) return null;

  const handleAddTeamMember = () => {
    setTeamMembers([...teamMembers, { name: '', role: 'Member' }]);
  };

  const handleRemoveTeamMember = (index: number) => {
    if (teamMembers.length > 1) {
      setTeamMembers(teamMembers.filter((_, i) => i !== index));
    }
  };

  const handleTeamMemberChange = (index: number, field: keyof TeamMember, value: string) => {
    const updated = [...teamMembers];
    updated[index] = { ...updated[index], [field]: value };
    setTeamMembers(updated);
  };

  const handleSubmit = () => {
    // Validation
    if (!ideaTitle.trim()) {
      toast({
        title: 'Missing Idea Title',
        description: 'Please provide a title for your idea.',
        variant: 'destructive',
      });
      return;
    }

    if (!ideaDescription.trim()) {
      toast({
        title: 'Missing Idea Description',
        description: 'Please describe your idea.',
        variant: 'destructive',
      });
      return;
    }

    if (isTeamApplication && teamMembers.some(m => !m.name.trim())) {
      toast({
        title: 'Incomplete Team Information',
        description: 'Please fill in all team member names.',
        variant: 'destructive',
      });
      return;
    }

    if (!agreedToTerms) {
      toast({
        title: 'Terms Not Accepted',
        description: 'Please agree to the terms and conditions.',
        variant: 'destructive',
      });
      return;
    }

    // In real app, save to backend/localStorage
    const newApplication = {
      id: `app-${Date.now()}`,
      event_id: eventId,
      student_id: 'springfield-8-A-001', // Mock student ID
      student_name: 'Current Student', // Mock student name
      institution_id: 'springfield-high',
      class_id: 'class-8-A',
      idea_title: ideaTitle,
      idea_description: ideaDescription,
      team_members: isTeamApplication ? teamMembers : undefined,
      is_team_application: isTeamApplication,
      status: 'pending' as const,
      applied_at: new Date().toISOString(),
    };

    console.log('New Application:', newApplication);

    toast({
      title: 'Application Submitted Successfully! 🎉',
      description: `Your application for "${event.title}" has been submitted and is pending review.`,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Apply to {event.title}</DialogTitle>
          <DialogDescription>
            Fill in the details below to submit your application
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Idea Title */}
          <div className="space-y-2">
            <Label htmlFor="idea-title">Idea Title *</Label>
            <Input
              id="idea-title"
              placeholder="Give your idea a catchy title"
              value={ideaTitle}
              onChange={(e) => setIdeaTitle(e.target.value)}
            />
          </div>

          {/* Idea Description */}
          <div className="space-y-2">
            <Label htmlFor="idea-description">Idea Description *</Label>
            <Textarea
              id="idea-description"
              placeholder="Describe your idea in detail - what problem does it solve? How will you implement it?"
              value={ideaDescription}
              onChange={(e) => setIdeaDescription(e.target.value)}
              rows={6}
            />
            <p className="text-xs text-muted-foreground">
              {ideaDescription.length} characters
            </p>
          </div>

          {/* Team Application Toggle */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="team-toggle" className="text-base">
                Team Application
              </Label>
              <p className="text-sm text-muted-foreground">
                Are you applying as a team?
              </p>
            </div>
            <Switch
              id="team-toggle"
              checked={isTeamApplication}
              onCheckedChange={(checked) => {
                setIsTeamApplication(checked);
                if (!checked) {
                  setTeamMembers([{ name: '', role: 'Team Lead' }]);
                }
              }}
            />
          </div>

          {/* Team Members */}
          {isTeamApplication && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Team Members *</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddTeamMember}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Member
                </Button>
              </div>
              <div className="space-y-3">
                {teamMembers.map((member, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="Name"
                      value={member.name}
                      onChange={(e) => handleTeamMemberChange(index, 'name', e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Role (e.g., Developer, Designer)"
                      value={member.role}
                      onChange={(e) => handleTeamMemberChange(index, 'role', e.target.value)}
                      className="flex-1"
                    />
                    {teamMembers.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => handleRemoveTeamMember(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Supporting Documents */}
          <div className="space-y-2">
            <Label>Supporting Documents (Optional)</Label>
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-2">
                Upload presentation, diagrams, or other supporting files
              </p>
              <Button variant="outline" size="sm">
                Choose Files
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                PDF, DOCX, PPT (Max 10MB each)
              </p>
            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="flex items-start space-x-2 rounded-lg border p-4">
            <Checkbox
              id="terms"
              checked={agreedToTerms}
              onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
            />
            <div className="space-y-1 leading-none">
              <Label
                htmlFor="terms"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I agree to the terms and conditions
              </Label>
              <p className="text-sm text-muted-foreground">
                I confirm that all information provided is accurate and I have read the event rules.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              Submit Application
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
