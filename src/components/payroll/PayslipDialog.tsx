/**
 * Payslip Dialog Component
 * Professional payslip view with PDF export capability
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Download, Building2, User, Calendar, Wallet } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '@/utils/attendanceHelpers';

interface PayslipData {
  // Employee Info
  employee_name: string;
  employee_id: string;
  designation: string;
  department?: string;
  institution_name?: string;
  pan?: string;
  bank_account?: string;

  // Period
  month: number;
  year: number;
  pay_date?: string;

  // Earnings
  basic_salary: number;
  hra: number;
  conveyance_allowance: number;
  medical_allowance: number;
  special_allowance: number;
  overtime_pay: number;
  other_earnings?: number;

  // Deductions
  pf_deduction: number;
  professional_tax: number;
  tds: number;
  esi?: number;
  lop_deduction: number;
  other_deductions?: number;

  // Attendance
  working_days: number;
  days_present: number;
  days_leave: number;
  paid_leave_days: number;
  lop_leave_days: number;
  unmarked_days: number;
  days_lop: number;
  late_days: number;
  overtime_hours: number;
  total_hours_worked: number;

  // Totals
  gross_earnings: number;
  total_deductions: number;
  net_pay: number;
}

interface CompanyProfile {
  company_name: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  logo_url?: string;
}

interface PayslipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payslipData: PayslipData | null;
  companyProfile?: CompanyProfile | null;
}

export function PayslipDialog({
  open,
  onOpenChange,
  payslipData,
  companyProfile,
}: PayslipDialogProps) {
  if (!payslipData) return null;

  const companyName = companyProfile?.company_name || 'Company Name';
  const companyAddress = [
    companyProfile?.address,
    companyProfile?.city,
    companyProfile?.state,
    companyProfile?.pincode,
  ].filter(Boolean).join(', ') || 'Address';

  const monthName = format(new Date(payslipData.year, payslipData.month - 1), 'MMMM yyyy');

  const handleDownload = () => {
    // Trigger print which can save as PDF
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto print:max-w-none print:max-h-none print:overflow-visible">
        <DialogHeader className="print:hidden">
          <DialogTitle>Payslip - {monthName}</DialogTitle>
        </DialogHeader>

        {/* Payslip Content */}
        <div className="bg-white dark:bg-background border rounded-lg p-6 space-y-6 print:border-none print:shadow-none">
          {/* Header */}
          <div className="flex items-start justify-between border-b pb-4">
            <div>
              <h1 className="text-xl font-bold">{companyName}</h1>
              <p className="text-sm text-muted-foreground">{companyAddress}</p>
            </div>
            <div className="text-right">
              <Badge variant="outline" className="text-sm font-medium">
                SALARY SLIP
              </Badge>
              <p className="text-lg font-semibold mt-1">{monthName}</p>
            </div>
          </div>

          {/* Employee Details */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
            <div>
              <p className="text-xs text-muted-foreground uppercase">Employee Name</p>
              <p className="font-medium">{payslipData.employee_name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase">Employee ID</p>
              <p className="font-medium">{payslipData.employee_id}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase">Designation</p>
              <p className="font-medium">{payslipData.designation}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase">Institution</p>
              <p className="font-medium">{payslipData.institution_name || '-'}</p>
            </div>
          </div>

          {/* Earnings & Deductions */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Earnings Column */}
            <div className="space-y-3">
              <h3 className="font-semibold text-green-700 dark:text-green-400 flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                EARNINGS
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Basic Salary</span>
                  <span className="font-medium">{formatCurrency(payslipData.basic_salary)}</span>
                </div>
                <div className="flex justify-between">
                  <span>House Rent Allowance (HRA)</span>
                  <span className="font-medium">{formatCurrency(payslipData.hra)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Conveyance Allowance</span>
                  <span className="font-medium">{formatCurrency(payslipData.conveyance_allowance)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Medical Allowance</span>
                  <span className="font-medium">{formatCurrency(payslipData.medical_allowance)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Special Allowance</span>
                  <span className="font-medium">{formatCurrency(payslipData.special_allowance)}</span>
                </div>
                {payslipData.overtime_pay > 0 && (
                  <div className="flex justify-between text-orange-600">
                    <span>Overtime Pay ({payslipData.overtime_hours}h)</span>
                    <span className="font-medium">{formatCurrency(payslipData.overtime_pay)}</span>
                  </div>
                )}
                {payslipData.other_earnings && payslipData.other_earnings > 0 && (
                  <div className="flex justify-between">
                    <span>Other Earnings</span>
                    <span className="font-medium">{formatCurrency(payslipData.other_earnings)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-semibold text-green-700 dark:text-green-400">
                  <span>GROSS EARNINGS</span>
                  <span>{formatCurrency(payslipData.gross_earnings)}</span>
                </div>
              </div>
            </div>

            {/* Deductions Column */}
            <div className="space-y-3">
              <h3 className="font-semibold text-red-700 dark:text-red-400 flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                DEDUCTIONS
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Provident Fund (PF)</span>
                  <span className="font-medium">{formatCurrency(payslipData.pf_deduction)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Professional Tax</span>
                  <span className="font-medium">{formatCurrency(payslipData.professional_tax)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax Deducted at Source (TDS)</span>
                  <span className="font-medium">{formatCurrency(payslipData.tds)}</span>
                </div>
                {payslipData.esi && payslipData.esi > 0 && (
                  <div className="flex justify-between">
                    <span>ESI</span>
                    <span className="font-medium">{formatCurrency(payslipData.esi)}</span>
                  </div>
                )}
                {payslipData.lop_deduction > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>LOP Deduction ({payslipData.days_lop} days)</span>
                    <span className="font-medium">{formatCurrency(payslipData.lop_deduction)}</span>
                  </div>
                )}
                {payslipData.other_deductions && payslipData.other_deductions > 0 && (
                  <div className="flex justify-between">
                    <span>Other Deductions</span>
                    <span className="font-medium">{formatCurrency(payslipData.other_deductions)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-semibold text-red-700 dark:text-red-400">
                  <span>TOTAL DEDUCTIONS</span>
                  <span>{formatCurrency(payslipData.total_deductions)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Net Pay */}
          <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">NET PAYABLE</p>
              <p className="text-3xl font-bold text-primary">
                {formatCurrency(payslipData.net_pay)}
              </p>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              <p>Gross: {formatCurrency(payslipData.gross_earnings)}</p>
              <p>Deductions: {formatCurrency(payslipData.total_deductions)}</p>
            </div>
          </div>

          {/* Attendance Summary */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              ATTENDANCE SUMMARY
            </h3>
            <div className="grid grid-cols-3 md:grid-cols-7 gap-3 text-center text-sm">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-lg font-bold">{payslipData.working_days}</p>
                <p className="text-xs text-muted-foreground">Working Days</p>
              </div>
              <div className="p-3 bg-green-500/10 rounded-lg">
                <p className="text-lg font-bold text-green-600">{payslipData.days_present}</p>
                <p className="text-xs text-muted-foreground">Present</p>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <p className="text-lg font-bold text-blue-600">{payslipData.paid_leave_days || 0}</p>
                <p className="text-xs text-muted-foreground">Paid Leave</p>
              </div>
              <div className="p-3 bg-red-500/10 rounded-lg">
                <p className="text-lg font-bold text-red-600">{payslipData.lop_leave_days || 0}</p>
                <p className="text-xs text-muted-foreground">LOP Leave</p>
              </div>
              <div className="p-3 bg-yellow-500/10 rounded-lg">
                <p className="text-lg font-bold text-yellow-600">{payslipData.unmarked_days || 0}</p>
                <p className="text-xs text-muted-foreground">Unmarked</p>
              </div>
              <div className="p-3 bg-orange-500/10 rounded-lg">
                <p className="text-lg font-bold text-orange-600">{payslipData.late_days}</p>
                <p className="text-xs text-muted-foreground">Late Days</p>
              </div>
              <div className="p-3 bg-purple-500/10 rounded-lg">
                <p className="text-lg font-bold text-purple-600">{payslipData.overtime_hours.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">OT Hours</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-muted-foreground pt-4 border-t">
            <p>This is a computer-generated payslip and does not require a signature.</p>
            <p className="mt-1">Generated on {format(new Date(), 'dd MMM yyyy, HH:mm')}</p>
          </div>
        </div>

        {/* Actions - Download Only */}
        <div className="flex justify-end gap-2 print:hidden">
          <Button onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
