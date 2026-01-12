import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, TrendingUp, AlertCircle, CheckCircle, Clock, Download } from "lucide-react";
import { BillingRecord } from "@/data/mockCRMData";
import { format, isPast } from "date-fns";

interface BillingDashboardProps {
  billingRecords: BillingRecord[];
  onViewInvoice?: (record: BillingRecord) => void;
  onSendReminder?: (record: BillingRecord) => void;
}

const statusColors = {
  paid: "bg-green-500/10 text-green-600",
  pending: "bg-yellow-500/10 text-yellow-600",
  overdue: "bg-red-500/10 text-red-600",
  cancelled: "bg-gray-500/10 text-gray-600",
};

const statusIcons = {
  paid: CheckCircle,
  pending: Clock,
  overdue: AlertCircle,
  cancelled: AlertCircle,
};

export function BillingDashboard({ billingRecords, onViewInvoice, onSendReminder }: BillingDashboardProps) {
  const totalRevenue = billingRecords
    .filter(r => r.status === 'paid')
    .reduce((sum, r) => sum + r.amount, 0);

  const pendingAmount = billingRecords
    .filter(r => r.status === 'pending' || r.status === 'overdue')
    .reduce((sum, r) => sum + r.amount, 0);

  const overdueCount = billingRecords.filter(r => r.status === 'overdue').length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{(totalRevenue / 100000).toFixed(1)}L</div>
            <p className="text-xs text-muted-foreground mt-1">From paid invoices</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{(pendingAmount / 100000).toFixed(1)}L</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting payment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Overdue Invoices</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overdueCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Require immediate attention</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Invoices</CardTitle>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Institution</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {billingRecords.map((record) => {
                const StatusIcon = statusIcons[record.status];
                const isOverdue = record.status === 'pending' && isPast(new Date(record.due_date));
                
                return (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.invoice_number}</TableCell>
                    <TableCell>{record.institution_name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{record.billing_period}</TableCell>
                    <TableCell className="font-semibold">₹{(record.amount / 100000).toFixed(1)}L</TableCell>
                    <TableCell className={isOverdue ? "text-red-600" : ""}>
                      {format(new Date(record.due_date), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColors[record.status]}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {record.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewInvoice?.(record)}
                        >
                          View
                        </Button>
                        {(record.status === 'pending' || record.status === 'overdue') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onSendReminder?.(record)}
                          >
                            Remind
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
