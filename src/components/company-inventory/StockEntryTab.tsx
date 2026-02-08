import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Download } from 'lucide-react';
import { format } from 'date-fns';
import { useCompanyStockEntries } from '@/hooks/useCompanyInventory';
import { StockEntryDialog } from './StockEntryDialog';
import { exportStockEntries } from '@/utils/companyInventoryExport';

export function StockEntryTab() {
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: entries = [], isLoading } = useCompanyStockEntries();

  const handleExport = () => {
    exportStockEntries(entries);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle>Stock Entry (Inward)</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Record incoming stock from suppliers
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={handleExport}>
              <Download className="h-4 w-4" />
            </Button>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Entry
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading entries...</div>
        ) : entries.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No stock entries found. Record your first inward entry.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Invoice No</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Rate</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Batch/Location</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>{format(new Date(entry.entry_date), 'dd MMM yyyy')}</TableCell>
                  <TableCell>
                    <div>
                      <span className="font-medium">{entry.item?.item_name}</span>
                      <span className="text-xs text-muted-foreground block">
                        {entry.item?.item_code}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{entry.supplier?.name || '-'}</TableCell>
                  <TableCell>
                    {entry.invoice_number ? (
                      <div>
                        <span>{entry.invoice_number}</span>
                        {entry.invoice_date && (
                          <span className="text-xs text-muted-foreground block">
                            {format(new Date(entry.invoice_date), 'dd/MM/yy')}
                          </span>
                        )}
                      </div>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium">{entry.quantity}</TableCell>
                  <TableCell className="text-right">₹{entry.rate.toLocaleString('en-IN')}</TableCell>
                  <TableCell className="text-right font-medium">
                    ₹{entry.amount.toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell>
                    <div className="text-xs">
                      {entry.batch_serial && <Badge variant="outline">{entry.batch_serial}</Badge>}
                      {entry.location_store && (
                        <span className="text-muted-foreground ml-1">{entry.location_store}</span>
                      )}
                      {!entry.batch_serial && !entry.location_store && '-'}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <StockEntryDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </Card>
  );
}
