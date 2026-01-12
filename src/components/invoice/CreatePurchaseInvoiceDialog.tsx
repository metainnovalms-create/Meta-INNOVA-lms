import { useState, useEffect, useRef } from 'react';
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
import { Upload, X, FileText, Image as ImageIcon, Loader2, Check, AlertCircle } from 'lucide-react';
import { createPurchaseInvoice, fetchDefaultCompanyProfile, checkInvoiceNumberExists } from '@/services/invoice.service';
import type { CompanyProfile } from '@/types/invoice';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

interface CreatePurchaseInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreatePurchaseInvoiceDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreatePurchaseInvoiceDialogProps) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Invoice number state
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceNumberError, setInvoiceNumberError] = useState('');
  const [isCheckingNumber, setIsCheckingNumber] = useState(false);
  const [invoiceNumberValid, setInvoiceNumberValid] = useState(false);
  
  // Form state - Vendor Details (Bill From)
  const [vendorName, setVendorName] = useState('');
  const [vendorAddress, setVendorAddress] = useState('');
  const [vendorGstin, setVendorGstin] = useState('');
  const [vendorPhone, setVendorPhone] = useState('');
  
  // Bill Details
  const [vendorInvoiceNumber, setVendorInvoiceNumber] = useState('');
  const [billDate, setBillDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dueDate, setDueDate] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  
  // Attachment
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  
  // Notes
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (open) {
      loadCompanyProfile();
    }
  }, [open]);

  const loadCompanyProfile = async () => {
    try {
      const profile = await fetchDefaultCompanyProfile();
      setCompanyProfile(profile);
    } catch (error) {
      console.error('Error loading company profile:', error);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a PDF, JPG, PNG, or WEBP file');
      return;
    }
    
    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }
    
    setAttachmentFile(file);
    
    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setAttachmentPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setAttachmentPreview(null);
    }
  };

  const removeAttachment = () => {
    setAttachmentFile(null);
    setAttachmentPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadAttachment = async (): Promise<{ url: string; name: string; type: string } | null> => {
    if (!attachmentFile) return null;
    
    const fileExt = attachmentFile.name.split('.').pop();
    const filePath = `purchase-bills/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('invoice-assets')
      .upload(filePath, attachmentFile);
    
    if (uploadError) throw uploadError;
    
    const { data: { publicUrl } } = supabase.storage
      .from('invoice-assets')
      .getPublicUrl(filePath);
    
    return {
      url: publicUrl,
      name: attachmentFile.name,
      type: attachmentFile.type,
    };
  };

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
    if (!vendorName) {
      toast.error('Please enter vendor name');
      return;
    }
    if (!totalAmount || parseFloat(totalAmount) <= 0) {
      toast.error('Please enter a valid total amount');
      return;
    }
    if (!attachmentFile) {
      toast.error('Please attach the vendor bill');
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
      
      // Upload attachment FIRST
      setUploading(true);
      const attachment = await uploadAttachment();
      
      if (!attachment) {
        toast.error('Failed to upload attachment');
        return;
      }
      
      // Create invoice with attachment details included
      const invoice = await createPurchaseInvoice({
        invoice_number: invoiceNumber.trim(),
        invoice_type: 'purchase',
        from_company_name: vendorName,
        from_company_address: vendorAddress,
        from_company_gstin: vendorGstin,
        from_company_phone: vendorPhone,
        to_company_name: companyProfile?.company_name || '',
        to_company_address: companyProfile?.address,
        to_company_city: companyProfile?.city,
        to_company_state: companyProfile?.state,
        to_company_state_code: companyProfile?.state_code,
        to_company_pincode: companyProfile?.pincode,
        to_company_gstin: companyProfile?.gstin,
        invoice_date: billDate,
        due_date: dueDate || undefined,
        reference_number: vendorInvoiceNumber,
        notes,
        total_amount: parseFloat(totalAmount),
        attachment_url: attachment.url,
        attachment_name: attachment.name,
        attachment_type: attachment.type,
        line_items: [{
          description: `Purchase from ${vendorName}`,
          quantity: 1,
          rate: parseFloat(totalAmount),
          amount: parseFloat(totalAmount),
        }],
      });
      
      toast.success('Purchase invoice created successfully');
      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error creating purchase invoice:', error);
      toast.error('Failed to create purchase invoice');
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const resetForm = () => {
    setInvoiceNumber('');
    setInvoiceNumberError('');
    setInvoiceNumberValid(false);
    setVendorName('');
    setVendorAddress('');
    setVendorGstin('');
    setVendorPhone('');
    setVendorInvoiceNumber('');
    setBillDate(format(new Date(), 'yyyy-MM-dd'));
    setDueDate('');
    setTotalAmount('');
    setAttachmentFile(null);
    setAttachmentPreview(null);
    setNotes('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Record Purchase Invoice</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
          <div className="space-y-6 py-4">
            {/* Bill To (Your Company - Read-only) */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Bill To (Your Company)</h3>
              <div className="text-sm space-y-1">
                <p className="font-medium">{companyProfile?.company_name || 'Loading...'}</p>
                <p className="text-muted-foreground">{companyProfile?.address}</p>
                <p className="text-muted-foreground">{companyProfile?.city}, {companyProfile?.state} {companyProfile?.pincode}</p>
                <p className="text-muted-foreground">GSTIN: {companyProfile?.gstin}</p>
              </div>
            </div>

            {/* Vendor Details (Bill From) */}
            <div className="space-y-4">
              <h3 className="font-semibold">Vendor Details (Bill From)</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label>Vendor Name *</Label>
                  <Input
                    value={vendorName}
                    onChange={(e) => setVendorName(e.target.value)}
                    placeholder="Vendor company name"
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Address</Label>
                  <Textarea
                    value={vendorAddress}
                    onChange={(e) => setVendorAddress(e.target.value)}
                    placeholder="Vendor address"
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>GSTIN</Label>
                  <Input
                    value={vendorGstin}
                    onChange={(e) => setVendorGstin(e.target.value)}
                    placeholder="Vendor GSTIN"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={vendorPhone}
                    onChange={(e) => setVendorPhone(e.target.value)}
                    placeholder="Vendor phone"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Bill Details */}
            <div className="space-y-4">
              <h3 className="font-semibold">Bill Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="invoiceNumber">Invoice Number (Our Reference) *</Label>
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
                      placeholder="e.g., PUR/24-25/0001"
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
                  <Label>Vendor Invoice Number</Label>
                  <Input
                    value={vendorInvoiceNumber}
                    onChange={(e) => setVendorInvoiceNumber(e.target.value)}
                    placeholder="Invoice # from vendor bill"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Total Amount *</Label>
                  <Input
                    type="number"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    placeholder="₹ 0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bill Date *</Label>
                  <Input
                    type="date"
                    value={billDate}
                    onChange={(e) => setBillDate(e.target.value)}
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
              </div>
            </div>

            <Separator />

            {/* Attachment Upload */}
            <div className="space-y-4">
              <h3 className="font-semibold">Attach Vendor Bill *</h3>
              <div className="text-sm text-muted-foreground mb-2">
                Upload the original bill/invoice received from the vendor (PDF, JPG, PNG, or WEBP)
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              {!attachmentFile ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                >
                  <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm font-medium">Click to upload or drag and drop</p>
                  <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG, WEBP (max 10MB)</p>
                </div>
              ) : (
                <div className="border rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    {attachmentPreview ? (
                      <img
                        src={attachmentPreview}
                        alt="Preview"
                        className="w-20 h-20 object-cover rounded border"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-muted rounded border flex items-center justify-center">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{attachmentFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(attachmentFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        {attachmentFile.type === 'application/pdf' ? (
                          <FileText className="h-4 w-4 text-red-500" />
                        ) : (
                          <ImageIcon className="h-4 w-4 text-blue-500" />
                        )}
                        <span className="text-xs text-muted-foreground uppercase">
                          {attachmentFile.type.split('/')[1]}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={removeAttachment}
                      className="shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes about this purchase..."
                rows={2}
              />
            </div>
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || uploading}>
            {loading || uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {uploading ? 'Uploading...' : 'Creating...'}
              </>
            ) : (
              'Record Purchase Invoice'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}