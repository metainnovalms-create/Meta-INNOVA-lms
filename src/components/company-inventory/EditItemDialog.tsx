import { useState, useEffect } from 'react';
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
import { useUpdateCompanyItem } from '@/hooks/useCompanyInventory';
import { CompanyItem } from '@/types/companyInventory';

interface EditItemDialogProps {
  item: CompanyItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const UNITS_OF_MEASURE = ['Nos', 'Kg', 'Ltr', 'Mtr', 'Pcs', 'Box', 'Set', 'Pack'];
const CATEGORIES = ['Electronics', 'Stationery', 'Furniture', 'IT Equipment', 'Consumables', 'Tools', 'Safety', 'Other'];

export function EditItemDialog({ item, open, onOpenChange }: EditItemDialogProps) {
  const [formData, setFormData] = useState({
    item_code: '',
    item_name: '',
    category: '',
    unit_of_measure: 'Nos',
    gst_percentage: 18,
    reorder_level: 10,
    description: '',
  });

  const updateItem = useUpdateCompanyItem();

  useEffect(() => {
    if (item) {
      setFormData({
        item_code: item.item_code,
        item_name: item.item_name,
        category: item.category || '',
        unit_of_measure: item.unit_of_measure,
        gst_percentage: item.gst_percentage,
        reorder_level: item.reorder_level,
        description: item.description || '',
      });
    }
  }, [item]);

  const handleSubmit = () => {
    if (!item) return;
    
    updateItem.mutate(
      {
        id: item.id,
        data: {
          item_code: formData.item_code,
          item_name: formData.item_name,
          category: formData.category || undefined,
          unit_of_measure: formData.unit_of_measure,
          gst_percentage: formData.gst_percentage,
          reorder_level: formData.reorder_level,
          description: formData.description || undefined,
        },
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Item</DialogTitle>
          <DialogDescription>
            Update item details. Current stock: {item.current_stock} {item.unit_of_measure}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit_item_code">Item Code *</Label>
              <Input
                id="edit_item_code"
                value={formData.item_code}
                onChange={(e) => setFormData({ ...formData, item_code: e.target.value.toUpperCase() })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_category">Category</Label>
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
            <Label htmlFor="edit_item_name">Item Name *</Label>
            <Input
              id="edit_item_name"
              value={formData.item_name}
              onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit_unit">Unit of Measure *</Label>
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
              <Label htmlFor="edit_gst">GST %</Label>
              <Input
                id="edit_gst"
                type="number"
                min={0}
                max={28}
                value={formData.gst_percentage}
                onChange={(e) => setFormData({ ...formData, gst_percentage: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit_reorder">Reorder Level</Label>
            <Input
              id="edit_reorder"
              type="number"
              min={0}
              value={formData.reorder_level}
              onChange={(e) => setFormData({ ...formData, reorder_level: Number(e.target.value) })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit_description">Description</Label>
            <Textarea
              id="edit_description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
            disabled={!formData.item_code || !formData.item_name || updateItem.isPending}
          >
            {updateItem.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
