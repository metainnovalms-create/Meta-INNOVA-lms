import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { CustomPosition, SystemAdminFeature } from '@/types/permissions';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield } from 'lucide-react';

interface EditPositionDialogProps {
  position: CustomPosition | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    position_name: string;
    display_name: string;
    description: string;
    visible_features: SystemAdminFeature[];
  }) => void;
  isLoading?: boolean;
}

const allFeatures: { value: SystemAdminFeature; label: string }[] = [
  { value: 'institution_management', label: 'Institution Management' },
  { value: 'course_management', label: 'Course Management' },
  { value: 'assessment_management', label: 'Assessment Management' },
  { value: 'assignment_management', label: 'Assignment Management' },
  { value: 'event_management', label: 'Event Management' },
  { value: 'officer_management', label: 'Officer Management' },
  { value: 'project_management', label: 'Project Management' },
  { value: 'inventory_management', label: 'Inventory Management' },
  { value: 'attendance_payroll', label: 'Attendance and Payroll' },
  { value: 'leave_approvals', label: 'Leave Approvals' },
  { value: 'leave_management', label: 'Leave Management' },
  { value: 'company_holidays', label: 'Company Holidays' },
  { value: 'payroll_management', label: 'Attendance & Payroll Management' },
  { value: 'global_approval_config', label: 'Global Approval Config' },
  { value: 'ats_management', label: 'ATS Management' },
  { value: 'institutional_calendar', label: 'Institutional Calendar' },
  { value: 'reports_analytics', label: 'Reports & Invoice' },
  { value: 'sdg_management', label: 'SDG Management' },
  { value: 'task_management', label: 'Task Management (Create & Assign)' },
  { value: 'task_allotment', label: 'Task Allotment (View Assigned)' },
  { value: 'credential_management', label: 'Credential Management' },
  { value: 'gamification', label: 'Gamification' },
  { value: 'id_configuration', label: 'ID Configuration' },
  { value: 'survey_feedback', label: 'Surveys & Feedback' },
  { value: 'performance_ratings', label: 'Performance & Ratings' },
  { value: 'webinar_management', label: 'Webinar Management' },
  { value: 'crm_clients', label: 'CRM & Clients' },
  { value: 'news_feeds', label: 'News & Feeds' },
  { value: 'ask_metova', label: 'Ask Metova' },
  { value: 'settings', label: 'Settings' },
  { value: 'position_management', label: 'RBAC Management' },
];

export function EditPositionDialog({
  position,
  open,
  onOpenChange,
  onSubmit,
  isLoading = false
}: EditPositionDialogProps) {
  const [formData, setFormData] = useState({
    position_name: '',
    display_name: '',
    description: '',
    visible_features: [] as SystemAdminFeature[]
  });

  useEffect(() => {
    if (position) {
      setFormData({
        position_name: position.position_name,
        display_name: position.display_name,
        description: position.description,
        visible_features: position.visible_features
      });
    }
  }, [position]);

  const handleFeatureToggle = (feature: SystemAdminFeature) => {
    // Protect position_management for CEO to prevent lockout
    if (position?.is_ceo_position && feature === 'position_management') {
      return; // Can't remove Position Management access for CEO
    }

    setFormData(prev => ({
      ...prev,
      visible_features: prev.visible_features.includes(feature)
        ? prev.visible_features.filter(f => f !== feature)
        : [...prev.visible_features, feature]
    }));
  };

  const handleSubmit = () => {
    onSubmit(formData);
  };

  if (!position) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Position: {position.display_name}</DialogTitle>
          <DialogDescription>
            Modify position details and sidebar menu access
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[50vh] px-1">
          <div className="space-y-4 pr-2">
          {position.is_ceo_position && (
            <Alert className="bg-primary/5 border-primary/20">
              <Shield className="h-4 w-4 text-primary" />
              <AlertDescription className="text-primary">
                CEO position: You can modify visible sidebar menus freely. Only "Position Management" cannot be removed to prevent lockout.
              </AlertDescription>
            </Alert>
          )}

          <div>
            <Label htmlFor="position_name">Position Name *</Label>
            <Input
              id="position_name"
              value={formData.position_name}
              onChange={(e) => setFormData({ ...formData, position_name: e.target.value })}
              placeholder="e.g., Project Coordinator, HR Manager"
              disabled={position.is_ceo_position}
            />
          </div>

          <div>
            <Label htmlFor="display_name">Display Name</Label>
            <Input
              id="display_name"
              value={formData.display_name}
              onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              placeholder="Leave empty to use position name"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of this position's responsibilities"
              rows={2}
            />
          </div>

          <div>
            <Label className="mb-3 block">Visible Sidebar Menus *</Label>
            <ScrollArea className="h-40 border rounded-md p-4">
              <div className="space-y-3">
                {allFeatures.map((feature) => {
                  const isProtectedForCEO = position?.is_ceo_position && feature.value === 'position_management';
                  return (
                    <div key={feature.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`edit-${feature.value}`}
                        checked={formData.visible_features.includes(feature.value)}
                        onCheckedChange={() => handleFeatureToggle(feature.value)}
                        disabled={isProtectedForCEO}
                      />
                      <Label 
                        htmlFor={`edit-${feature.value}`} 
                        className={`cursor-pointer font-normal ${isProtectedForCEO ? 'text-muted-foreground' : ''}`}
                      >
                        {feature.label}
                        {isProtectedForCEO && <span className="text-xs ml-1">(Required for CEO)</span>}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
            <p className="text-xs text-muted-foreground mt-2">
              Selected: {formData.visible_features.length} menus
            </p>
          </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !formData.position_name || formData.visible_features.length === 0}
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
