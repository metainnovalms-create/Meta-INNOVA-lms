import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CalendarDays, ChevronDown, UserCheck, Clock, BookOpen } from "lucide-react";
import { format, parseISO } from "date-fns";
import { OfficerLeaveDetails } from "@/hooks/useOfficersOnLeave";
import { useState } from "react";

interface OfficersOnLeaveSectionProps {
  leaves: OfficerLeaveDetails[];
  isLoading?: boolean;
}

const getLeaveTypeBadgeVariant = (leaveType: string) => {
  switch (leaveType.toLowerCase()) {
    case 'sick':
      return 'destructive';
    case 'casual':
      return 'secondary';
    case 'earned':
      return 'default';
    default:
      return 'outline';
  }
};

const formatLeaveType = (leaveType: string) => {
  return leaveType.charAt(0).toUpperCase() + leaveType.slice(1).toLowerCase();
};

export function OfficersOnLeaveSection({ leaves, isLoading }: OfficersOnLeaveSectionProps) {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  if (isLoading) {
    return null;
  }

  if (!leaves || leaves.length === 0) {
    return null;
  }

  const toggleItem = (id: string) => {
    setOpenItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-amber-600" />
          <CardTitle className="text-lg">Officers on Leave Today</CardTitle>
        </div>
        <CardDescription>
          {leaves.length} officer{leaves.length > 1 ? 's' : ''} currently on approved leave
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {leaves.map((leave) => (
          <Card key={leave.id} className="bg-background">
            <CardContent className="pt-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-amber-100 text-amber-700">
                      {leave.officerName.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{leave.officerName}</h4>
                      <Badge variant={getLeaveTypeBadgeVariant(leave.leaveType)}>
                        {formatLeaveType(leave.leaveType)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(parseISO(leave.startDate), 'MMM d, yyyy')} - {format(parseISO(leave.endDate), 'MMM d, yyyy')}
                      <span className="ml-1">({leave.totalDays} day{leave.totalDays > 1 ? 's' : ''})</span>
                    </p>
                  </div>
                </div>
              </div>

              {leave.substituteAssignments.length > 0 && (
                <Collapsible 
                  open={openItems[leave.id]} 
                  onOpenChange={() => toggleItem(leave.id)}
                  className="mt-4"
                >
                  <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-primary hover:underline">
                    <BookOpen className="h-4 w-4" />
                    Substitution Arrangements ({leave.substituteAssignments.length})
                    <ChevronDown className={`h-4 w-4 transition-transform ${openItems[leave.id] ? 'rotate-180' : ''}`} />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-3 space-y-2">
                    {leave.substituteAssignments.map((sub, idx) => (
                      <div 
                        key={idx} 
                        className="rounded-lg border bg-muted/50 p-3 text-sm"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{sub.class_name} - {sub.subject}</span>
                          <Badge variant="outline" className="text-xs">
                            {sub.period_label} ({sub.period_time})
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <UserCheck className="h-3 w-3 text-green-600" />
                          <span>Covered by: <span className="font-medium text-foreground">{sub.substitute_officer_name}</span></span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(parseISO(sub.date), 'EEEE, MMM d, yyyy')}
                        </p>
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )}

              {leave.substituteAssignments.length === 0 && (
                <p className="mt-3 text-sm text-muted-foreground italic">
                  No substitutes assigned for this leave period
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
}
