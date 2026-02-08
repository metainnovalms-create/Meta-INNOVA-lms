import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { useCompanyItems, useCompanySuppliers, useCreateCompanyStockEntry } from '@/hooks/useCompanyInventory';

interface StockEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StockEntryDialog({ open, onOpenChange }: StockEntryDialogProps) {
  const [formData, setFormData] = useState({
    entry_date: format(new Date(), 'yyyy-MM-dd'),
    item_id: '',
    supplier_id: '',
    invoice_number: '',
    invoice_date: '',
    quantity: 1,
    rate: 0,
    batch_serial: '',
    location_store: '',
    notes: '',
  });

  const { data: items = [] } = useCompanyItems();
  const { data: suppliers = [] } = useCompanySuppliers();
  const createEntry = useCreateCompanyStockEntry();

  const activeItems = items.filter(i => i.status === 'active');
  const activeSuppliers = suppliers.filter(s => s.status === 'active');

  const handleSubmit = () => {
    createEntry.mutate(
      {
        entry_date: formData.entry_date,
        item_id: formData.item_id,
        supplier_id: formData.supplier_id || undefined,
        invoice_number: formData.invoice_number || undefined,
        invoice_date: formData.invoice_date || undefined,
        quantity: formData.quantity,
        rate: formData.rate,
        batch_serial: formData.batch_serial || undefined,
        location_store: formData.location_store || undefined,
        notes: formData.notes || undefined,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          setFormData({
            entry_date: format(new Date(), 'yyyy-MM-dd'),
            item_id: '',
            supplier_id: '',
            invoice_number: '',
            invoice_date: '',
            quantity: 1,
            rate: 0,
            batch_serial: '',
            location_store: '',
            notes: '',
          });
        },
      }
    );
  };

  const selectedItem = items.find(i => i.id === formData.item_id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Record Stock Entry (Inward)</DialogTitle>
          <DialogDescription>
            Add incoming stock to inventory
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="entry_date">Entry Date *</Label>
              <Input
                id="entry_date"
                type="date"
                value={formData.entry_date}
                onChange={(e) => setFormData({ ...formData, entry_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier">Supplier</Label>
              <Select
                value={formData.supplier_id}
                onValueChange={(value) => setFormData({ ...formData, supplier_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {activeSuppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="item">Item *</Label>
            <Select
              value={formData.item_id}
              onValueChange={(value) => setFormData({ ...formData, item_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select item" />
              </SelectTrigger>
              <SelectContent>
                {activeItems.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.item_code} - {item.item_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedItem && (
              <p className="text-xs text-muted-foreground">
                Current stock: {selectedItem.current_stock} {selectedItem.unit_of_measure}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="invoice_number">Invoice Number</Label>
              <Input
                id="invoice_number"
                value={formData.invoice_number}
                onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                placeholder="e.g., INV-2024-001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invoice_date">Invoice Date</Label>
              <Input
                id="invoice_date"
                type="date"
                value={formData.invoice_date}
                onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                min={1}
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rate">Rate (₹) *</Label>
              <Input
                id="rate"
                type="number"
                min={0}
                step={0.01}
                value={formData.rate}
                onChange={(e) => setFormData({ ...formData, rate: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="p-3 bg-muted/50 rounded-md">
            <div className="flex justify-between">
              <span className="text-sm">Total Amount:</span>
              <span className="font-bold">
                ₹{(formData.quantity * formData.rate).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="batch_serial">Batch/Serial No</Label>
              <Input
                id="batch_serial"
                value={formData.batch_serial}
                onChange={(e) => setFormData({ ...formData, batch_serial: e.target.value })}
                placeholder="Optional"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location_store">Location/Store</Label>
              <Input
                id="location_store"
                value={formData.location_store}
                onChange={(e) => setFormData({ ...formData, location_store: e.target.value })}
                placeholder="e.g., Warehouse A"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Optional notes"
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!formData.item_id || formData.quantity < 1 || createEntry.isPending}
          >
            {createEntry.isPending ? 'Recording...' : 'Record Entry'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
