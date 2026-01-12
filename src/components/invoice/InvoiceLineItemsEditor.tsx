import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Plus } from 'lucide-react';
import type { InvoiceLineItem } from '@/types/invoice';

interface InvoiceLineItemsEditorProps {
  items: Omit<InvoiceLineItem, 'id' | 'invoice_id'>[];
  onChange: (items: Omit<InvoiceLineItem, 'id' | 'invoice_id'>[]) => void;
  showTaxColumns?: boolean;
}

const defaultItem: Omit<InvoiceLineItem, 'id' | 'invoice_id'> = {
  description: '',
  hsn_sac_code: '',
  quantity: 1,
  unit: 'Nos',
  rate: 0,
  discount_percent: 0,
  cgst_rate: 9,
  sgst_rate: 9,
  amount: 0,
};

export function InvoiceLineItemsEditor({ items, onChange, showTaxColumns = false }: InvoiceLineItemsEditorProps) {
  const addItem = () => {
    onChange([...items, { ...defaultItem }]);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: string | number) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    
    // Recalculate amount
    const qty = Number(updated[index].quantity) || 0;
    const rate = Number(updated[index].rate) || 0;
    const discountPercent = Number(updated[index].discount_percent) || 0;
    const baseAmount = qty * rate;
    const discount = (baseAmount * discountPercent) / 100;
    updated[index].amount = baseAmount - discount;
    
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3 font-medium">#</th>
              <th className="text-left p-3 font-medium">Description</th>
              <th className="text-left p-3 font-medium w-24">HSN/SAC</th>
              <th className="text-right p-3 font-medium w-20">Qty</th>
              <th className="text-left p-3 font-medium w-16">Unit</th>
              <th className="text-right p-3 font-medium w-28">Rate (₹)</th>
              {showTaxColumns && (
                <>
                  <th className="text-right p-3 font-medium w-20">CGST %</th>
                  <th className="text-right p-3 font-medium w-20">SGST %</th>
                </>
              )}
              <th className="text-right p-3 font-medium w-28">Amount (₹)</th>
              <th className="p-3 w-12"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index} className="border-t">
                <td className="p-3 text-muted-foreground">{index + 1}</td>
                <td className="p-2">
                  <Input
                    value={item.description}
                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                    placeholder="Item description"
                    className="border-0 bg-transparent focus-visible:ring-1"
                  />
                </td>
                <td className="p-2">
                  <Input
                    value={item.hsn_sac_code || ''}
                    onChange={(e) => updateItem(index, 'hsn_sac_code', e.target.value)}
                    placeholder="998311"
                    className="border-0 bg-transparent focus-visible:ring-1"
                  />
                </td>
                <td className="p-2">
                  <Input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                    className="border-0 bg-transparent focus-visible:ring-1 text-right"
                    min={0}
                    step={0.01}
                  />
                </td>
                <td className="p-2">
                  <Input
                    value={item.unit || 'Nos'}
                    onChange={(e) => updateItem(index, 'unit', e.target.value)}
                    className="border-0 bg-transparent focus-visible:ring-1"
                  />
                </td>
                <td className="p-2">
                  <Input
                    type="number"
                    value={item.rate}
                    onChange={(e) => updateItem(index, 'rate', parseFloat(e.target.value) || 0)}
                    className="border-0 bg-transparent focus-visible:ring-1 text-right"
                    min={0}
                    step={0.01}
                  />
                </td>
                {showTaxColumns && (
                  <>
                    <td className="p-2">
                      <Input
                        type="number"
                        value={item.cgst_rate || 9}
                        onChange={(e) => updateItem(index, 'cgst_rate', parseFloat(e.target.value) || 0)}
                        className="border-0 bg-transparent focus-visible:ring-1 text-right"
                        min={0}
                        max={100}
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        type="number"
                        value={item.sgst_rate || 9}
                        onChange={(e) => updateItem(index, 'sgst_rate', parseFloat(e.target.value) || 0)}
                        className="border-0 bg-transparent focus-visible:ring-1 text-right"
                        min={0}
                        max={100}
                      />
                    </td>
                  </>
                )}
                <td className="p-3 text-right font-medium">
                  {item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
                <td className="p-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(index)}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    disabled={items.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <Button type="button" variant="outline" size="sm" onClick={addItem}>
        <Plus className="h-4 w-4 mr-2" />
        Add Line Item
      </Button>
    </div>
  );
}
