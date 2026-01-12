import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Save, Upload, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { BankDetails } from '@/types/invoice';
import type { Json } from '@/integrations/supabase/types';

interface CompanyProfileData {
  id: string;
  company_name: string;
  address: string;
  city: string;
  state: string;
  state_code: string;
  pincode: string;
  gstin: string;
  pan: string;
  cin: string;
  phone: string;
  email: string;
  website: string;
  bank_details: BankDetails;
  terms_and_conditions: string;
  declaration: string;
  default_notes: string;
  logo_url: string;
  signature_url: string;
  // GST Configuration
  default_cgst_rate: number;
  default_sgst_rate: number;
  default_igst_rate: number;
}

const defaultBankDetails: BankDetails = {
  account_holder: '',
  bank_name: '',
  account_number: '',
  account_type: '',
  ifsc_code: '',
  bank_address: '',
};

export function InvoiceSettingsTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<'logo' | 'signature' | null>(null);
  const [profile, setProfile] = useState<CompanyProfileData | null>(null);

  useEffect(() => {
    fetchCompanyProfile();
  }, []);

  const fetchCompanyProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('company_profiles')
        .select('*')
        .eq('profile_type', 'primary')
        .eq('is_default', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setProfile({
          id: data.id,
          company_name: data.company_name || '',
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          state_code: data.state_code || '',
          pincode: data.pincode || '',
          gstin: data.gstin || '',
          pan: data.pan || '',
          cin: data.cin || '',
          phone: data.phone || '',
          email: data.email || '',
          website: data.website || '',
          bank_details: (data.bank_details as BankDetails) || defaultBankDetails,
          terms_and_conditions: data.terms_and_conditions || '',
          declaration: data.declaration || '',
          default_notes: data.default_notes || '',
          logo_url: data.logo_url || '',
          signature_url: data.signature_url || '',
          default_cgst_rate: data.default_cgst_rate ?? 9,
          default_sgst_rate: data.default_sgst_rate ?? 9,
          default_igst_rate: data.default_igst_rate ?? 18,
        });
      }
    } catch (error) {
      console.error('Error fetching company profile:', error);
      toast.error('Failed to load company profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('company_profiles')
        .update({
          company_name: profile.company_name,
          address: profile.address,
          city: profile.city,
          state: profile.state,
          state_code: profile.state_code,
          pincode: profile.pincode,
          gstin: profile.gstin,
          pan: profile.pan,
          cin: profile.cin,
          phone: profile.phone,
          email: profile.email,
          website: profile.website,
          bank_details: profile.bank_details as Json,
          terms_and_conditions: profile.terms_and_conditions,
          declaration: profile.declaration,
          default_notes: profile.default_notes,
          logo_url: profile.logo_url,
          signature_url: profile.signature_url,
          default_cgst_rate: profile.default_cgst_rate,
          default_sgst_rate: profile.default_sgst_rate,
          default_igst_rate: profile.default_igst_rate,
        })
        .eq('id', profile.id);

      if (error) throw error;
      toast.success('Invoice settings saved successfully');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (type: 'logo' | 'signature', file: File) => {
    if (!profile) return;

    setUploading(type);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${type}s/${profile.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('invoice-assets')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('invoice-assets')
        .getPublicUrl(fileName);

      if (type === 'logo') {
        setProfile({ ...profile, logo_url: publicUrl });
      } else {
        setProfile({ ...profile, signature_url: publicUrl });
      }

      toast.success(`${type === 'logo' ? 'Logo' : 'Signature'} uploaded successfully`);
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error(`Failed to upload ${type}`);
    } finally {
      setUploading(null);
    }
  };

  const handleRemoveFile = (type: 'logo' | 'signature') => {
    if (!profile) return;
    if (type === 'logo') {
      setProfile({ ...profile, logo_url: '' });
    } else {
      setProfile({ ...profile, signature_url: '' });
    }
  };

  const updateField = (field: keyof CompanyProfileData, value: string) => {
    if (!profile) return;
    // Handle numeric fields for GST rates
    if (field === 'default_cgst_rate' || field === 'default_sgst_rate' || field === 'default_igst_rate') {
      const numValue = parseFloat(value) || 0;
      setProfile({ ...profile, [field]: numValue });
    } else {
      setProfile({ ...profile, [field]: value });
    }
  };

  const updateBankField = (field: keyof BankDetails, value: string) => {
    if (!profile) return;
    setProfile({
      ...profile,
      bank_details: { ...profile.bank_details, [field]: value },
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!profile) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No company profile found. Please create a primary company profile first.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* GST Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>GST Configuration</CardTitle>
          <CardDescription>Default tax rates for invoices. Set to 0 to disable a tax type.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="default_cgst_rate">CGST Rate (%)</Label>
              <Input
                id="default_cgst_rate"
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={profile.default_cgst_rate}
                onChange={(e) => updateField('default_cgst_rate', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Central GST for intra-state</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="default_sgst_rate">SGST Rate (%)</Label>
              <Input
                id="default_sgst_rate"
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={profile.default_sgst_rate}
                onChange={(e) => updateField('default_sgst_rate', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">State GST for intra-state</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="default_igst_rate">IGST Rate (%)</Label>
              <Input
                id="default_igst_rate"
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={profile.default_igst_rate}
                onChange={(e) => updateField('default_igst_rate', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Integrated GST for inter-state</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> CGST &amp; SGST apply for intra-state transactions (same state). IGST applies for inter-state transactions (different states).
          </p>
        </CardContent>
      </Card>

      {/* Company Information */}
      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
          <CardDescription>Your company details that appear on invoices</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="company_name">Company Name</Label>
              <Input
                id="company_name"
                value={profile.company_name}
                onChange={(e) => updateField('company_name', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gstin">GSTIN</Label>
              <Input
                id="gstin"
                value={profile.gstin}
                onChange={(e) => updateField('gstin', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={profile.address}
              onChange={(e) => updateField('address', e.target.value)}
              rows={2}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={profile.city}
                onChange={(e) => updateField('city', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={profile.state}
                onChange={(e) => updateField('state', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state_code">State Code</Label>
              <Input
                id="state_code"
                value={profile.state_code}
                onChange={(e) => updateField('state_code', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pincode">Pincode</Label>
              <Input
                id="pincode"
                value={profile.pincode}
                onChange={(e) => updateField('pincode', e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="pan">PAN</Label>
              <Input
                id="pan"
                value={profile.pan}
                onChange={(e) => updateField('pan', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cin">CIN</Label>
              <Input
                id="cin"
                value={profile.cin}
                onChange={(e) => updateField('cin', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={profile.phone}
                onChange={(e) => updateField('phone', e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                onChange={(e) => updateField('email', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={profile.website}
                onChange={(e) => updateField('website', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bank Details */}
      <Card>
        <CardHeader>
          <CardTitle>Bank Details</CardTitle>
          <CardDescription>Bank account information for payments</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="account_holder">Account Holder Name</Label>
              <Input
                id="account_holder"
                value={profile.bank_details.account_holder || ''}
                onChange={(e) => updateBankField('account_holder', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bank_name">Bank Name</Label>
              <Input
                id="bank_name"
                value={profile.bank_details.bank_name || ''}
                onChange={(e) => updateBankField('bank_name', e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="account_number">Account Number</Label>
              <Input
                id="account_number"
                value={profile.bank_details.account_number || ''}
                onChange={(e) => updateBankField('account_number', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="account_type">Account Type</Label>
              <Input
                id="account_type"
                value={profile.bank_details.account_type || ''}
                onChange={(e) => updateBankField('account_type', e.target.value)}
                placeholder="Current / Savings"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ifsc_code">IFSC Code</Label>
              <Input
                id="ifsc_code"
                value={profile.bank_details.ifsc_code || ''}
                onChange={(e) => updateBankField('ifsc_code', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bank_address">Branch Address</Label>
            <Input
              id="bank_address"
              value={profile.bank_details.bank_address || ''}
              onChange={(e) => updateBankField('bank_address', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Invoice Customization */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice Customization</CardTitle>
          <CardDescription>Default text that appears on invoices</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="default_notes">Default Notes</Label>
            <Textarea
              id="default_notes"
              value={profile.default_notes}
              onChange={(e) => updateField('default_notes', e.target.value)}
              rows={3}
              placeholder="Notes that will appear by default on new invoices..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="terms_and_conditions">Terms & Conditions</Label>
            <Textarea
              id="terms_and_conditions"
              value={profile.terms_and_conditions}
              onChange={(e) => updateField('terms_and_conditions', e.target.value)}
              rows={4}
              placeholder="Payment terms, conditions, late fees, etc."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="declaration">Declaration</Label>
            <Textarea
              id="declaration"
              value={profile.declaration}
              onChange={(e) => updateField('declaration', e.target.value)}
              rows={3}
              placeholder="We declare that this invoice shows the actual price..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Branding */}
      <Card>
        <CardHeader>
          <CardTitle>Branding</CardTitle>
          <CardDescription>Logo and signature for invoices</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Logo */}
          <div className="space-y-3">
            <Label>Company Logo</Label>
            <div className="flex items-center gap-4">
              {profile.logo_url ? (
                <div className="relative">
                  <img
                    src={profile.logo_url}
                    alt="Company Logo"
                    className="h-16 w-auto rounded border object-contain"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute -right-2 -top-2 h-6 w-6"
                    onClick={() => handleRemoveFile('logo')}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="flex h-16 w-32 items-center justify-center rounded border border-dashed text-muted-foreground">
                  No logo
                </div>
              )}
              <div>
                <input
                  type="file"
                  id="logo-upload"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload('logo', file);
                  }}
                />
                <Button
                  variant="outline"
                  onClick={() => document.getElementById('logo-upload')?.click()}
                  disabled={uploading === 'logo'}
                >
                  {uploading === 'logo' ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  Upload Logo
                </Button>
              </div>
            </div>
          </div>

          {/* Signature */}
          <div className="space-y-3">
            <Label>Digital Signature</Label>
            <div className="flex items-center gap-4">
              {profile.signature_url ? (
                <div className="relative">
                  <img
                    src={profile.signature_url}
                    alt="Signature"
                    className="h-16 w-auto rounded border object-contain"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute -right-2 -top-2 h-6 w-6"
                    onClick={() => handleRemoveFile('signature')}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="flex h-16 w-32 items-center justify-center rounded border border-dashed text-muted-foreground">
                  No signature
                </div>
              )}
              <div>
                <input
                  type="file"
                  id="signature-upload"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload('signature', file);
                  }}
                />
                <Button
                  variant="outline"
                  onClick={() => document.getElementById('signature-upload')?.click()}
                  disabled={uploading === 'signature'}
                >
                  {uploading === 'signature' ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  Upload Signature
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Upload a transparent PNG for best results. This will appear on PDF invoices.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Invoice Settings
        </Button>
      </div>
    </div>
  );
}