import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail, Users, Calendar, FileText } from "lucide-react";
import { CommunicationLog } from "@/types/communicationLog";
import { format } from "date-fns";

interface CommunicationTimelineProps {
  logs: CommunicationLog[];
  institutionName?: string;
}

const typeIcons = {
  call: Phone,
  email: Mail,
  meeting: Users,
  visit: Users,
  follow_up: Calendar,
};

const typeColors = {
  call: "bg-blue-500",
  email: "bg-purple-500",
  meeting: "bg-green-500",
  visit: "bg-orange-500",
  follow_up: "bg-yellow-500",
};

export function CommunicationTimeline({ logs, institutionName }: CommunicationTimelineProps) {
  const sortedLogs = [...logs].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Communication History
          {institutionName && <span className="text-muted-foreground"> - {institutionName}</span>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-6">
          <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border" />

          {sortedLogs.map((log, index) => {
            const TypeIcon = typeIcons[log.type];
            const isLast = index === sortedLogs.length - 1;

            return (
              <div key={log.id} className="relative pl-12">
                <div className={`absolute left-0 w-10 h-10 rounded-full ${typeColors[log.type]} flex items-center justify-center`}>
                  <TypeIcon className="h-5 w-5 text-white" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-sm">{log.subject}</h4>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(log.date), 'MMM dd, yyyy h:mm a')}
                      </p>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {log.type.replace(/_/g, ' ')}
                    </Badge>
                  </div>

                  <div className="text-sm space-y-1">
                    <p className="text-muted-foreground">
                      <span className="font-medium">Contact:</span> {log.contact_person} ({log.contact_role})
                    </p>
                    <p className="text-muted-foreground">
                      <span className="font-medium">Conducted by:</span> {log.conducted_by_name}
                    </p>
                  </div>

                  <p className="text-sm bg-muted/50 p-3 rounded-lg">{log.notes}</p>

                  {log.next_action && log.next_action_date && (
                    <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <Calendar className="h-4 w-4 text-blue-600 mt-0.5" />
                      <div className="flex-1 text-sm">
                        <p className="font-medium text-blue-600">Next Action</p>
                        <p className="text-muted-foreground">{log.next_action}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Due: {format(new Date(log.next_action_date), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    </div>
                  )}

                  {log.attachments && log.attachments.length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      <span>{log.attachments.length} attachment(s)</span>
                    </div>
                  )}
                </div>

                {!isLast && <div className="mt-6" />}
              </div>
            );
          })}

          {sortedLogs.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No communication history available
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
