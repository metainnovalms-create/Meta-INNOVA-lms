import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Save, Upload, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ReportSettings {
  id?: string;
  report_logo_url: string | null;
  report_logo_width: number;
  report_logo_height: number;
  report_signatory_name: string;
  report_signatory_designation: string;
}

const defaultSettings: ReportSettings = {
  report_logo_url: null,
  report_logo_width: 120,
  report_logo_height: 40,
  report_signatory_name: 'Mr. Vasanthaseelan',
  report_signatory_designation: 'AGM - Metasage Alliance',
};

export const ReportSettingsTab = () => {
  const [settings, setSettings] = useState<ReportSettings>(defaultSettings);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('company_profiles')
        .select('id, report_logo_url, report_logo_width, report_logo_height, report_signatory_name, report_signatory_designation')
        .eq('is_default', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setSettings({
          id: data.id,
          report_logo_url: data.report_logo_url,
          report_logo_width: data.report_logo_width || 120,
          report_logo_height: data.report_logo_height || 40,
          report_signatory_name: data.report_signatory_name || 'Mr. Vasanthaseelan',
          report_signatory_designation: data.report_signatory_designation || 'AGM - Metasage Alliance',
        });
      }
    } catch (error) {
      console.error('Error fetching report settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size should be less than 2MB');
      return;
    }

    setUploading(true);
    try {
      const fileName = `report-logos/${Date.now()}-${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('invoice-assets')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('invoice-assets')
        .getPublicUrl(fileName);

      setSettings(prev => ({ ...prev, report_logo_url: urlData.publicUrl }));
      toast.success('Logo uploaded successfully');
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Failed to upload logo');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (settings.report_logo_url) {
      try {
        const path = settings.report_logo_url.split('/invoice-assets/')[1];
        if (path) {
          await supabase.storage.from('invoice-assets').remove([path]);
        }
      } catch (error) {
        console.error('Error removing logo from storage:', error);
      }
    }
    setSettings(prev => ({ ...prev, report_logo_url: null }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (settings.id) {
        const { error } = await supabase
          .from('company_profiles')
          .update({
            report_logo_url: settings.report_logo_url,
            report_logo_width: settings.report_logo_width,
            report_logo_height: settings.report_logo_height,
            report_signatory_name: settings.report_signatory_name,
            report_signatory_designation: settings.report_signatory_designation,
          })
          .eq('id', settings.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('company_profiles')
          .insert({
            company_name: 'Default Company',
            is_default: true,
            report_logo_url: settings.report_logo_url,
            report_logo_width: settings.report_logo_width,
            report_logo_height: settings.report_logo_height,
            report_signatory_name: settings.report_signatory_name,
            report_signatory_designation: settings.report_signatory_designation,
          });

        if (error) throw error;
      }

      toast.success('Report settings saved successfully');
      fetchSettings();
    } catch (error) {
      console.error('Error saving report settings:', error);
      toast.error('Failed to save report settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading settings...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Report Logo</CardTitle>
          <CardDescription>Upload a custom logo for your activity reports</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Logo Preview */}
          <div className="border rounded-lg p-4 bg-muted/50">
            <Label className="text-sm text-muted-foreground mb-2 block">Logo Preview</Label>
            {settings.report_logo_url ? (
              <div className="flex items-center gap-4">
                <img 
                  src={settings.report_logo_url} 
                  alt="Report Logo" 
                  style={{ 
                    width: settings.report_logo_width, 
                    height: settings.report_logo_height,
                    objectFit: 'contain'
                  }}
                  className="border rounded"
                />
                <Button variant="destructive" size="sm" onClick={handleRemoveLogo}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No custom logo uploaded. Default logo will be used.</p>
            )}
          </div>

          {/* Upload Button */}
          <div>
            <Label htmlFor="logo-upload">Upload Logo</Label>
            <div className="flex gap-2 mt-1">
              <Input 
                id="logo-upload" 
                type="file" 
                accept="image/*" 
                onChange={handleLogoUpload}
                disabled={uploading}
              />
              {uploading && <span className="text-sm text-muted-foreground">Uploading...</span>}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Recommended: PNG with transparent background, max 2MB</p>
          </div>

          {/* Size Controls */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="logo-width">Logo Width (px)</Label>
              <Input 
                id="logo-width" 
                type="number" 
                min={60} 
                max={200}
                value={settings.report_logo_width}
                onChange={(e) => setSettings(prev => ({ ...prev, report_logo_width: parseInt(e.target.value) || 120 }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="logo-height">Logo Height (px)</Label>
              <Input 
                id="logo-height" 
                type="number" 
                min={20} 
                max={100}
                value={settings.report_logo_height}
                onChange={(e) => setSettings(prev => ({ ...prev, report_logo_height: parseInt(e.target.value) || 40 }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Default Signatory</CardTitle>
          <CardDescription>Configure default signatory details for reports</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="signatory-name">Signatory Name</Label>
              <Input 
                id="signatory-name" 
                value={settings.report_signatory_name}
                onChange={(e) => setSettings(prev => ({ ...prev, report_signatory_name: e.target.value }))}
                placeholder="Mr. Vasanthaseelan"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signatory-designation">Signatory Designation</Label>
              <Input 
                id="signatory-designation" 
                value={settings.report_signatory_designation}
                onChange={(e) => setSettings(prev => ({ ...prev, report_signatory_designation: e.target.value }))}
                placeholder="AGM - Metasage Alliance"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving}>
        <Save className="mr-2 h-4 w-4" />
        {saving ? 'Saving...' : 'Save Report Settings'}
      </Button>
    </div>
  );
};