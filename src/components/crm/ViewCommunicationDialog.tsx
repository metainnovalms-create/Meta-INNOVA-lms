import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CommunicationLog } from "@/types/communicationLog";
import { Phone, Mail, Users, MapPin, Calendar, User, Target, AlertTriangle, Paperclip } from "lucide-react";
import { format } from "date-fns";

interface ViewCommunicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  communication: CommunicationLog | null;
  onEdit?: () => void;
}

const typeIcons = {
  call: Phone,
  email: Mail,
  meeting: Users,
  visit: MapPin,
  follow_up: Target,
};

const typeColors = {
  call: "bg-blue-500/10 text-blue-600",
  email: "bg-purple-500/10 text-purple-600",
  meeting: "bg-green-500/10 text-green-600",
  visit: "bg-orange-500/10 text-orange-600",
  follow_up: "bg-yellow-500/10 text-yellow-600",
};

const priorityColors = {
  high: "bg-red-500/10 text-red-600",
  medium: "bg-yellow-500/10 text-yellow-600",
  low: "bg-blue-500/10 text-blue-600",
};

const statusColors = {
  completed: "bg-green-500/10 text-green-600",
  pending: "bg-yellow-500/10 text-yellow-600",
  follow_up_required: "bg-orange-500/10 text-orange-600",
};

export function ViewCommunicationDialog({ open, onOpenChange, communication, onEdit }: ViewCommunicationDialogProps) {
  if (!communication) return null;

  const TypeIcon = typeIcons[communication.type];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${typeColors[communication.type]}`}>
              <TypeIcon className="h-5 w-5" />
            </div>
            {communication.subject}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Institution</p>
              <p className="font-semibold">{communication.institution_name}</p>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className={priorityColors[communication.priority]}>
                {communication.priority.toUpperCase()} PRIORITY
              </Badge>
              <Badge variant="outline" className={statusColors[communication.status]}>
                {communication.status.replace(/_/g, ' ').toUpperCase()}
              </Badge>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Calendar className="h-4 w-4" />
                <span>Communication Date</span>
              </div>
              <p className="font-medium">{format(new Date(communication.date), 'PPP')}</p>
            </div>

            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <User className="h-4 w-4" />
                <span>Conducted By</span>
              </div>
              <p className="font-medium">{communication.conducted_by_name}</p>
            </div>

            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <User className="h-4 w-4" />
                <span>Contact Person</span>
              </div>
              <p className="font-medium">{communication.contact_person}</p>
              <p className="text-sm text-muted-foreground">{communication.contact_role}</p>
            </div>

            <div>
              <Badge variant="outline" className={typeColors[communication.type]}>
                {communication.type.replace(/_/g, ' ').toUpperCase()}
              </Badge>
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="font-semibold mb-2">Communication Notes</h4>
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm whitespace-pre-wrap">{communication.notes}</p>
            </div>
          </div>

          {communication.next_action && communication.next_action_date && (
            <>
              <Separator />
              <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">Next Action Required</h4>
                    <p className="text-sm mb-2">{communication.next_action}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Due: {format(new Date(communication.next_action_date), 'PPP')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {communication.attachments && communication.attachments.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="font-semibold mb-3">Attachments</h4>
                <div className="space-y-2">
                  {communication.attachments.map((attachment, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 border rounded-lg hover:bg-muted/50 cursor-pointer">
                      <Paperclip className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm flex-1">{attachment.file_name}</span>
                      <Button variant="ghost" size="sm" asChild>
                        <a href={attachment.public_url} target="_blank" rel="noopener noreferrer">Download</a>
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={onEdit}>
            Edit Communication
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
