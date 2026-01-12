import { LeaveApplication } from "@/types/attendance";
import { Check, Clock, X, CircleDot } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface LeaveApprovalTimelineProps {
  application: LeaveApplication;
}

export function LeaveApprovalTimeline({ application }: LeaveApprovalTimelineProps) {
  // Generate different timeline steps based on applicant type
  const getTimelineSteps = () => {
    if (application.applicant_type === 'meta_staff') {
      // Meta Staff Flow: Apply -> CEO Approval -> Decision
      return [
        {
          label: "Application Submitted",
          timestamp: application.applied_at,
          status: "completed" as const,
          description: `By: ${application.officer_name}${application.position ? ` (${application.position})` : ''}`,
        },
        {
          label: application.approval_stage === 'ceo_pending' 
            ? "Pending CEO Review" 
            : application.status === 'rejected' && application.rejection_stage === 'ceo'
            ? "CEO Rejected"
            : "CEO Review",
          timestamp: application.approval_stage === 'ceo_pending' ? null : application.reviewed_at,
          status: application.approval_stage === 'ceo_pending' 
            ? "current" 
            : application.status === 'approved' 
            ? "completed"
            : application.status === 'rejected'
            ? "rejected"
            : "pending" as const,
          description: application.approval_stage === 'ceo_pending'
            ? "Waiting for CEO approval"
            : application.reviewed_by
            ? `Reviewed by: ${application.reviewed_by}`
            : "(Not yet reviewed)",
        },
        {
          label: application.status === "approved" 
            ? "Approved" 
            : application.status === "rejected" 
            ? "Rejected" 
            : "Decision",
          timestamp: application.reviewed_at,
          status: application.status === "approved" 
            ? "approved" 
            : application.status === "rejected" 
            ? "rejected" 
            : "pending" as const,
          description: application.status === "approved" 
            ? application.admin_comments || "Leave approved" 
            : application.status === "rejected" 
            ? `Reason: ${application.rejection_reason}` 
            : "(Awaiting decision)",
        },
      ];
    }

    // Innovation Officer Flow: Apply -> Manager -> AGM -> Decision
    return [
      {
        label: "Application Submitted",
        timestamp: application.applied_at,
        status: "completed" as const,
        description: `By: ${application.officer_name}`,
      },
      {
        label: application.approval_stage === 'manager_pending'
          ? "Pending Manager Review"
          : application.status === 'rejected' && application.rejection_stage === 'manager'
          ? "Manager Rejected"
          : "Manager Approved",
        timestamp: application.approved_by_manager_at || null,
        status: application.approval_stage === 'manager_pending'
          ? "current"
          : application.status === 'rejected' && application.rejection_stage === 'manager'
          ? "rejected"
          : application.approved_by_manager
          ? "completed"
          : "pending" as const,
        description: application.approval_stage === 'manager_pending'
          ? "Waiting for Manager approval"
          : application.approved_by_manager
          ? `Approved by: ${application.approved_by_manager}${application.manager_comments ? ` - "${application.manager_comments}"` : ''}`
          : application.rejection_stage === 'manager'
          ? `Rejected by: ${application.rejected_by}`
          : "(Pending)",
      },
      {
        label: application.approval_stage === 'agm_pending'
          ? "Pending AGM Review"
          : application.status === 'rejected' && application.rejection_stage === 'agm'
          ? "AGM Rejected"
          : application.approved_by_agm
          ? "AGM Approved"
          : "AGM Review",
        timestamp: application.approved_by_agm_at || null,
        status: application.approval_stage === 'agm_pending'
          ? "current"
          : application.status === 'rejected' && application.rejection_stage === 'agm'
          ? "rejected"
          : application.approved_by_agm
          ? "completed"
          : "pending" as const,
        description: application.approval_stage === 'agm_pending'
          ? "Waiting for AGM approval"
          : application.approved_by_agm
          ? `Approved by: ${application.approved_by_agm}${application.agm_comments ? ` - "${application.agm_comments}"` : ''}`
          : application.rejection_stage === 'agm'
          ? `Rejected by: ${application.rejected_by}`
          : "(Pending Manager approval first)",
      },
      {
        label: application.status === "approved" 
          ? "Fully Approved" 
          : application.status === "rejected" 
          ? "Rejected" 
          : "Final Decision",
        timestamp: application.reviewed_at,
        status: application.status === "approved" 
          ? "approved" 
          : application.status === "rejected" 
          ? "rejected" 
          : "pending" as const,
        description: application.status === "approved" 
          ? "Leave has been fully approved" 
          : application.status === "rejected" 
          ? `Reason: ${application.rejection_reason}` 
          : "(Awaiting approvals)",
      },
    ];
  };

  const steps = getTimelineSteps();

  const getStepIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <Check className="h-5 w-5 text-green-500" />;
      case "current":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case "approved":
        return <Check className="h-5 w-5 text-green-500" />;
      case "rejected":
        return <X className="h-5 w-5 text-red-500" />;
      default:
        return <CircleDot className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStepColor = (status: string) => {
    switch (status) {
      case "completed":
        return "border-green-500 bg-green-500/10";
      case "current":
        return "border-yellow-500 bg-yellow-500/10 animate-pulse";
      case "approved":
        return "border-green-500 bg-green-500/10";
      case "rejected":
        return "border-red-500 bg-red-500/10";
      default:
        return "border-muted bg-muted/50";
    }
  };

  const getLineColor = (index: number) => {
    const step = steps[index];
    if (step.status === "completed" || step.status === "approved") return "bg-green-500";
    if (step.status === "rejected") return "bg-red-500";
    if (step.status === "current") return "bg-yellow-500";
    return "bg-muted";
  };

  return (
    <div className="space-y-6">
      {steps.map((step, index) => (
        <div key={index} className="relative flex gap-4">
          {/* Vertical line */}
          {index < steps.length - 1 && (
            <div 
              className={cn(
                "absolute left-[22px] top-12 h-[calc(100%+0.5rem)] w-0.5 transition-colors",
                getLineColor(index)
              )}
            />
          )}
          
          {/* Step indicator */}
          <div className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 transition-all",
            getStepColor(step.status)
          )}>
            {getStepIcon(step.status)}
          </div>
          
          {/* Step content */}
          <div className="flex-1 pt-1">
            <h4 className="font-semibold text-sm">{step.label}</h4>
            {step.timestamp && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {format(new Date(step.timestamp), "PPp")}
              </p>
            )}
            <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
