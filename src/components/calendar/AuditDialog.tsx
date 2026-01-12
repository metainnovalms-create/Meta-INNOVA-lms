import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Audit } from '@/types/calendar';
import { Badge } from '@/components/ui/badge';
import { getAuditStatusColor } from '@/utils/calendarHelpers';
import { format } from 'date-fns';
import { Calendar, Clock, User, FileText, Link as LinkIcon, AlertCircle } from 'lucide-react';

interface AuditDialogProps {
  audit?: Audit;
  isOpen: boolean;
  onClose: () => void;
}

export function AuditDialog({ audit, isOpen, onClose }: AuditDialogProps) {
  if (!audit) return null;

  const statusColors = getAuditStatusColor(audit.status);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{audit.title}</DialogTitle>
          <DialogDescription className="capitalize">{audit.type} Audit</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center gap-2">
            <Badge className={`${statusColors.bg} ${statusColors.text} border ${statusColors.border}`}>
              {audit.status.replace('_', ' ')}
            </Badge>
          </div>

          <div className="grid gap-4">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Audit Date & Time</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(audit.audit_date), 'EEEE, MMMM dd, yyyy')}
                </p>
                <p className="text-sm text-muted-foreground">
                  {audit.start_time} ({audit.duration_hours} hours)
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Institution</p>
                <p className="text-sm text-muted-foreground">{audit.institution_name}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Auditors</p>
                <p className="text-sm text-muted-foreground">{audit.auditors.join(', ')}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Scope</p>
                <p className="text-sm text-muted-foreground">{audit.scope}</p>
              </div>
            </div>

            {audit.pre_requirements && (
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Pre-requirements</p>
                  <p className="text-sm text-muted-foreground">{audit.pre_requirements}</p>
                </div>
              </div>
            )}

            {audit.meeting_link && (
              <div className="flex items-start gap-3">
                <LinkIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Meeting Link</p>
                  <a
                    href={audit.meeting_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    {audit.meeting_link}
                  </a>
                </div>
              </div>
            )}

            {audit.findings && (
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Findings</p>
                  <p className="text-sm text-muted-foreground">{audit.findings}</p>
                </div>
              </div>
            )}

            {audit.action_items && audit.action_items.length > 0 && (
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Action Items</p>
                  <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                    {audit.action_items.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Created By</p>
                <p className="text-sm text-muted-foreground">
                  {audit.created_by} on {format(new Date(audit.created_at), 'MMM dd, yyyy')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
