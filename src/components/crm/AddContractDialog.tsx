import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { CalendarIcon, Upload } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ContractDetail } from "@/data/mockCRMData";

const contractSchema = z.object({
  institution_id: z.string().min(1, "Institution is required"),
  institution_name: z.string().min(1, "Institution name is required"),
  contract_type: z.string().min(1, "Contract type is required"),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().min(1, "End date is required"),
  contract_value: z.string().min(1, "Contract value is required"),
  payment_terms: z.string().min(1, "Payment terms are required"),
  auto_renew: z.boolean(),
  renewal_date: z.string().min(1, "Renewal date is required"),
}).refine((data) => {
  const start = new Date(data.start_date);
  const end = new Date(data.end_date);
  return end > start;
}, {
  message: "End date must be after start date",
  path: ["end_date"],
});

type ContractFormData = z.infer<typeof contractSchema>;

interface AddContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (contract: Omit<ContractDetail, 'id' | 'documents' | 'communication_history'>, files?: File[]) => void;
  institutions: { id: string; name: string }[];
}

export function AddContractDialog({ open, onOpenChange, onSave, institutions }: AddContractDialogProps) {
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [renewalDate, setRenewalDate] = useState<Date>();
  const [autoRenew, setAutoRenew] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ContractFormData>({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      auto_renew: false,
    },
  });

  const selectedInstitution = watch("institution_id");

  const onSubmit = (data: ContractFormData) => {
    const newContract: Omit<ContractDetail, 'id' | 'documents' | 'communication_history'> = {
      institution_id: data.institution_id,
      institution_name: data.institution_name,
      contract_type: data.contract_type,
      start_date: data.start_date,
      end_date: data.end_date,
      renewal_date: data.renewal_date,
      contract_value: parseFloat(data.contract_value),
      payment_terms: data.payment_terms,
      status: 'active',
      auto_renew: data.auto_renew,
      renewal_status: data.auto_renew ? 'auto_renew' : 'manual_renew',
    };

    onSave(newContract, selectedFiles.length > 0 ? selectedFiles : undefined);
    handleClose();
  };

  const handleClose = () => {
    reset();
    setStartDate(undefined);
    setEndDate(undefined);
    setRenewalDate(undefined);
    setAutoRenew(false);
    setSelectedFiles([]);
    onOpenChange(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setSelectedFiles(prev => [...prev, ...Array.from(files)]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Contract</DialogTitle>
          <DialogDescription>
            Add a new contract for an institution with all necessary details.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Institution Selection */}
          <div className="space-y-2">
            <Label htmlFor="institution">Institution *</Label>
            <Select
              onValueChange={(value) => {
                setValue("institution_id", value);
                const institution = institutions.find(i => i.id === value);
                if (institution) {
                  setValue("institution_name", institution.name);
                }
              }}
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
              <p className="text-sm text-destructive">{errors.institution_id.message}</p>
            )}
          </div>

          {/* Contract Type */}
          <div className="space-y-2">
            <Label htmlFor="contract_type">Contract Type *</Label>
            <Select onValueChange={(value) => setValue("contract_type", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select contract type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Enterprise License">Enterprise License</SelectItem>
                <SelectItem value="Standard License">Standard License</SelectItem>
                <SelectItem value="Basic License">Basic License</SelectItem>
                <SelectItem value="Partnership">Partnership</SelectItem>
                <SelectItem value="Trial">Trial</SelectItem>
              </SelectContent>
            </Select>
            {errors.contract_type && (
              <p className="text-sm text-destructive">{errors.contract_type.message}</p>
            )}
          </div>

          {/* Contract Period */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => {
                      setStartDate(date);
                      if (date) {
                        setValue("start_date", format(date, "yyyy-MM-dd"));
                      }
                    }}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              {errors.start_date && (
                <p className="text-sm text-destructive">{errors.start_date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>End Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => {
                      setEndDate(date);
                      if (date) {
                        setValue("end_date", format(date, "yyyy-MM-dd"));
                      }
                    }}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              {errors.end_date && (
                <p className="text-sm text-destructive">{errors.end_date.message}</p>
              )}
            </div>
          </div>

          {/* Financial Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contract_value">Contract Value (₹) *</Label>
              <Input
                id="contract_value"
                type="number"
                placeholder="e.g., 4200000"
                {...register("contract_value")}
              />
              {errors.contract_value && (
                <p className="text-sm text-destructive">{errors.contract_value.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_terms">Payment Terms *</Label>
              <Select onValueChange={(value) => setValue("payment_terms", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment terms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Annual">Annual</SelectItem>
                  <SelectItem value="Quarterly">Quarterly</SelectItem>
                  <SelectItem value="Semi-Annual">Semi-Annual</SelectItem>
                  <SelectItem value="Monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
              {errors.payment_terms && (
                <p className="text-sm text-destructive">{errors.payment_terms.message}</p>
              )}
            </div>
          </div>

          {/* Renewal Settings */}
          <div className="space-y-4 p-4 border rounded-lg">
            <h3 className="font-medium">Renewal Settings</h3>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="auto_renew"
                checked={autoRenew}
                onCheckedChange={(checked) => {
                  setAutoRenew(checked);
                  setValue("auto_renew", checked);
                }}
              />
              <Label htmlFor="auto_renew">Enable Auto-Renewal</Label>
            </div>

            <div className="space-y-2">
              <Label>Renewal Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !renewalDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {renewalDate ? format(renewalDate, "PPP") : "Pick renewal date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={renewalDate}
                    onSelect={(date) => {
                      setRenewalDate(date);
                      if (date) {
                        setValue("renewal_date", format(date, "yyyy-MM-dd"));
                      }
                    }}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              {errors.renewal_date && (
                <p className="text-sm text-destructive">{errors.renewal_date.message}</p>
              )}
            </div>
          </div>

          {/* Documents Upload */}
          <div className="space-y-2">
            <Label htmlFor="documents">Contract Documents (Optional)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="documents"
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('documents')?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Files
              </Button>
              {selectedFiles.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  {selectedFiles.length} file(s) selected
                </span>
              )}
            </div>
            {selectedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded flex items-center gap-2"
                  >
                    {file.name}
                    <button
                      type="button"
                      onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== index))}
                      className="hover:text-destructive"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit">Create Contract</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
