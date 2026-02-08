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
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { useCompanyItems, useCreateCompanyStockIssue } from '@/hooks/useCompanyInventory';
import { useAuth } from '@/contexts/AuthContext';

interface StockIssueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ISSUE_TYPES = [
  { value: 'department', label: 'Department' },
  { value: 'project', label: 'Project' },
  { value: 'institution', label: 'Institution' },
  { value: 'branch', label: 'Branch' },
  { value: 'other', label: 'Other' },
] as const;

export function StockIssueDialog({ open, onOpenChange }: StockIssueDialogProps) {
  const { user } = useAuth();
  const isCEO = user?.is_ceo;

  const [formData, setFormData] = useState({
    issue_date: format(new Date(), 'yyyy-MM-dd'),
    item_id: '',
    quantity: 1,
    issued_to_type: 'department' as 'department' | 'project' | 'institution' | 'branch' | 'other',
    issued_to_name: '',
    purpose: '',
    reference_number: '',
    notes: '',
    admin_override: false,
  });

  const { data: items = [] } = useCompanyItems();
  const createIssue = useCreateCompanyStockIssue();

  const activeItems = items.filter(i => i.status === 'active');
  const selectedItem = items.find(i => i.id === formData.item_id);
  const insufficientStock = selectedItem && formData.quantity > selectedItem.current_stock;

  const handleSubmit = () => {
    createIssue.mutate(
      {
        issue_date: formData.issue_date,
        item_id: formData.item_id,
        quantity: formData.quantity,
        issued_to_type: formData.issued_to_type,
        issued_to_name: formData.issued_to_name,
        purpose: formData.purpose || undefined,
        reference_number: formData.reference_number || undefined,
        notes: formData.notes || undefined,
        admin_override: formData.admin_override,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          setFormData({
            issue_date: format(new Date(), 'yyyy-MM-dd'),
            item_id: '',
            quantity: 1,
            issued_to_type: 'department',
            issued_to_name: '',
            purpose: '',
            reference_number: '',
            notes: '',
            admin_override: false,
          });
        },
      }
    );
  };

  const canSubmit = formData.item_id && 
    formData.quantity > 0 && 
    formData.issued_to_name &&
    (!insufficientStock || formData.admin_override);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Record Stock Issue (Outward)</DialogTitle>
          <DialogDescription>
            Issue stock to departments, projects, or institutions
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="issue_date">Issue Date *</Label>
              <Input
                id="issue_date"
                type="date"
                value={formData.issue_date}
                onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="issued_to_type">Issue To Type *</Label>
              <Select
                value={formData.issued_to_type}
                onValueChange={(value: typeof formData.issued_to_type) => 
                  setFormData({ ...formData, issued_to_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ISSUE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
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
                    {item.item_code} - {item.item_name} (Stock: {item.current_stock})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedItem && (
              <p className="text-xs text-muted-foreground">
                Available stock: {selectedItem.current_stock} {selectedItem.unit_of_measure}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="issued_to_name">Issued To Name *</Label>
            <Input
              id="issued_to_name"
              value={formData.issued_to_name}
              onChange={(e) => setFormData({ ...formData, issued_to_name: e.target.value })}
              placeholder="e.g., IT Department, Project Alpha"
            />
          </div>

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

          {insufficientStock && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Insufficient stock! Available: {selectedItem?.current_stock}, Requested: {formData.quantity}
                {isCEO && (
                  <div className="mt-2 flex items-center space-x-2">
                    <Checkbox
                      id="admin_override"
                      checked={formData.admin_override}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, admin_override: checked === true })
                      }
                    />
                    <Label htmlFor="admin_override" className="text-xs font-normal cursor-pointer">
                      CEO Override: Allow negative stock
                    </Label>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="purpose">Purpose</Label>
              <Input
                id="purpose"
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                placeholder="e.g., Training setup"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reference_number">Reference No</Label>
              <Input
                id="reference_number"
                value={formData.reference_number}
                onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                placeholder="e.g., REQ-2024-001"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="issue_notes">Notes</Label>
            <Textarea
              id="issue_notes"
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
            disabled={!canSubmit || createIssue.isPending}
          >
            {createIssue.isPending ? 'Recording...' : 'Record Issue'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
