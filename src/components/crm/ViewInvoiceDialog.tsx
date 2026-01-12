import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BillingRecord } from "@/data/mockCRMData";
import { Download, Printer, Send } from "lucide-react";
import { format } from "date-fns";

interface ViewInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: BillingRecord | null;
  onDownloadPDF?: () => void;
  onSendReminder?: () => void;
}

const statusColors = {
  paid: "bg-green-500/10 text-green-600",
  pending: "bg-yellow-500/10 text-yellow-600",
  overdue: "bg-red-500/10 text-red-600",
  cancelled: "bg-gray-500/10 text-gray-600",
};

export function ViewInvoiceDialog({ 
  open, 
  onOpenChange, 
  invoice,
  onDownloadPDF,
  onSendReminder
}: ViewInvoiceDialogProps) {
  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Invoice Details</span>
            <Badge variant="outline" className={statusColors[invoice.status]}>
              {invoice.status.toUpperCase()}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Invoice Content - Formatted for printing */}
        <div className="space-y-6 print:p-8" id="invoice-content">
          {/* Invoice Header */}
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">INVOICE</h2>
              <p className="text-sm text-muted-foreground mt-1">Meta-Innova Innovation Academy</p>
              <p className="text-sm text-muted-foreground">Education Technology Platform</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-lg">{invoice.invoice_number}</p>
              <p className="text-sm text-muted-foreground">
                Date: {format(new Date(invoice.due_date), 'MMM dd, yyyy')}
              </p>
            </div>
          </div>

          <Separator />

          {/* Bill To / From */}
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h4 className="font-semibold mb-2">Bill To:</h4>
              <p className="font-medium">{invoice.institution_name}</p>
              <p className="text-sm text-muted-foreground">Institution ID: {invoice.institution_id}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Bill From:</h4>
              <p className="font-medium">Meta-Innova Technologies</p>
              <p className="text-sm text-muted-foreground">Platform Services Provider</p>
            </div>
          </div>

          <Separator />

          {/* Invoice Details */}
          <div>
            <h4 className="font-semibold mb-3">Invoice Details</h4>
            <div className="bg-muted/50 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 font-semibold">Description</th>
                    <th className="text-right p-3 font-semibold">Period</th>
                    <th className="text-right p-3 font-semibold">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t">
                    <td className="p-3">Platform Subscription - {invoice.institution_name}</td>
                    <td className="text-right p-3">{invoice.billing_period}</td>
                    <td className="text-right p-3 font-semibold">₹{(invoice.amount / 100000).toFixed(2)}L</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Total Section */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-medium">₹{(invoice.amount / 100000).toFixed(2)}L</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">GST (18%):</span>
                <span className="font-medium">₹{(invoice.amount * 0.18 / 100000).toFixed(2)}L</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg">
                <span className="font-semibold">Total Amount:</span>
                <span className="font-bold">₹{(invoice.amount * 1.18 / 100000).toFixed(2)}L</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Payment Information */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground mb-1">Due Date</p>
              <p className="font-medium">{format(new Date(invoice.due_date), 'PPP')}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Payment Status</p>
              <Badge variant="outline" className={statusColors[invoice.status]}>
                {invoice.status.toUpperCase()}
              </Badge>
            </div>
            {invoice.paid_date && (
              <div>
                <p className="text-muted-foreground mb-1">Paid Date</p>
                <p className="font-medium">{format(new Date(invoice.paid_date), 'PPP')}</p>
              </div>
            )}
            {invoice.payment_method && (
              <div>
                <p className="text-muted-foreground mb-1">Payment Method</p>
                <p className="font-medium">{invoice.payment_method}</p>
              </div>
            )}
          </div>

          {/* Notes */}
          {invoice.notes && (
            <>
              <Separator />
              <div>
                <h4 className="font-semibold mb-2">Notes</h4>
                <p className="text-sm text-muted-foreground">{invoice.notes}</p>
              </div>
            </>
          )}

          {/* Footer */}
          <div className="text-center text-xs text-muted-foreground pt-6 border-t print:block hidden">
            <p>Thank you for your business!</p>
            <p>For queries, contact: support@meta-innova.com</p>
          </div>
        </div>

        <DialogFooter className="flex gap-2 print:hidden">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {(invoice.status === 'pending' || invoice.status === 'overdue') && (
            <Button variant="outline" onClick={onSendReminder}>
              <Send className="h-4 w-4 mr-2" />
              Send Reminder
            </Button>
          )}
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button onClick={onDownloadPDF}>
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #invoice-content,
          #invoice-content * {
            visibility: visible;
          }
          #invoice-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </Dialog>
  );
}
