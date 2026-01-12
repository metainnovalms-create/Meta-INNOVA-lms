import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, ArrowRight, Wallet, AlertTriangle, CheckCircle } from 'lucide-react';
import { useApplicantLeaveBalance, usePendingLeavesCount } from '@/hooks/useApplicantLeaveBalance';
import { cn } from '@/lib/utils';

interface ApplicantLeaveBalanceCardProps {
  applicantId: string;
  leaveMonth: number;
  leaveYear: number;
  requestedDays?: number;
  compact?: boolean;
  className?: string;
}

export function ApplicantLeaveBalanceCard({
  applicantId,
  leaveMonth,
  leaveYear,
  requestedDays,
  compact = false,
  className
}: ApplicantLeaveBalanceCardProps) {
  const { data: balance, isLoading: balanceLoading } = useApplicantLeaveBalance(
    applicantId,
    leaveYear,
    leaveMonth
  );
  
  const { data: pendingCount, isLoading: pendingLoading } = usePendingLeavesCount(
    applicantId,
    leaveYear,
    leaveMonth
  );

  const isLoading = balanceLoading || pendingLoading;

  if (isLoading) {
    return (
      <Card className={cn("", className)}>
        <CardContent className="p-4">
          <div className="flex gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 flex-1" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const monthlyCredit = balance?.monthly_credit ?? 1;
  const carriedForward = balance?.carried_forward ?? 0;
  const totalAvailable = balance?.total_available ?? (monthlyCredit + carriedForward);
  const balanceRemaining = balance?.balance_remaining ?? totalAvailable;
  const lopDays = balance?.lop_days ?? 0;

  // Calculate paid vs LOP for requested days
  let paidDays = 0;
  let lopRequested = 0;
  if (requestedDays && requestedDays > 0) {
    paidDays = Math.min(requestedDays, balanceRemaining);
    lopRequested = Math.max(0, requestedDays - balanceRemaining);
  }

  const monthName = new Date(leaveYear, leaveMonth - 1).toLocaleString('default', { month: 'long' });

  if (compact) {
    return (
      <div className={cn("bg-muted/50 rounded-lg p-3 space-y-2", className)}>
        <div className="flex items-center gap-2 text-sm font-medium">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>Leave Balance ({monthName} {leaveYear})</span>
        </div>
        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          <div className="bg-background rounded p-2">
            <div className="font-semibold text-primary">{monthlyCredit}</div>
            <div className="text-muted-foreground">Credit</div>
          </div>
          <div className="bg-background rounded p-2">
            <div className="font-semibold text-blue-600">{carriedForward}</div>
            <div className="text-muted-foreground">Carried</div>
          </div>
          <div className="bg-background rounded p-2">
            <div className="font-semibold text-green-600">{balanceRemaining}</div>
            <div className="text-muted-foreground">Available</div>
          </div>
          <div className="bg-background rounded p-2">
            <div className="font-semibold text-orange-600">{pendingCount || 0}</div>
            <div className="text-muted-foreground">Pending</div>
          </div>
        </div>
        
        {requestedDays && requestedDays > 0 && (
          <div className="border-t pt-2 mt-2">
            <div className="text-xs font-medium mb-1">Payment Breakdown:</div>
            <div className="flex gap-2">
              {paidDays > 0 && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {paidDays} Paid
                </Badge>
              )}
              {lopRequested > 0 && (
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {lopRequested} LOP
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Leave Balance - {monthName} {leaveYear}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-5 gap-3">
          <div className="text-center p-3 bg-primary/5 rounded-lg">
            <div className="text-2xl font-bold text-primary">{monthlyCredit}</div>
            <div className="text-xs text-muted-foreground">This Month's Credit</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{carriedForward}</div>
            <div className="text-xs text-muted-foreground">Carried Forward</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{balanceRemaining}</div>
            <div className="text-xs text-muted-foreground">Available</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{pendingCount || 0}</div>
            <div className="text-xs text-muted-foreground">Pending</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{lopDays}</div>
            <div className="text-xs text-muted-foreground">LOP Days</div>
          </div>
        </div>

        {requestedDays && requestedDays > 0 && (
          <div className="border-t pt-3">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Payment Breakdown for {requestedDays} day(s):</span>
            </div>
            <div className="flex items-center gap-3">
              {paidDays > 0 && (
                <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-sm">
                  <CheckCircle className="h-4 w-4" />
                  <span>{paidDays} day(s) Paid</span>
                </div>
              )}
              {paidDays > 0 && lopRequested > 0 && (
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              )}
              {lopRequested > 0 && (
                <div className="flex items-center gap-2 bg-orange-50 text-orange-700 px-3 py-1.5 rounded-full text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  <span>{lopRequested} day(s) LOP</span>
                </div>
              )}
              {paidDays === 0 && lopRequested === 0 && (
                <span className="text-sm text-muted-foreground">Select leave days to see breakdown</span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Inline version for use in dialogs
export function LeaveBalanceInline({
  applicantId,
  leaveMonth,
  leaveYear,
  requestedDays
}: {
  applicantId: string;
  leaveMonth: number;
  leaveYear: number;
  requestedDays?: number;
}) {
  const { data: balance, isLoading } = useApplicantLeaveBalance(
    applicantId,
    leaveYear,
    leaveMonth
  );

  if (isLoading) {
    return <Skeleton className="h-6 w-48" />;
  }

  const balanceRemaining = balance?.balance_remaining ?? (balance?.monthly_credit ?? 1) + (balance?.carried_forward ?? 0);
  
  let paidDays = 0;
  let lopRequested = 0;
  if (requestedDays && requestedDays > 0) {
    paidDays = Math.min(requestedDays, balanceRemaining);
    lopRequested = Math.max(0, requestedDays - balanceRemaining);
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
        Balance: {balanceRemaining} day(s)
      </Badge>
      {requestedDays && requestedDays > 0 && (
        <>
          {paidDays > 0 && (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              <CheckCircle className="h-3 w-3 mr-1" />
              {paidDays} Paid
            </Badge>
          )}
          {lopRequested > 0 && (
            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {lopRequested} LOP
            </Badge>
          )}
        </>
      )}
    </div>
  );
}
