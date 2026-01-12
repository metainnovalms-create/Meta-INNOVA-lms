import { useState } from "react";
import { LeaveApplication } from "@/types/attendance";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { CalendarDays, User, FileText, Clock } from "lucide-react";

interface LeaveActionDialogProps {
  application: LeaveApplication | null;
  mode: "approve" | "reject" | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (comments?: string, rejectionReason?: string) => void;
}

export function LeaveActionDialog({
  application,
  mode,
  open,
  onOpenChange,
  onConfirm,
}: LeaveActionDialogProps) {
  const [comments, setComments] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (mode === "reject" && rejectionReason.trim().length < 20) {
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === "approve") {
        onConfirm(comments.trim() || undefined);
      } else if (mode === "reject") {
        onConfirm(undefined, rejectionReason.trim());
      }
      
      // Reset form
      setComments("");
      setRejectionReason("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setComments("");
    setRejectionReason("");
    onOpenChange(false);
  };

  if (!application || !mode) return null;

  const leaveTypeLabels = {
    sick: "Sick Leave",
    casual: "Casual Leave",
    earned: "Earned Leave",
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "approve" ? "Approve Leave Application" : "Reject Leave Application"}
          </DialogTitle>
          <DialogDescription>
            Review the application details and {mode === "approve" ? "approve" : "provide a reason for rejection"}
          </DialogDescription>
        </DialogHeader>

        {/* Application Summary */}
        <div className="space-y-4 rounded-lg border p-4 bg-muted/50">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Officer</p>
                <p className="text-sm font-medium">{application.officer_name}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Leave Type</p>
                <Badge variant="outline">{leaveTypeLabels[application.leave_type]}</Badge>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Duration</p>
                <p className="text-sm font-medium">{application.total_days} days</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Applied On</p>
                <p className="text-sm font-medium">
                  {format(new Date(application.applied_at), "PP")}
                </p>
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-1">Date Range</p>
            <p className="text-sm font-medium">
              {format(new Date(application.start_date), "PP")} - {format(new Date(application.end_date), "PP")}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-1">Reason</p>
            <p className="text-sm">{application.reason}</p>
          </div>

          {application.institution_name && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Institution</p>
              <p className="text-sm font-medium">{application.institution_name}</p>
            </div>
          )}
        </div>

        {/* Input Section */}
        {mode === "approve" ? (
          <div className="space-y-2">
            <Label htmlFor="comments">Comments (Optional)</Label>
            <Textarea
              id="comments"
              placeholder="Add any comments for the officer..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={3}
            />
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="rejection-reason">
              Rejection Reason <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="rejection-reason"
              placeholder="Please provide a clear reason for rejecting this leave application (minimum 20 characters)..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
              className={rejectionReason.length > 0 && rejectionReason.length < 20 ? "border-destructive" : ""}
            />
            <p className="text-xs text-muted-foreground">
              {rejectionReason.length}/20 characters minimum
            </p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isSubmitting || 
              (mode === "reject" && rejectionReason.trim().length < 20)
            }
            variant={mode === "approve" ? "default" : "destructive"}
          >
            {isSubmitting 
              ? "Processing..." 
              : mode === "approve" 
              ? "Confirm Approval" 
              : "Confirm Rejection"
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
