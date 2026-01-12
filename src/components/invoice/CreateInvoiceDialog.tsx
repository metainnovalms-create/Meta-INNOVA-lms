import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { InvoiceLineItemsEditor } from './InvoiceLineItemsEditor';
import { createInvoice, fetchDefaultCompanyProfile, calculateInvoiceTotals, calculateLineItemTaxes, checkInvoiceNumberExists, GSTRates } from '@/services/invoice.service';
import type { InvoiceType, InvoiceLineItem, CompanyProfile, CreateInvoiceInput } from '@/types/invoice';
import { toast } from 'sonner';
import { Check, AlertCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface CreateInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceType: InvoiceType;
  onSuccess: () => void;
  institutions?: { id: string; name: string }[];
}

const indianStates = [
  { code: '33', name: 'Tamil Nadu' },
  { code: '29', name: 'Karnataka' },
  { code: '27', name: 'Maharashtra' },
  { code: '36', name: 'Telangana' },
  { code: '32', name: 'Kerala' },
  { code: '07', name: 'Delhi' },
  { code: '06', name: 'Haryana' },
  { code: '09', name: 'Uttar Pradesh' },
  { code: '24', name: 'Gujarat' },
  { code: '19', name: 'West Bengal' },
];

export function CreateInvoiceDialog({
  open,
  onOpenChange,
  invoiceType,
  onSuccess,
  institutions = [],
}: CreateInvoiceDialogProps) {
  const [loading, setLoading] = useState(false);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [gstRates, setGstRates] = useState<GSTRates>({ cgst_rate: 9, sgst_rate: 9, igst_rate: 18 });
  
  // Invoice number state
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceNumberError, setInvoiceNumberError] = useState('');
  const [isCheckingNumber, setIsCheckingNumber] = useState(false);
  const [invoiceNumberValid, setInvoiceNumberValid] = useState(false);
  
  // Form state
  const [toCompanyName, setToCompanyName] = useState('');
  const [toCompanyAddress, setToCompanyAddress] = useState('');
  const [toCompanyCity, setToCompanyCity] = useState('');
  const [toCompanyState, setToCompanyState] = useState('');
  const [toCompanyStateCode, setToCompanyStateCode] = useState('');
  const [toCompanyPincode, setToCompanyPincode] = useState('');
  const [toCompanyGstin, setToCompanyGstin] = useState('');
  const [toCompanyContactPerson, setToCompanyContactPerson] = useState('');
  const [toCompanyPhone, setToCompanyPhone] = useState('');
  
  const [invoiceDate, setInvoiceDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dueDate, setDueDate] = useState('');
  const [terms, setTerms] = useState('Custom');
  const [placeOfSupply, setPlaceOfSupply] = useState('Tamil Nadu (33)');
  const [notes, setNotes] = useState('Thank you for partnering with Metasage Alliance Consulting Expert LLP.');
  
  const [selectedInstitutionId, setSelectedInstitutionId] = useState('');
  
  const [lineItems, setLineItems] = useState<Omit<InvoiceLineItem, 'id' | 'invoice_id'>[]>([
    { description: '', hsn_sac_code: '998311', quantity: 1, unit: 'Nos', rate: 0, amount: 0 },
  ]);

  useEffect(() => {
    if (open) {
      loadCompanyProfile();
    }
  }, [open]);

  const loadCompanyProfile = async () => {
    try {
      const profile = await fetchDefaultCompanyProfile();
      setCompanyProfile(profile);
      if (profile) {
        setGstRates({
          cgst_rate: profile.default_cgst_rate ?? 9,
          sgst_rate: profile.default_sgst_rate ?? 9,
          igst_rate: profile.default_igst_rate ?? 18,
        });
      }
    } catch (error) {
      console.error('Error loading company profile:', error);
    }
  };

  const handleStateChange = (stateCode: string) => {
    const state = indianStates.find((s) => s.code === stateCode);
    if (state) {
      setToCompanyState(state.name);
      setToCompanyStateCode(state.code);
      setPlaceOfSupply(`${state.name} (${state.code})`);
    }
  };

  const isInterState = companyProfile?.state_code !== toCompanyStateCode;

  // Calculate totals with configurable GST rates
  const calculatedItems = lineItems.map((item) => calculateLineItemTaxes(item, isInterState, gstRates));
  const totals = calculateInvoiceTotals(calculatedItems, isInterState, 0, gstRates);

  const handleValidateInvoiceNumber = async () => {
    if (!invoiceNumber.trim()) {
      setInvoiceNumberError('Invoice number is required');
      setInvoiceNumberValid(false);
      return;
    }
    
    try {
      setIsCheckingNumber(true);
      setInvoiceNumberError('');
      const exists = await checkInvoiceNumberExists(invoiceNumber.trim());
      if (exists) {
        setInvoiceNumberError('This invoice number is already in use');
        setInvoiceNumberValid(false);
      } else {
        setInvoiceNumberValid(true);
      }
    } catch (error) {
      console.error('Error checking invoice number:', error);
      setInvoiceNumberError('Error validating invoice number');
      setInvoiceNumberValid(false);
    } finally {
      setIsCheckingNumber(false);
    }
  };

  const handleSubmit = async () => {
    if (!invoiceNumber.trim()) {
      toast.error('Please enter invoice number');
      return;
    }
    if (invoiceNumberError) {
      toast.error('Please fix the invoice number error');
      return;
    }
    if (!toCompanyName) {
      toast.error('Please enter customer name');
      return;
    }
    if (lineItems.some((item) => !item.description || item.rate <= 0)) {
      toast.error('Please fill in all line items with valid amounts');
      return;
    }

    // Final check for duplicate before creating
    const exists = await checkInvoiceNumberExists(invoiceNumber.trim());
    if (exists) {
      setInvoiceNumberError('This invoice number is already in use');
      toast.error('Invoice number is already in use');
      return;
    }

    try {
      setLoading(true);
      
      const input: CreateInvoiceInput = {
        invoice_number: invoiceNumber.trim(),
        invoice_type: invoiceType,
        from_company_name: companyProfile?.company_name || 'Metasage Alliance Consulting Expert LLP',
        from_company_address: companyProfile?.address,
        from_company_city: companyProfile?.city,
        from_company_state: companyProfile?.state,
        from_company_state_code: companyProfile?.state_code,
        from_company_pincode: companyProfile?.pincode,
        from_company_gstin: companyProfile?.gstin,
        from_company_phone: companyProfile?.phone,
        from_company_email: companyProfile?.email,
        from_company_website: companyProfile?.website,
        to_company_name: toCompanyName,
        to_company_address: toCompanyAddress,
        to_company_city: toCompanyCity,
        to_company_state: toCompanyState,
        to_company_state_code: toCompanyStateCode,
        to_company_pincode: toCompanyPincode,
        to_company_gstin: toCompanyGstin,
        to_company_contact_person: toCompanyContactPerson,
        to_company_phone: toCompanyPhone,
        invoice_date: invoiceDate,
        due_date: dueDate || undefined,
        terms,
        place_of_supply: placeOfSupply,
        notes,
        terms_and_conditions: companyProfile?.terms_and_conditions,
        bank_details: companyProfile?.bank_details,
        institution_id: selectedInstitutionId || undefined,
        line_items: lineItems,
      };

      await createInvoice(input);
      toast.success('Invoice created successfully');
      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast.error('Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setInvoiceNumber('');
    setInvoiceNumberError('');
    setInvoiceNumberValid(false);
    setToCompanyName('');
    setToCompanyAddress('');
    setToCompanyCity('');
    setToCompanyState('');
    setToCompanyStateCode('');
    setToCompanyPincode('');
    setToCompanyGstin('');
    setToCompanyContactPerson('');
    setToCompanyPhone('');
    setInvoiceDate(format(new Date(), 'yyyy-MM-dd'));
    setDueDate('');
    setTerms('Custom');
    setSelectedInstitutionId('');
    setLineItems([{ description: '', hsn_sac_code: '998311', quantity: 1, unit: 'Nos', rate: 0, amount: 0 }]);
  };

  const getTitle = () => {
    switch (invoiceType) {
      case 'institution':
        return 'Create Institution Invoice';
      case 'sales':
        return 'Create Sales Invoice';
      case 'purchase':
        return 'Create Purchase Invoice';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
          <div className="space-y-6 py-4">
            {/* Bill From (Read-only) */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Bill From</h3>
              <div className="text-sm space-y-1">
                <p className="font-medium">{companyProfile?.company_name || 'Loading...'}</p>
                <p className="text-muted-foreground">{companyProfile?.address}</p>
                <p className="text-muted-foreground">{companyProfile?.city}, {companyProfile?.state} {companyProfile?.pincode}</p>
                <p className="text-muted-foreground">GSTIN: {companyProfile?.gstin}</p>
              </div>
            </div>

            {/* Institution Selection (for institution type) */}
            {invoiceType === 'institution' && institutions.length > 0 && (
              <div className="space-y-2">
                <Label>Select Institution</Label>
                <Select value={selectedInstitutionId} onValueChange={setSelectedInstitutionId}>
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
              </div>
            )}

            {/* Bill To */}
            <div className="space-y-4">
              <h3 className="font-semibold">Bill To</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label>Company Name *</Label>
                  <Input
                    value={toCompanyName}
                    onChange={(e) => setToCompanyName(e.target.value)}
                    placeholder="Customer company name"
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Address</Label>
                  <Textarea
                    value={toCompanyAddress}
                    onChange={(e) => setToCompanyAddress(e.target.value)}
                    placeholder="Street address"
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input
                    value={toCompanyCity}
                    onChange={(e) => setToCompanyCity(e.target.value)}
                    placeholder="City"
                  />
                </div>
                <div className="space-y-2">
                  <Label>State</Label>
                  <Select value={toCompanyStateCode} onValueChange={handleStateChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {indianStates.map((state) => (
                        <SelectItem key={state.code} value={state.code}>
                          {state.name} ({state.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Pincode</Label>
                  <Input
                    value={toCompanyPincode}
                    onChange={(e) => setToCompanyPincode(e.target.value)}
                    placeholder="Pincode"
                  />
                </div>
                <div className="space-y-2">
                  <Label>GSTIN</Label>
                  <Input
                    value={toCompanyGstin}
                    onChange={(e) => setToCompanyGstin(e.target.value)}
                    placeholder="GSTIN"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contact Person</Label>
                  <Input
                    value={toCompanyContactPerson}
                    onChange={(e) => setToCompanyContactPerson(e.target.value)}
                    placeholder="Contact person name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={toCompanyPhone}
                    onChange={(e) => setToCompanyPhone(e.target.value)}
                    placeholder="Phone number"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Invoice Details */}
            <div className="space-y-4">
              <h3 className="font-semibold">Invoice Details</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-3 space-y-2">
                  <Label htmlFor="invoiceNumber">Invoice Number *</Label>
                  <div className="relative">
                    <Input
                      id="invoiceNumber"
                      value={invoiceNumber}
                      onChange={(e) => {
                        setInvoiceNumber(e.target.value);
                        setInvoiceNumberError('');
                        setInvoiceNumberValid(false);
                      }}
                      onBlur={handleValidateInvoiceNumber}
                      placeholder="e.g., MSA/MSD/004"
                      className={invoiceNumberError ? 'border-destructive pr-10' : invoiceNumberValid ? 'border-green-500 pr-10' : 'pr-10'}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {isCheckingNumber && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                      {!isCheckingNumber && invoiceNumberValid && <Check className="h-4 w-4 text-green-500" />}
                      {!isCheckingNumber && invoiceNumberError && <AlertCircle className="h-4 w-4 text-destructive" />}
                    </div>
                  </div>
                  {invoiceNumberError && (
                    <p className="text-sm text-destructive">{invoiceNumberError}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Invoice Date *</Label>
                  <Input
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Terms</Label>
                  <Input
                    value={terms}
                    onChange={(e) => setTerms(e.target.value)}
                    placeholder="e.g., Net 30"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Line Items */}
            <div className="space-y-4">
              <h3 className="font-semibold">Line Items</h3>
              <InvoiceLineItemsEditor
                items={lineItems}
                onChange={setLineItems}
                showTaxColumns={invoiceType === 'sales'}
              />
            </div>

            <Separator />

            {/* Totals - Always show all three taxes */}
            <div className="flex justify-end">
              <div className="w-80 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sub Total:</span>
                  <span>₹{totals.sub_total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">CGST ({gstRates.cgst_rate}%):</span>
                  <span>₹{totals.cgst_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">SGST ({gstRates.sgst_rate}%):</span>
                  <span>₹{totals.sgst_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">IGST ({gstRates.igst_rate}%):</span>
                  <span>₹{totals.igst_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold text-base">
                  <span>Total:</span>
                  <span>₹{totals.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes..."
                rows={2}
              />
            </div>
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Creating...' : 'Create Invoice'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
