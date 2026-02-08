import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Download } from 'lucide-react';
import { format } from 'date-fns';
import { useCompanyStockEntriesBySupplier } from '@/hooks/useCompanyInventory';
import { CompanySupplier } from '@/types/companyInventory';
import { exportSupplierPurchaseHistory } from '@/utils/companyInventoryExport';

interface SupplierHistoryDialogProps {
  supplier: CompanySupplier | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SupplierHistoryDialog({ supplier, open, onOpenChange }: SupplierHistoryDialogProps) {
  const { data: entries = [], isLoading } = useCompanyStockEntriesBySupplier(supplier?.id || '');

  const totalAmount = entries.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalQuantity = entries.reduce((sum, e) => sum + e.quantity, 0);

  const handleExport = () => {
    if (supplier) {
      exportSupplierPurchaseHistory(supplier.name, entries);
    }
  };

  if (!supplier) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle>Purchase History: {supplier.name}</DialogTitle>
              <DialogDescription>
                All stock entries from this supplier
              </DialogDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleExport} disabled={entries.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[50vh]">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading history...</div>
          ) : entries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No purchase history found for this supplier.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Invoice No</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{format(new Date(entry.entry_date), 'dd MMM yyyy')}</TableCell>
                    <TableCell>{entry.invoice_number || '-'}</TableCell>
                    <TableCell>
                      <div>
                        <span className="font-medium">{entry.item?.item_name}</span>
                        <span className="text-xs text-muted-foreground block">
                          {entry.item?.item_code}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{entry.quantity}</TableCell>
                    <TableCell className="text-right">₹{entry.rate.toLocaleString('en-IN')}</TableCell>
                    <TableCell className="text-right font-medium">
                      ₹{entry.amount.toLocaleString('en-IN')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {entries.length > 0 && (
          <div className="border-t pt-4 flex justify-end gap-8">
            <div className="text-sm">
              <span className="text-muted-foreground">Total Items: </span>
              <span className="font-medium">{totalQuantity}</span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Total Amount: </span>
              <span className="font-bold">₹{totalAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
