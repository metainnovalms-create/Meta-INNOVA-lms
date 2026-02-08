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
import { useCreateCompanyItem } from '@/hooks/useCompanyInventory';

interface AddItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const UNITS_OF_MEASURE = ['Nos', 'Kg', 'Ltr', 'Mtr', 'Pcs', 'Box', 'Set', 'Pack'];
const CATEGORIES = ['Electronics', 'Stationery', 'Furniture', 'IT Equipment', 'Consumables', 'Tools', 'Safety', 'Other'];

export function AddItemDialog({ open, onOpenChange }: AddItemDialogProps) {
  const [formData, setFormData] = useState({
    item_code: '',
    item_name: '',
    category: '',
    unit_of_measure: 'Nos',
    gst_percentage: 18,
    reorder_level: 10,
    description: '',
  });

  const createItem = useCreateCompanyItem();

  const handleSubmit = () => {
    createItem.mutate(
      {
        item_code: formData.item_code,
        item_name: formData.item_name,
        category: formData.category || undefined,
        unit_of_measure: formData.unit_of_measure,
        gst_percentage: formData.gst_percentage,
        reorder_level: formData.reorder_level,
        description: formData.description || undefined,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          setFormData({
            item_code: '',
            item_name: '',
            category: '',
            unit_of_measure: 'Nos',
            gst_percentage: 18,
            reorder_level: 10,
            description: '',
          });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Item</DialogTitle>
          <DialogDescription>
            Add a new item to the inventory master list
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="item_code">Item Code *</Label>
              <Input
                id="item_code"
                value={formData.item_code}
                onChange={(e) => setFormData({ ...formData, item_code: e.target.value.toUpperCase() })}
                placeholder="e.g., ITM001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="item_name">Item Name *</Label>
            <Input
              id="item_name"
              value={formData.item_name}
              onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
              placeholder="e.g., Laptop Charger"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unit">Unit of Measure *</Label>
              <Select
                value={formData.unit_of_measure}
                onValueChange={(value) => setFormData({ ...formData, unit_of_measure: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNITS_OF_MEASURE.map((unit) => (
                    <SelectItem key={unit} value={unit}>
                      {unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="gst">GST %</Label>
              <Input
                id="gst"
                type="number"
                min={0}
                max={28}
                value={formData.gst_percentage}
                onChange={(e) => setFormData({ ...formData, gst_percentage: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reorder">Reorder Level</Label>
            <Input
              id="reorder"
              type="number"
              min={0}
              value={formData.reorder_level}
              onChange={(e) => setFormData({ ...formData, reorder_level: Number(e.target.value) })}
              placeholder="Minimum stock before alert"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional item description"
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
            disabled={!formData.item_code || !formData.item_name || createItem.isPending}
          >
            {createItem.isPending ? 'Adding...' : 'Add Item'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
