import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  DollarSign, 
  TrendingUp,
  Download
} from 'lucide-react';
import { formatCurrency, calculateMonthlyOvertime } from '@/utils/attendanceHelpers';
import { formatLocationDisplay } from '@/utils/locationHelpers';
import type { PayrollRecord, DailyAttendance } from '@/types/attendance';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface PayrollDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payrollRecord: PayrollRecord;
  attendanceRecords: DailyAttendance[];
}

export function PayrollDetailDialog({
  open,
  onOpenChange,
  payrollRecord,
  attendanceRecords,
}: PayrollDetailDialogProps) {
  const overtimeHours = calculateMonthlyOvertime(attendanceRecords, 8);
  
  const handleDownloadPayslip = () => {
    toast.success('Payslip downloaded successfully');
    // In real app: generate PDF payslip
  };

  const handleApprove = () => {
    toast.success('Payroll approved successfully');
    onOpenChange(false);
    // In real app: call API
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Payroll Details - {payrollRecord.officer_name}</DialogTitle>
          <DialogDescription>
            {payrollRecord.employee_id} • {payrollRecord.month}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Actions */}
          <div className="flex items-center justify-between">
            <Badge 
              variant={payrollRecord.status === 'approved' ? 'default' : 'secondary'}
              className="text-sm"
            >
              {payrollRecord.status.toUpperCase()}
            </Badge>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleDownloadPayslip}>
                <Download className="mr-2 h-4 w-4" />
                Download Payslip
              </Button>
              {payrollRecord.status !== 'approved' && (
                <Button size="sm" onClick={handleApprove}>
                  Approve Payroll
                </Button>
              )}
            </div>
          </div>

          {/* Attendance Summary */}
          <div className="grid gap-4 md:grid-cols-4">
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Working Days</p>
              <p className="text-2xl font-bold">{payrollRecord.working_days}</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Days Present</p>
              <p className="text-2xl font-bold text-green-600">{payrollRecord.days_present}</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Days Absent</p>
              <p className="text-2xl font-bold text-red-600">{payrollRecord.days_absent}</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Days Leave</p>
              <p className="text-2xl font-bold text-blue-600">{payrollRecord.days_leave}</p>
            </div>
          </div>

          {/* Overtime Details */}
          {overtimeHours > 0 && (
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold text-green-700">Overtime Worked</h3>
              </div>
              <p className="text-sm text-green-600">
                {overtimeHours.toFixed(1)} overtime hours this month
              </p>
            </div>
          )}

          {/* Salary Components */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Salary Components
            </h3>
            <div className="space-y-2 border rounded-lg p-4">
              {payrollRecord.salary_components.map((component, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-muted-foreground capitalize">
                    {component.component_type.replace(/_/g, ' ')}
                  </span>
                  <span className="font-medium">{formatCurrency(component.amount)}</span>
                </div>
              ))}
              <Separator className="my-2" />
              <div className="flex justify-between font-semibold">
                <span>Total Earnings</span>
                <span>{formatCurrency(payrollRecord.total_earnings)}</span>
              </div>
            </div>
          </div>

          {/* Deductions */}
          {payrollRecord.deductions.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Deductions</h3>
              <div className="space-y-2 border rounded-lg p-4">
                {payrollRecord.deductions.map((deduction, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-muted-foreground capitalize">
                      {deduction.deduction_type.replace(/_/g, ' ')}
                    </span>
                    <span className="font-medium text-red-600">-{formatCurrency(deduction.amount)}</span>
                  </div>
                ))}
                <Separator className="my-2" />
                <div className="flex justify-between font-semibold">
                  <span>Total Deductions</span>
                  <span className="text-red-600">{formatCurrency(payrollRecord.total_deductions)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Net Pay */}
          <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">Net Pay</span>
              <span className="text-2xl font-bold text-primary">{formatCurrency(payrollRecord.net_pay)}</span>
            </div>
          </div>

          {/* Daily Attendance with GPS */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Daily Attendance Records
            </h3>
            <div className="border rounded-lg max-h-[300px] overflow-y-auto">
              <div className="space-y-2 p-4">
                {attendanceRecords.filter(r => r.status === 'present').map((record, index) => (
                  <div key={index} className="flex items-start justify-between p-3 bg-muted rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{format(new Date(record.date), 'MMM dd, yyyy')}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {record.check_in_time} - {record.check_out_time}
                        </span>
                        {record.hours_worked && (
                          <span>{record.hours_worked.toFixed(1)}h worked</span>
                        )}
                      </div>
                      {record.check_in_location && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span>GPS: {record.check_in_location.latitude.toFixed(4)}, {record.check_in_location.longitude.toFixed(4)}</span>
                          {record.location_validated && (
                            <Badge variant="outline" className="ml-2 text-xs">Validated</Badge>
                          )}
                        </div>
                      )}
                    </div>
                    {record.overtime_hours && record.overtime_hours > 0 && (
                      <Badge variant="secondary" className="bg-green-500/10 text-green-700">
                        +{record.overtime_hours.toFixed(1)}h OT
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
