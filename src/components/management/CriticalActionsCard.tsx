import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LucideIcon, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export interface CriticalAction {
  id: string;
  type: 'purchase' | 'payroll' | 'deadline' | 'info';
  title: string;
  description: string;
  count: number;
  urgency: 'high' | 'medium' | 'low';
  deadline?: string;
  amount?: number;
  link: string;
  icon: LucideIcon;
}

interface CriticalActionsCardProps {
  action: CriticalAction;
}

export const CriticalActionsCard = ({ action }: CriticalActionsCardProps) => {
  const Icon = action.icon;

  const urgencyConfig = {
    high: {
      badge: "bg-destructive text-destructive-foreground",
      iconBg: "bg-destructive/10",
      iconColor: "text-destructive",
      border: "border-destructive/20"
    },
    medium: {
      badge: "bg-orange-500 text-white",
      iconBg: "bg-orange-500/10",
      iconColor: "text-orange-500",
      border: "border-orange-500/20"
    },
    low: {
      badge: "bg-blue-500 text-white",
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-500",
      border: "border-blue-500/20"
    }
  };

  const config = urgencyConfig[action.urgency];

  return (
    <Card className={cn("hover:shadow-md transition-shadow duration-200 border-2", config.border)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1">
            <div className={cn("p-3 rounded-lg", config.iconBg)}>
              <Icon className={cn("h-6 w-6", config.iconColor)} />
            </div>
            
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">{action.title}</h3>
                <Badge className={cn("font-semibold", config.badge)}>
                  {action.count}
                </Badge>
              </div>
              
              <p className="text-sm text-muted-foreground">
                {action.description}
              </p>
              
              {action.amount && (
                <p className="text-sm font-semibold text-foreground">
                  Amount: ₹{action.amount.toLocaleString('en-IN')}
                </p>
              )}
              
              {action.deadline && (
                <p className={cn(
                  "text-sm font-medium",
                  action.urgency === 'high' ? 'text-destructive' : 'text-muted-foreground'
                )}>
                  {action.deadline}
                </p>
              )}
            </div>
          </div>

          <Button asChild variant="ghost" size="sm" className="mt-1">
            <Link to={action.link} className="flex items-center gap-1">
              Review
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
