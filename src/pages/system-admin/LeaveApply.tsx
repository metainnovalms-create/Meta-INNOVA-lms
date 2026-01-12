import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CalendarCheck, Calendar, AlertCircle, Info } from 'lucide-react';
import { toast } from 'sonner';
import { leaveApplicationService, leaveBalanceService } from '@/services/leave.service';
import { useAuth } from '@/contexts/AuthContext';
import { 
  LeaveType, 
  LEAVE_TYPE_LABELS, 
  MAX_LEAVES_PER_MONTH,
  CalculatedLeaveBalance
} from '@/types/leave';

export default function LeaveApply() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const [formData, setFormData] = useState({
    start_date: '',
    end_date: '',
    leave_type: 'casual' as LeaveType,
    reason: ''
  });

  const { data: balance, isLoading: balanceLoading } = useQuery({
    queryKey: ['leave-balance', user?.id, currentYear, currentMonth],
    queryFn: () => leaveBalanceService.getBalance(user!.id, currentYear, currentMonth),
    enabled: !!user?.id
  });

  const applyMutation = useMutation({
    mutationFn: leaveApplicationService.applyLeave,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-balance'] });
      queryClient.invalidateQueries({ queryKey: ['my-leave-applications'] });
      toast.success('Leave application submitted successfully');
      setFormData({ start_date: '', end_date: '', leave_type: 'casual', reason: '' });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const calculateDays = () => {
    if (!formData.start_date || !formData.end_date) return 0;
    return leaveApplicationService.calculateWorkingDays(formData.start_date, formData.end_date);
  };

  const getLOPWarning = () => {
    const days = calculateDays();
    if (!balance || days === 0) return null;
    
    const available = Math.min(balance.balance_remaining, MAX_LEAVES_PER_MONTH - balance.total_used);
    if (days > available) {
      const lopDays = days - Math.max(available, 0);
      return `${lopDays} day(s) will be marked as Loss of Pay (LOP)`;
    }
    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.start_date || !formData.end_date || !formData.reason) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (new Date(formData.end_date) < new Date(formData.start_date)) {
      toast.error('End date cannot be before start date');
      return;
    }

    applyMutation.mutate({
      start_date: formData.start_date,
      end_date: formData.end_date,
      leave_type: formData.leave_type,
      reason: formData.reason
    });
  };

  const lopWarning = getLOPWarning();
  const requestedDays = calculateDays();

  return (
    <Layout>
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center gap-3 mb-6">
          <CalendarCheck className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Apply for Leave</h1>
            <p className="text-muted-foreground">Submit a new leave request</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Credit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{balance?.monthly_credit || 1}</div>
              <p className="text-xs text-muted-foreground">leave per month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Carried Forward</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{balance?.carried_forward || 0}</div>
              <p className="text-xs text-muted-foreground">from previous month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Available Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{balance?.balance_remaining || 1}</div>
              <p className="text-xs text-muted-foreground">leaves remaining</p>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-500" />
              <CardTitle className="text-sm">Leave Policy</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-1">
            <p>• You are entitled to 1 leave per month (12 per year)</p>
            <p>• Maximum 1 day can be carried forward to next month</p>
            <p>• Maximum 2 leaves can be taken in a single month (including carry forward)</p>
            <p>• Leaves beyond available balance will be marked as LOP (Loss of Pay)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Leave Application Form
            </CardTitle>
            <CardDescription>Fill in the details for your leave request</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date *</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date *</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    min={formData.start_date || format(new Date(), 'yyyy-MM-dd')}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="leave_type">Leave Type *</Label>
                <Select 
                  value={formData.leave_type} 
                  onValueChange={(v) => setFormData({ ...formData, leave_type: v as LeaveType })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select leave type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sick">{LEAVE_TYPE_LABELS.sick}</SelectItem>
                    <SelectItem value="casual">{LEAVE_TYPE_LABELS.casual}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason *</Label>
                <Textarea
                  id="reason"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Please provide a reason for your leave request"
                  rows={4}
                  required
                />
              </div>

              {requestedDays > 0 && (
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Total Days Requested</span>
                    <Badge variant="secondary" className="text-lg">{requestedDays} day(s)</Badge>
                  </div>
                  {lopWarning && (
                    <div className="flex items-center gap-2 text-amber-600 text-sm">
                      <AlertCircle className="h-4 w-4" />
                      <span>{lopWarning}</span>
                    </div>
                  )}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full" 
                disabled={applyMutation.isPending || !formData.start_date || !formData.end_date}
              >
                {applyMutation.isPending ? 'Submitting...' : 'Submit Leave Application'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}