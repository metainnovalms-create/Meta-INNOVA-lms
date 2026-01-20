import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Save, RotateCcw, Eye, EyeOff, Palette, Mail, Building, Image } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { EmailTemplatePreview } from './EmailTemplatePreview';

export interface EmailTemplateSettings {
  from_name: string;
  from_email: string;
  company_name: string;
  logo_url: string;
  header_color_start: string;
  header_color_end: string;
  button_color_start: string;
  button_color_end: string;
  footer_text: string;
}

const defaultSettings: EmailTemplateSettings = {
  from_name: 'Meta Skills Academy',
  from_email: 'noreply@edu.metasageacademy.com',
  company_name: 'Meta Skills Academy',
  logo_url: '',
  header_color_start: '#6366f1',
  header_color_end: '#8b5cf6',
  button_color_start: '#6366f1',
  button_color_end: '#8b5cf6',
  footer_text: 'This is an automated message, please do not reply.',
};

export function EmailTemplateSettingsCard() {
  const [settings, setSettings] = useState<EmailTemplateSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_configurations')
        .select('value')
        .eq('key', 'email_template_settings')
        .single();

      if (!error && data?.value) {
        const value = data.value as unknown as EmailTemplateSettings;
        setSettings({ ...defaultSettings, ...value });
      }
    } catch (error) {
      console.error('Error fetching email template settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = (field: keyof EmailTemplateSettings, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('system_configurations')
        .update({
          value: JSON.parse(JSON.stringify(settings)),
          updated_at: new Date().toISOString(),
        })
        .eq('key', 'email_template_settings');

      if (error) throw error;
      toast.success('Email template settings saved successfully');
    } catch (error) {
      console.error('Error saving email template settings:', error);
      toast.error('Failed to save email template settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(defaultSettings);
    toast.info('Settings reset to defaults (not saved yet)');
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-10 bg-muted rounded"></div>
            <div className="h-10 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              Email Template Settings
            </CardTitle>
            <CardDescription>
              Customize the appearance and branding of system emails
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? (
              <>
                <EyeOff className="h-4 w-4 mr-2" />
                Hide Preview
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Show Preview
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sender Information */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Sender Information
          </h4>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="from-name">From Name</Label>
              <Input
                id="from-name"
                value={settings.from_name}
                onChange={(e) => updateField('from_name', e.target.value)}
                placeholder="Meta Skills Academy"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="from-email">From Email</Label>
              <Input
                id="from-email"
                type="email"
                value={settings.from_email}
                onChange={(e) => updateField('from_email', e.target.value)}
                placeholder="noreply@example.com"
              />
              <p className="text-xs text-muted-foreground">
                Must match a verified domain in Resend
              </p>
            </div>
          </div>
        </div>

        {/* Branding */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center gap-2">
            <Building className="h-4 w-4" />
            Branding
          </h4>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="company-name">Company Name</Label>
              <Input
                id="company-name"
                value={settings.company_name}
                onChange={(e) => updateField('company_name', e.target.value)}
                placeholder="Meta Skills Academy"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="logo-url" className="flex items-center gap-2">
                <Image className="h-4 w-4" />
                Logo URL (optional)
              </Label>
              <Input
                id="logo-url"
                value={settings.logo_url}
                onChange={(e) => updateField('logo_url', e.target.value)}
                placeholder="https://example.com/logo.png"
              />
            </div>
          </div>
        </div>

        {/* Header Colors */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Header Gradient Colors
          </h4>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Start Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={settings.header_color_start}
                  onChange={(e) => updateField('header_color_start', e.target.value)}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={settings.header_color_start}
                  onChange={(e) => updateField('header_color_start', e.target.value)}
                  placeholder="#6366f1"
                  className="flex-1 font-mono"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>End Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={settings.header_color_end}
                  onChange={(e) => updateField('header_color_end', e.target.value)}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={settings.header_color_end}
                  onChange={(e) => updateField('header_color_end', e.target.value)}
                  placeholder="#8b5cf6"
                  className="flex-1 font-mono"
                />
              </div>
            </div>
          </div>
          {/* Gradient Preview */}
          <div 
            className="h-8 rounded-lg"
            style={{ 
              background: `linear-gradient(135deg, ${settings.header_color_start} 0%, ${settings.header_color_end} 100%)` 
            }}
          />
        </div>

        {/* Button Colors */}
        <div className="space-y-4">
          <h4 className="font-medium">Button Gradient Colors</h4>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Start Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={settings.button_color_start}
                  onChange={(e) => updateField('button_color_start', e.target.value)}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={settings.button_color_start}
                  onChange={(e) => updateField('button_color_start', e.target.value)}
                  placeholder="#6366f1"
                  className="flex-1 font-mono"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>End Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={settings.button_color_end}
                  onChange={(e) => updateField('button_color_end', e.target.value)}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={settings.button_color_end}
                  onChange={(e) => updateField('button_color_end', e.target.value)}
                  placeholder="#8b5cf6"
                  className="flex-1 font-mono"
                />
              </div>
            </div>
          </div>
          {/* Button Preview */}
          <div className="flex justify-center">
            <div 
              className="px-6 py-3 rounded-lg text-white font-medium shadow-lg"
              style={{ 
                background: `linear-gradient(135deg, ${settings.button_color_start} 0%, ${settings.button_color_end} 100%)` 
              }}
            >
              Sample Button
            </div>
          </div>
        </div>

        {/* Footer Text */}
        <div className="space-y-2">
          <Label htmlFor="footer-text">Footer Text</Label>
          <Textarea
            id="footer-text"
            value={settings.footer_text}
            onChange={(e) => updateField('footer_text', e.target.value)}
            placeholder="This is an automated message, please do not reply."
            rows={2}
          />
        </div>

        {/* Live Preview */}
        {showPreview && (
          <div className="border rounded-lg p-4 bg-muted/30">
            <h4 className="font-medium mb-4">Email Preview</h4>
            <EmailTemplatePreview settings={settings} />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t">
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Button>
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
