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
import { InvoicePdfPreview } from './InvoicePdfPreview';
import { ExternalLink, FileText, Image as ImageIcon } from 'lucide-react';
import type { Invoice } from '@/types/invoice';
import { format } from 'date-fns';

interface ViewPurchaseInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice | null;
}

export function ViewPurchaseInvoiceDialog({
  open,
  onOpenChange,
  invoice,
}: ViewPurchaseInvoiceDialogProps) {
  if (!invoice) return null;

  const isPdf = invoice.attachment_type === 'application/pdf';
  const isImage = invoice.attachment_type?.startsWith('image/');

  const handleOpenInNewTab = () => {
    if (invoice.attachment_url) {
      window.open(invoice.attachment_url, '_blank');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader className="flex flex-row items-center justify-between">
          <div>
            <DialogTitle>Purchase Invoice {invoice.invoice_number}</DialogTitle>
            <div className="flex items-center gap-2 mt-1">
              <InvoiceStatusBadge status={invoice.status} />
            </div>
          </div>
          {invoice.attachment_url && (
            <Button variant="outline" size="sm" onClick={handleOpenInNewTab}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in New Tab
            </Button>
          )}
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <div className="space-y-6 p-4">
            {/* Invoice Summary */}
            <div className="grid grid-cols-2 gap-6">
              {/* Vendor Info */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-2">VENDOR (BILL FROM)</h4>
                  <div className="bg-muted/30 p-3 rounded-lg">
                    <p className="font-semibold">{invoice.from_company_name}</p>
                    <div className="text-sm text-muted-foreground mt-1 space-y-0.5">
                      {invoice.from_company_address && <p>{invoice.from_company_address}</p>}
                      {invoice.from_company_gstin && <p>GSTIN: {invoice.from_company_gstin}</p>}
                      {invoice.from_company_phone && <p>Phone: {invoice.from_company_phone}</p>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Invoice Details */}
              <div className="space-y-1">
                <div className="border rounded-lg p-3 bg-muted/30">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <span className="text-muted-foreground">Invoice Number:</span>
                    <span className="font-medium">{invoice.invoice_number}</span>
                    
                    {invoice.reference_number && (
                      <>
                        <span className="text-muted-foreground">Vendor Invoice #:</span>
                        <span>{invoice.reference_number}</span>
                      </>
                    )}
                    
                    <span className="text-muted-foreground">Bill Date:</span>
                    <span>{format(new Date(invoice.invoice_date), 'dd.MM.yyyy')}</span>
                    
                    {invoice.due_date && (
                      <>
                        <span className="text-muted-foreground">Due Date:</span>
                        <span>{format(new Date(invoice.due_date), 'dd.MM.yyyy')}</span>
                      </>
                    )}
                    
                    <Separator className="col-span-2 my-1" />
                    
                    <span className="text-muted-foreground font-semibold">Total Amount:</span>
                    <span className="font-bold text-lg">
                      ₹{invoice.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Attached Bill - Full Preview */}
            <div>
              <h4 className="text-sm font-semibold mb-3">ATTACHED VENDOR BILL</h4>
              
              {invoice.attachment_url ? (
                <div className="border rounded-lg overflow-hidden">
                  {isImage ? (
                    <div className="p-4 bg-muted/30 flex justify-center">
                      <img
                        src={invoice.attachment_url}
                        alt="Vendor Bill"
                        className="max-w-full h-auto object-contain rounded cursor-pointer hover:opacity-90 transition-opacity"
                        style={{ maxHeight: '70vh' }}
                        onClick={handleOpenInNewTab}
                      />
                    </div>
                  ) : isPdf ? (
                    <div className="p-4">
                      <InvoicePdfPreview 
                        attachmentUrl={invoice.attachment_url} 
                        title={`Bill ${invoice.invoice_number}`}
                      />
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-muted/30">
                      <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-3" />
                      <p className="font-medium">{invoice.attachment_name}</p>
                      <Button variant="outline" className="mt-3" onClick={handleOpenInNewTab}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open File
                      </Button>
                    </div>
                  )}
                  
                  {/* File Info */}
                  <div className="px-4 py-2 bg-muted/50 border-t flex items-center gap-2 text-sm">
                    {isPdf ? (
                      <FileText className="h-4 w-4 text-red-500" />
                    ) : (
                      <ImageIcon className="h-4 w-4 text-blue-500" />
                    )}
                    <span className="font-medium">{invoice.attachment_name}</span>
                    <span className="text-muted-foreground">
                      ({invoice.attachment_type?.split('/')[1]?.toUpperCase()})
                    </span>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No bill attached to this invoice</p>
                </div>
              )}
            </div>

            {/* Notes */}
            {invoice.notes && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Notes</h4>
                <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
                  {invoice.notes}
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}