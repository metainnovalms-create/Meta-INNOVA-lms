import { Progress } from "@/components/ui/progress";
import { AlertTriangle, Sparkles } from "lucide-react";

interface PromptUsageIndicatorProps {
  used: number;
  limit: number;
  limitEnabled: boolean;
}

export const PromptUsageIndicator = ({ used, limit, limitEnabled }: PromptUsageIndicatorProps) => {
  if (!limitEnabled) return null;

  const percentage = Math.min((used / limit) * 100, 100);
  const remaining = Math.max(limit - used, 0);
  const isLimitReached = used >= limit;

  return (
    <div className={`px-4 py-3 border-b ${isLimitReached ? 'bg-destructive/10 border-destructive/20' : 'bg-muted/50'}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-sm">
          {isLimitReached ? (
            <>
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="font-medium text-destructive">Monthly Limit Reached</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="font-medium">Prompts this month</span>
            </>
          )}
        </div>
        <span className={`text-sm font-medium ${isLimitReached ? 'text-destructive' : 'text-muted-foreground'}`}>
          {used}/{limit}
        </span>
      </div>
      <Progress value={percentage} className={`h-2 ${isLimitReached ? '[&>div]:bg-destructive' : ''}`} />
      {!isLimitReached && remaining <= 3 && (
        <p className="text-xs text-amber-600 mt-1">
          Only {remaining} prompt{remaining !== 1 ? 's' : ''} remaining this month
        </p>
      )}
      {isLimitReached && (
        <p className="text-xs text-destructive mt-1">
          Your limit resets on the 1st of next month
        </p>
      )}
    </div>
  );
};
