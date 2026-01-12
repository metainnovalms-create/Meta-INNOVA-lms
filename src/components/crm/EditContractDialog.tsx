import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ContractDetail } from "@/data/mockCRMData";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";

const contractSchema = z.object({
  institution_id: z.string().min(1, "Institution is required"),
  contract_type: z.string().min(1, "Contract type is required"),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().min(1, "End date is required"),
  renewal_date: z.string().min(1, "Renewal date is required"),
  contract_value: z.number().positive("Contract value must be positive"),
  payment_terms: z.string().min(1, "Payment terms are required"),
  status: z.enum(['active', 'expiring_soon', 'expired', 'under_negotiation']),
  auto_renew: z.boolean(),
  renewal_status: z.enum(['auto_renew', 'manual_renew', 'needs_discussion']),
}).refine(data => new Date(data.end_date) > new Date(data.start_date), {
  message: "End date must be after start date",
  path: ["end_date"],
});

type ContractFormData = z.infer<typeof contractSchema>;

interface EditContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract: ContractDetail | null;
  onSave: (data: ContractDetail) => void;
  institutions: { id: string; name: string }[];
}

export function EditContractDialog({ 
  open, 
  onOpenChange, 
  contract, 
  onSave,
  institutions 
}: EditContractDialogProps) {
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<ContractFormData>({
    resolver: zodResolver(contractSchema),
    defaultValues: contract ? {
      institution_id: contract.institution_id,
      contract_type: contract.contract_type,
      start_date: format(new Date(contract.start_date), 'yyyy-MM-dd'),
      end_date: format(new Date(contract.end_date), 'yyyy-MM-dd'),
      renewal_date: format(new Date(contract.renewal_date), 'yyyy-MM-dd'),
      contract_value: contract.contract_value,
      payment_terms: contract.payment_terms,
      status: contract.status,
      auto_renew: contract.auto_renew,
      renewal_status: contract.renewal_status,
    } : undefined
  });

  const onSubmit = (data: ContractFormData) => {
    if (!contract) return;
    
    const selectedInstitution = institutions.find(i => i.id === data.institution_id);
    
    const updatedContract: ContractDetail = {
      ...contract,
      institution_id: data.institution_id,
      institution_name: selectedInstitution?.name || contract.institution_name,
      contract_type: data.contract_type,
      start_date: data.start_date,
      end_date: data.end_date,
      renewal_date: data.renewal_date,
      contract_value: data.contract_value,
      payment_terms: data.payment_terms,
      status: data.status,
      auto_renew: data.auto_renew,
      renewal_status: data.renewal_status,
    };
    
    onSave(updatedContract);
  };

  if (!contract) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Contract</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="institution_id">Institution *</Label>
              <Select
                value={watch('institution_id')}
                onValueChange={(value) => setValue('institution_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select institution" />
                </SelectTrigger>
                <SelectContent>
                  {institutions.map((inst) => (
                    <SelectItem key={inst.id} value={inst.id}>
                      {inst.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.institution_id && (
                <p className="text-sm text-red-500">{errors.institution_id.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contract_type">Contract Type *</Label>
              <Input {...register('contract_type')} placeholder="e.g., Enterprise License" />
              {errors.contract_type && <p className="text-sm text-red-500">{errors.contract_type.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date *</Label>
              <Input type="date" {...register('start_date')} />
              {errors.start_date && <p className="text-sm text-red-500">{errors.start_date.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">End Date *</Label>
              <Input type="date" {...register('end_date')} />
              {errors.end_date && <p className="text-sm text-red-500">{errors.end_date.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="renewal_date">Renewal Date *</Label>
              <Input type="date" {...register('renewal_date')} />
              {errors.renewal_date && <p className="text-sm text-red-500">{errors.renewal_date.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contract_value">Contract Value (₹) *</Label>
              <Input 
                type="number" 
                {...register('contract_value', { valueAsNumber: true })} 
                placeholder="e.g., 4200000"
              />
              {errors.contract_value && <p className="text-sm text-red-500">{errors.contract_value.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_terms">Payment Terms *</Label>
              <Select
                value={watch('payment_terms')}
                onValueChange={(value) => setValue('payment_terms', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Quarterly">Quarterly</SelectItem>
                  <SelectItem value="Semi-Annual">Semi-Annual</SelectItem>
                  <SelectItem value="Annual">Annual</SelectItem>
                  <SelectItem value="Monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
              {errors.payment_terms && <p className="text-sm text-red-500">{errors.payment_terms.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={watch('status')}
                onValueChange={(value: any) => setValue('status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expiring_soon">Expiring Soon</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="under_negotiation">Under Negotiation</SelectItem>
                </SelectContent>
              </Select>
              {errors.status && <p className="text-sm text-red-500">{errors.status.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="renewal_status">Renewal Status *</Label>
              <Select
                value={watch('renewal_status')}
                onValueChange={(value: any) => setValue('renewal_status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto_renew">Auto Renew</SelectItem>
                  <SelectItem value="manual_renew">Manual Renew</SelectItem>
                  <SelectItem value="needs_discussion">Needs Discussion</SelectItem>
                </SelectContent>
              </Select>
              {errors.renewal_status && <p className="text-sm text-red-500">{errors.renewal_status.message}</p>}
            </div>

            <div className="flex items-center space-x-2 pt-6">
              <Switch
                checked={watch('auto_renew')}
                onCheckedChange={(checked) => setValue('auto_renew', checked)}
              />
              <Label htmlFor="auto_renew">Auto-Renew Contract</Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
