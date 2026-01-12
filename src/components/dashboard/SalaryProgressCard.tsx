import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Wallet, Clock, TrendingUp, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface SalaryProgressCardProps {
  monthlyBase: number;
  daysPresent: number;
  workingDays: number;
  earnedSalary: number;
  overtimeHours: number;
  overtimePay: number;
  totalEarnings: number;
  progressPercentage: number;
  isLoading?: boolean;
}

export function SalaryProgressCard({
  monthlyBase,
  daysPresent,
  workingDays,
  earnedSalary,
  overtimeHours,
  overtimePay,
  totalEarnings,
  progressPercentage,
  isLoading = false,
}: SalaryProgressCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const currentMonth = format(new Date(), 'MMMM yyyy');

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Salary Tracker
          </CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-8 bg-muted rounded w-1/2"></div>
            <div className="h-2 bg-muted rounded w-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              Salary Tracker
            </CardTitle>
            <CardDescription>{currentMonth}</CardDescription>
          </div>
          <Badge variant="outline" className="gap-1">
            <Calendar className="h-3 w-3" />
            {daysPresent}/{workingDays} days
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total Earnings */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Earned Till Date</span>
            <span className="text-2xl font-bold text-primary">{formatCurrency(totalEarnings)}</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {progressPercentage.toFixed(0)}% of expected earnings
          </p>
        </div>

        {/* Breakdown */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              Base Salary
            </div>
            <p className="font-semibold">{formatCurrency(earnedSalary)}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-3 w-3" />
              Overtime ({overtimeHours.toFixed(1)}h)
            </div>
            <p className="font-semibold text-green-600">{formatCurrency(overtimePay)}</p>
          </div>
        </div>

        {/* Monthly Target */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <span className="text-sm font-medium">Monthly Target</span>
          <span className="text-lg font-bold">{formatCurrency(monthlyBase)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
