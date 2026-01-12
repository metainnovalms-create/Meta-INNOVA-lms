import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ImageUploader } from './ImageUploader';
import { useUpdateConfiguration } from '@/hooks/useSystemStats';
import { useBranding, BrandingConfig } from '@/contexts/BrandingContext';
import { toast } from 'sonner';
import { Palette, Type, Image, Globe, Loader2 } from 'lucide-react';

export function BrandingTab() {
  const { branding, refetch } = useBranding();
  const updateConfig = useUpdateConfiguration();
  
  const [localBranding, setLocalBranding] = useState<BrandingConfig>(branding);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setLocalBranding(branding);
  }, [branding]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateConfig.mutateAsync({ 
        key: 'site_branding', 
        value: localBranding 
      });
      await refetch();
      toast.success('Branding settings saved successfully');
    } catch (err) {
      toast.error('Failed to save branding settings');
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = (field: keyof BrandingConfig, value: string) => {
    setLocalBranding(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Logo Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Logo Configuration
          </CardTitle>
          <CardDescription>Configure logos for sidebar and login page</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <ImageUploader
              label="Sidebar Logo (Expanded)"
              value={localBranding.logo_expanded_url}
              onChange={(url) => updateField('logo_expanded_url', url)}
              recommended="Recommended: 200x60px"
            />
            <ImageUploader
              label="Sidebar Logo (Collapsed)"
              value={localBranding.logo_collapsed_url}
              onChange={(url) => updateField('logo_collapsed_url', url)}
              recommended="Recommended: 40x40px"
            />
          </div>
          <Separator />
          <div className="space-y-2 max-w-xs">
            <Label htmlFor="sidebar_bg" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Sidebar Logo Background
            </Label>
            <div className="flex gap-2">
              <Input
                id="sidebar_bg"
                type="color"
                value={localBranding.sidebar_logo_bg}
                onChange={(e) => updateField('sidebar_logo_bg', e.target.value)}
                className="w-12 h-10 p-1 cursor-pointer"
              />
              <Input
                value={localBranding.sidebar_logo_bg}
                onChange={(e) => updateField('sidebar_logo_bg', e.target.value)}
                placeholder="#2d437f"
                className="flex-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Favicon & Theme */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Favicon & Theme
          </CardTitle>
          <CardDescription>Configure browser tab icon and primary colors</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <ImageUploader
              label="Favicon"
              value={localBranding.favicon_url}
              onChange={(url) => updateField('favicon_url', url)}
              recommended="Recommended: 32x32px PNG"
              accept=".png,.ico,.svg"
            />
            <div className="space-y-2">
              <Label htmlFor="primary_color" className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Primary Brand Color
              </Label>
              <div className="flex gap-2">
                <Input
                  id="primary_color"
                  type="color"
                  value={localBranding.primary_color}
                  onChange={(e) => updateField('primary_color', e.target.value)}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={localBranding.primary_color}
                  onChange={(e) => updateField('primary_color', e.target.value)}
                  placeholder="#051c2d"
                  className="flex-1 max-w-[150px]"
                />
              </div>
              <p className="text-xs text-muted-foreground">Used for PWA and mobile browsers</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SEO & Meta Tags */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            SEO & Meta Tags
          </CardTitle>
          <CardDescription>Configure search engine and social media settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="site_title" className="flex items-center gap-2">
              <Type className="h-4 w-4" />
              Site Title
            </Label>
            <Input
              id="site_title"
              value={localBranding.site_title}
              onChange={(e) => updateField('site_title', e.target.value)}
              placeholder="Meta-INNOVA LMS"
            />
            <p className="text-xs text-muted-foreground">Appears in browser tab (max 60 characters)</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="site_description">Site Description</Label>
            <Textarea
              id="site_description"
              value={localBranding.site_description}
              onChange={(e) => updateField('site_description', e.target.value)}
              placeholder="Meta-Innova Innovation Academy - Empowering Education Through Technology"
              rows={2}
            />
            <p className="text-xs text-muted-foreground">For search engines (max 160 characters)</p>
          </div>

          <Separator />

          <ImageUploader
            label="Social Media Preview Image (OG Image)"
            value={localBranding.og_image_url}
            onChange={(url) => updateField('og_image_url', url)}
            recommended="Recommended: 1200x630px"
          />
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving} size="lg">
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Branding Settings'
          )}
        </Button>
      </div>
    </div>
  );
}
