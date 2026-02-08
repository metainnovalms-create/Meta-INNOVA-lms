import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, AlertTriangle, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { useCompanyItems, useCompanySuppliers, useCompanyStockEntriesByItem, useCompanyStockIssuesByItem, useCompanyStockEntriesBySupplier } from '@/hooks/useCompanyInventory';
import { exportCurrentStockSummary, exportSupplierPurchaseHistory, exportStockLedger } from '@/utils/companyInventoryExport';
import { StockLedgerEntry } from '@/types/companyInventory';

export function ReportsTab() {
  const [reportType, setReportType] = useState('stock-summary');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState('');

  const { data: items = [] } = useCompanyItems();
  const { data: suppliers = [] } = useCompanySuppliers();
  const { data: itemEntries = [] } = useCompanyStockEntriesByItem(selectedItemId);
  const { data: itemIssues = [] } = useCompanyStockIssuesByItem(selectedItemId);
  const { data: supplierEntries = [] } = useCompanyStockEntriesBySupplier(selectedSupplierId);

  const selectedItem = items.find(i => i.id === selectedItemId);
  const selectedSupplier = suppliers.find(s => s.id === selectedSupplierId);

  // Calculate stock ledger entries
  const getStockLedgerEntries = (): StockLedgerEntry[] => {
    if (!selectedItem) return [];
    
    const entries: StockLedgerEntry[] = [];
    let balance = 0;

    // Combine and sort all movements
    const allMovements = [
      ...itemEntries.map(e => ({
        date: e.entry_date,
        type: 'inward' as const,
        reference: e.invoice_number || 'Stock Entry',
        inward_qty: e.quantity,
        outward_qty: 0,
        rate: e.rate,
        amount: e.amount,
        details: e.supplier?.name || '',
      })),
      ...itemIssues.map(i => ({
        date: i.issue_date,
        type: 'outward' as const,
        reference: i.reference_number || 'Stock Issue',
        inward_qty: 0,
        outward_qty: i.quantity,
        rate: undefined,
        amount: undefined,
        details: i.issued_to_name,
      })),
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate running balance
    allMovements.forEach(m => {
      if (m.type === 'inward') {
        balance += m.inward_qty;
      } else {
        balance -= m.outward_qty;
      }
      entries.push({ ...m, balance });
    });

    return entries;
  };

  const ledgerEntries = getStockLedgerEntries();
  const totalInward = ledgerEntries.reduce((sum, e) => sum + e.inward_qty, 0);
  const totalOutward = ledgerEntries.reduce((sum, e) => sum + e.outward_qty, 0);

  const handleExportStockSummary = () => {
    exportCurrentStockSummary(items);
  };

  const handleExportStockLedger = () => {
    if (selectedItem) {
      const dateRange = { from: new Date(2020, 0, 1), to: new Date() };
      exportStockLedger(selectedItem, ledgerEntries, dateRange);
    }
  };

  const handleExportSupplierHistory = () => {
    if (selectedSupplier) {
      exportSupplierPurchaseHistory(selectedSupplier.name, supplierEntries);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reports</CardTitle>
        <CardDescription>
          Generate and export inventory reports
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={reportType} onValueChange={setReportType}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="stock-summary">Current Stock Summary</TabsTrigger>
            <TabsTrigger value="stock-ledger">Stock Ledger</TabsTrigger>
            <TabsTrigger value="supplier-history">Supplier Purchase History</TabsTrigger>
          </TabsList>

          {/* Stock Summary Report */}
          <TabsContent value="stock-summary" className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Current stock levels for all items with low stock alerts
              </p>
              <Button onClick={handleExportStockSummary}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item Code</TableHead>
                  <TableHead>Item Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Current Stock</TableHead>
                  <TableHead>Reorder Level</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => {
                  const isLowStock = item.current_stock <= item.reorder_level;
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono">{item.item_code}</TableCell>
                      <TableCell className="font-medium">{item.item_name}</TableCell>
                      <TableCell>{item.category || '-'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isLowStock && (
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                          )}
                          <span className={isLowStock ? 'text-destructive font-medium' : ''}>
                            {item.current_stock}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{item.reorder_level}</TableCell>
                      <TableCell>
                        {isLowStock ? (
                          <Badge variant="destructive">Low Stock</Badge>
                        ) : (
                          <Badge variant="outline">OK</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TabsContent>

          {/* Stock Ledger Report */}
          <TabsContent value="stock-ledger" className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="space-y-1">
                  <Label>Select Item</Label>
                  <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                    <SelectTrigger className="w-[300px]">
                      <SelectValue placeholder="Select an item" />
                    </SelectTrigger>
                    <SelectContent>
                      {items.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.item_code} - {item.item_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleExportStockLedger} disabled={!selectedItemId}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>

            {selectedItem ? (
              <>
                <div className="grid grid-cols-4 gap-4 p-4 bg-muted/50 rounded-md">
                  <div>
                    <p className="text-xs text-muted-foreground">Opening</p>
                    <p className="font-bold">0</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Inward</p>
                    <p className="font-bold text-green-600">+{totalInward}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Outward</p>
                    <p className="font-bold text-red-600">-{totalOutward}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Closing Balance</p>
                    <p className="font-bold">{selectedItem.current_stock}</p>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead className="text-right">Inward</TableHead>
                      <TableHead className="text-right">Outward</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ledgerEntries.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground">
                          No transactions found for this item
                        </TableCell>
                      </TableRow>
                    ) : (
                      ledgerEntries.map((entry, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{format(new Date(entry.date), 'dd MMM yyyy')}</TableCell>
                          <TableCell>
                            <Badge variant={entry.type === 'inward' ? 'default' : 'secondary'}>
                              {entry.type.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>{entry.reference}</TableCell>
                          <TableCell className="text-right text-green-600">
                            {entry.inward_qty > 0 ? `+${entry.inward_qty}` : ''}
                          </TableCell>
                          <TableCell className="text-right text-red-600">
                            {entry.outward_qty > 0 ? `-${entry.outward_qty}` : ''}
                          </TableCell>
                          <TableCell className="text-right font-medium">{entry.balance}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {entry.details}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground flex flex-col items-center gap-2">
                <FileText className="h-8 w-8" />
                <p>Select an item to view its stock ledger</p>
              </div>
            )}
          </TabsContent>

          {/* Supplier Purchase History Report */}
          <TabsContent value="supplier-history" className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-1">
                <Label>Select Supplier</Label>
                <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
                  <SelectTrigger className="w-[300px]">
                    <SelectValue placeholder="Select a supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleExportSupplierHistory} disabled={!selectedSupplierId}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>

            {selectedSupplier ? (
              <>
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-md">
                  <div>
                    <p className="text-xs text-muted-foreground">Total Purchases</p>
                    <p className="font-bold">{supplierEntries.length} entries</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Amount</p>
                    <p className="font-bold">
                      ₹{supplierEntries.reduce((sum, e) => sum + (e.amount || 0), 0).toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>

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
                    {supplierEntries.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          No purchases found from this supplier
                        </TableCell>
                      </TableRow>
                    ) : (
                      supplierEntries.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell>{format(new Date(entry.entry_date), 'dd MMM yyyy')}</TableCell>
                          <TableCell>{entry.invoice_number || '-'}</TableCell>
                          <TableCell>
                            <span className="font-medium">{entry.item?.item_name}</span>
                          </TableCell>
                          <TableCell className="text-right">{entry.quantity}</TableCell>
                          <TableCell className="text-right">₹{entry.rate.toLocaleString('en-IN')}</TableCell>
                          <TableCell className="text-right font-medium">
                            ₹{entry.amount.toLocaleString('en-IN')}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground flex flex-col items-center gap-2">
                <FileText className="h-8 w-8" />
                <p>Select a supplier to view purchase history</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
