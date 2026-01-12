import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useUpdateApplication } from '@/hooks/useHRManagement';
import { CandidateOffer, JobApplication, JobPosting } from '@/types/hr';
import { Users, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface OnboardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  offer: (CandidateOffer & { application: JobApplication & { job: JobPosting } }) | null;
}

export function OnboardDialog({ open, onOpenChange, offer }: OnboardDialogProps) {
  const navigate = useNavigate();
  const updateApplication = useUpdateApplication();

  if (!offer) return null;

  const targetRole = offer.application?.job?.target_role || 'officer';

  const handleOnboardAsOfficer = () => {
    updateApplication.mutate({ id: offer.application_id, status: 'hired' });
    onOpenChange(false);
    // Navigate to officer management with pre-filled data
    navigate('/system-admin/officers', { 
      state: { 
        prefill: {
          full_name: offer.application?.candidate_name,
          email: offer.application?.candidate_email,
          phone: offer.application?.candidate_phone,
        }
      }
    });
  };

  const handleOnboardAsMetaStaff = () => {
    updateApplication.mutate({ id: offer.application_id, status: 'hired' });
    onOpenChange(false);
    // Navigate to RBAC management with pre-filled data
    navigate('/system-admin/position-management', { 
      state: { 
        prefill: {
          full_name: offer.application?.candidate_name,
          email: offer.application?.candidate_email,
        }
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Onboard {offer.application?.candidate_name}</DialogTitle>
          <DialogDescription>
            Choose how to onboard this candidate. They will be added to the system and can access their dashboard.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <Button 
            variant={targetRole === 'officer' ? 'default' : 'outline'}
            className="h-24 flex-col"
            onClick={handleOnboardAsOfficer}
          >
            <Users className="h-8 w-8 mb-2" />
            <span>Onboard as Officer</span>
            <span className="text-xs text-muted-foreground">Innovation Officer role</span>
          </Button>
          <Button 
            variant={targetRole === 'meta_staff' ? 'default' : 'outline'}
            className="h-24 flex-col"
            onClick={handleOnboardAsMetaStaff}
          >
            <Shield className="h-8 w-8 mb-2" />
            <span>Onboard as Meta Staff</span>
            <span className="text-xs text-muted-foreground">System Admin role</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
