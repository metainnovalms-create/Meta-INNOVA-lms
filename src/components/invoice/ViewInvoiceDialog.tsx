import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { InvoiceStatusBadge } from './InvoiceStatusBadge';
import { Download, Printer, Loader2 } from 'lucide-react';
import type { Invoice } from '@/types/invoice';
import { format } from 'date-fns';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { InvoicePDF } from './pdf/InvoicePDF';
import { generatePDFFilename } from '@/services/pdf.service';

interface ViewInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice | null;
  onDownload?: (invoice: Invoice) => void;
}

export function ViewInvoiceDialog({
  open,
  onOpenChange,
  invoice,
}: ViewInvoiceDialogProps) {
  const [copyType] = useState<'original' | 'duplicate' | 'triplicate'>('original');
  
  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const isInterState = invoice.from_company_state_code !== invoice.to_company_state_code;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader className="flex flex-row items-center justify-between">
          <div>
            <DialogTitle>Invoice {invoice.invoice_number}</DialogTitle>
            <div className="flex items-center gap-2 mt-1">
              <InvoiceStatusBadge status={invoice.status} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <PDFDownloadLink
              document={<InvoicePDF invoice={invoice} copyType={copyType} />}
              fileName={generatePDFFilename(invoice.invoice_number, invoice.invoice_type)}
            >
              {({ loading }) => (
                <Button size="sm" disabled={loading}>
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  {loading ? 'Generating...' : 'Download PDF'}
                </Button>
              )}
            </PDFDownloadLink>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <div className="space-y-6 p-4 bg-background" id="invoice-content">
            {/* Header */}
            <div className="text-center">
              <h1 className="text-2xl font-bold text-primary">TAX INVOICE</h1>
            </div>

            {/* Company Details & Invoice Info */}
            <div className="grid grid-cols-2 gap-6">
              {/* From */}
              <div>
                <h3 className="font-semibold text-lg">{invoice.from_company_name}</h3>
                <div className="text-sm text-muted-foreground mt-1 space-y-0.5">
                  <p>{invoice.from_company_address}</p>
                  <p>{invoice.from_company_city}, {invoice.from_company_state} {invoice.from_company_pincode}</p>
                  {invoice.from_company_gstin && <p>GSTIN: {invoice.from_company_gstin}</p>}
                  {invoice.from_company_phone && <p>Phone: {invoice.from_company_phone}</p>}
                  {invoice.from_company_email && <p>Email: {invoice.from_company_email}</p>}
                </div>
              </div>

              {/* Invoice Details */}
              <div className="text-right space-y-1">
                <div className="inline-block text-left border rounded-lg p-3 bg-muted/30">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    <span className="text-muted-foreground">Invoice Number:</span>
                    <span className="font-medium">{invoice.invoice_number}</span>
                    <span className="text-muted-foreground">Invoice Date:</span>
                    <span>{format(new Date(invoice.invoice_date), 'dd.MM.yyyy')}</span>
                    {invoice.terms && (
                      <>
                        <span className="text-muted-foreground">Terms:</span>
                        <span>{invoice.terms}</span>
                      </>
                    )}
                    {invoice.due_date && (
                      <>
                        <span className="text-muted-foreground">Due Date:</span>
                        <span>{format(new Date(invoice.due_date), 'dd.MM.yyyy')}</span>
                      </>
                    )}
                    {invoice.place_of_supply && (
                      <>
                        <span className="text-muted-foreground">Place of Supply:</span>
                        <span>{invoice.place_of_supply}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Bill To */}
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-2">BILL TO</h4>
              <div className="bg-muted/30 p-3 rounded-lg">
                <p className="font-semibold">{invoice.to_company_name}</p>
                <div className="text-sm text-muted-foreground mt-1 space-y-0.5">
                  {invoice.to_company_address && <p>{invoice.to_company_address}</p>}
                  {(invoice.to_company_city || invoice.to_company_state) && (
                    <p>
                      {invoice.to_company_city}
                      {invoice.to_company_city && invoice.to_company_state && ', '}
                      {invoice.to_company_state} {invoice.to_company_pincode}
                    </p>
                  )}
                  {invoice.to_company_gstin && <p>GSTIN: {invoice.to_company_gstin}</p>}
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 font-semibold">Description</th>
                    <th className="text-center p-3 font-semibold w-24">HSN/SAC</th>
                    <th className="text-right p-3 font-semibold w-20">Qty</th>
                    <th className="text-right p-3 font-semibold w-24">Rate</th>
                    <th className="text-right p-3 font-semibold w-28">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.line_items?.map((item, index) => (
                    <tr key={index} className="border-t">
                      <td className="p-3">{item.description}</td>
                      <td className="p-3 text-center">{item.hsn_sac_code || '-'}</td>
                      <td className="p-3 text-right">{item.quantity}</td>
                      <td className="p-3 text-right">₹{item.rate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="p-3 text-right font-medium">₹{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-72 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sub Total:</span>
                  <span>₹{invoice.sub_total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                {!isInterState ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">CGST ({invoice.cgst_rate}%):</span>
                      <span>₹{(invoice.cgst_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">SGST ({invoice.sgst_rate}%):</span>
                      <span>₹{(invoice.sgst_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">IGST ({invoice.igst_rate}%):</span>
                    <span>₹{(invoice.igst_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                {invoice.tds_amount && invoice.tds_amount > 0 && (
                  <div className="flex justify-between text-destructive">
                    <span>TDS Withheld (-):</span>
                    <span>₹{invoice.tds_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-semibold text-base">
                  <span>Total:</span>
                  <span>₹{invoice.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Balance Due:</span>
                  <span>₹{invoice.balance_due.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            {/* Total in Words */}
            {invoice.total_in_words && (
              <div className="bg-muted/30 p-3 rounded-lg">
                <span className="text-sm text-muted-foreground">Total In Words: </span>
                <span className="text-sm font-medium">{invoice.total_in_words}</span>
              </div>
            )}

            {/* Notes */}
            {invoice.notes && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Notes</h4>
                <p className="text-sm text-muted-foreground">{invoice.notes}</p>
              </div>
            )}

            {/* Bank Details */}
            {invoice.bank_details && Object.keys(invoice.bank_details).length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Bank Details</h4>
                <div className="bg-muted/30 p-3 rounded-lg text-sm space-y-1">
                  {invoice.bank_details.account_holder && (
                    <p>Account Holder: {invoice.bank_details.account_holder}</p>
                  )}
                  {invoice.bank_details.bank_name && (
                    <p>Bank: {invoice.bank_details.bank_name}</p>
                  )}
                  {invoice.bank_details.account_number && (
                    <p>Account No: {invoice.bank_details.account_number}</p>
                  )}
                  {invoice.bank_details.account_type && (
                    <p>Account Type: {invoice.bank_details.account_type}</p>
                  )}
                  {invoice.bank_details.ifsc_code && (
                    <p>IFSC Code: {invoice.bank_details.ifsc_code}</p>
                  )}
                </div>
              </div>
            )}

            {/* Terms & Conditions */}
            {invoice.terms_and_conditions && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Terms & Conditions</h4>
                <div className="text-sm text-muted-foreground whitespace-pre-line">
                  {invoice.terms_and_conditions}
                </div>
              </div>
            )}

            {/* Signature */}
            <div className="flex justify-end pt-6">
              <div className="text-center">
                {invoice.signature_url ? (
                  <div className="flex justify-center mb-2">
                    <img
                      src={invoice.signature_url}
                      alt="Authorized signatory signature"
                      className="h-14 w-auto object-contain"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="flex justify-center mb-2">
                    <div className="w-40 border-b" />
                  </div>
                )}
                <p className="text-sm text-muted-foreground mb-8">Authorized Signatory</p>
                <p className="font-medium">For {invoice.from_company_name}</p>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
