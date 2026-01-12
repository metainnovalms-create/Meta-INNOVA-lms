import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, Mail, Calendar, Users, FileText, Clock, AlertCircle, Trash2 } from "lucide-react";
import { CommunicationLog } from "@/types/communicationLog";
import { format } from "date-fns";

interface CommunicationLogCardProps {
  log: CommunicationLog;
  onEdit?: (log: CommunicationLog) => void;
  onViewDetails?: (log: CommunicationLog) => void;
  onDelete?: (log: CommunicationLog) => void;
}

const typeIcons = {
  call: Phone,
  email: Mail,
  meeting: Users,
  visit: Users,
  follow_up: Clock,
};

const typeColors = {
  call: "bg-blue-500/10 text-blue-600",
  email: "bg-purple-500/10 text-purple-600",
  meeting: "bg-green-500/10 text-green-600",
  visit: "bg-orange-500/10 text-orange-600",
  follow_up: "bg-yellow-500/10 text-yellow-600",
};

const statusColors = {
  completed: "bg-green-500/10 text-green-600",
  pending: "bg-yellow-500/10 text-yellow-600",
  follow_up_required: "bg-red-500/10 text-red-600",
};

const priorityColors = {
  high: "bg-red-500/10 text-red-600",
  medium: "bg-yellow-500/10 text-yellow-600",
  low: "bg-blue-500/10 text-blue-600",
};

export function CommunicationLogCard({ log, onEdit, onViewDetails, onDelete }: CommunicationLogCardProps) {
  const TypeIcon = typeIcons[log.type];
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${typeColors[log.type]}`}>
              <TypeIcon className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">{log.subject}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{log.institution_name}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className={priorityColors[log.priority]}>
              {log.priority.toUpperCase()}
            </Badge>
            <Badge variant="outline" className={statusColors[log.status]}>
              {log.status.replace(/_/g, ' ').toUpperCase()}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{format(new Date(log.date), 'MMM dd, yyyy')}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{log.conducted_by_name}</span>
          </div>
        </div>
        
        <div className="text-sm">
          <p className="text-muted-foreground mb-1">Contact: {log.contact_person} ({log.contact_role})</p>
          <p className="line-clamp-2">{log.notes}</p>
        </div>

        {log.next_action && (
          <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
            <AlertCircle className="h-4 w-4 text-primary mt-0.5" />
            <div className="flex-1 text-sm">
              <p className="font-medium text-foreground">Next Action</p>
              <p className="text-muted-foreground">{log.next_action}</p>
              {log.next_action_date && (
                <p className="text-xs text-muted-foreground mt-1">
                  Due: {format(new Date(log.next_action_date), 'MMM dd, yyyy')}
                </p>
              )}
            </div>
          </div>
        )}

        {log.attachments && log.attachments.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span>{log.attachments.length} attachment(s)</span>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => onViewDetails?.(log)}
          >
            View Details
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => onEdit?.(log)}
          >
            Edit Log
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => onDelete?.(log)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
