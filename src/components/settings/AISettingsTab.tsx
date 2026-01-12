import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Save, Bot, Key, AlertTriangle, CheckCircle, Eye, EyeOff, Loader2, Gauge } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AISettings {
  enabled: boolean;
  custom_api_key: string;
  model: string;
  prompt_limit_enabled: boolean;
  monthly_prompt_limit: number;
}

const defaultSettings: AISettings = {
  enabled: true,
  custom_api_key: '',
  model: 'gpt-4o-mini',
  prompt_limit_enabled: false,
  monthly_prompt_limit: 10
};

export function AISettingsTab() {
  const [settings, setSettings] = useState<AISettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [togglingAI, setTogglingAI] = useState(false);
  const [apiKeyType, setApiKeyType] = useState<'default' | 'custom'>('default');
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_configurations')
        .select('value')
        .eq('key', 'ask_metova_settings')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching AI settings:', error);
        return;
      }

      if (data?.value) {
        const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
        setSettings(parsed);
        setApiKeyType(parsed.custom_api_key ? 'custom' : 'default');
      }
    } catch (e) {
      console.error('Error parsing AI settings:', e);
    } finally {
      setLoading(false);
    }
  };

  // Immediate save when toggling AI on/off
  const handleToggleAI = async (checked: boolean) => {
    setTogglingAI(true);
    const newSettings = { ...settings, enabled: checked };
    setSettings(newSettings);
    
    try {
      const { error } = await supabase
        .from('system_configurations')
        .upsert({
          key: 'ask_metova_settings',
          value: newSettings,
          category: 'features',
          description: 'Ask Metova AI integration settings'
        }, { onConflict: 'key' });

      if (error) throw error;

      // Also sync with feature_ai for consistency
      await supabase
        .from('system_configurations')
        .upsert({
          key: 'feature_ai',
          value: { enabled: checked },
          category: 'features',
          description: 'AI Features toggle'
        }, { onConflict: 'key' });

      toast.success(checked ? 'AI Assistant enabled' : 'AI Assistant disabled');
    } catch (e) {
      console.error('Error toggling AI:', e);
      toast.error('Failed to update AI status');
      // Revert on error
      setSettings({ ...settings, enabled: !checked });
    } finally {
      setTogglingAI(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const settingsToSave = {
        ...settings,
        custom_api_key: apiKeyType === 'default' ? '' : settings.custom_api_key
      };

      const { error } = await supabase
        .from('system_configurations')
        .upsert({
          key: 'ask_metova_settings',
          value: settingsToSave,
          category: 'features',
          description: 'Ask Metova AI integration settings'
        }, { onConflict: 'key' });

      if (error) throw error;

      toast.success('AI settings saved successfully');
    } catch (e) {
      console.error('Error saving AI settings:', e);
      toast.error('Failed to save AI settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* AI Toggle Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Ask Metova AI
          </CardTitle>
          <CardDescription>
            Enable or disable the AI assistant across all dashboards
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Enable AI Assistant</Label>
              <p className="text-sm text-muted-foreground">
                When disabled, "Ask Metova" will show a maintenance message to all users
              </p>
            </div>
            <div className="flex items-center gap-3">
              {settings.enabled ? (
                <Badge variant="default" className="bg-green-500">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Disabled
                </Badge>
              )}
              {togglingAI ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : (
                <Switch
                  checked={settings.enabled}
                  onCheckedChange={handleToggleAI}
                  disabled={togglingAI}
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Key Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            API Key Configuration
          </CardTitle>
          <CardDescription>
            Choose whether to use the default API key or provide your own OpenAI API key
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup
            value={apiKeyType}
            onValueChange={(value: 'default' | 'custom') => setApiKeyType(value)}
            className="space-y-3"
          >
            <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
              <RadioGroupItem value="default" id="default" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="default" className="text-base font-medium cursor-pointer">
                  Use Default API Key
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Uses the pre-configured OpenAI API key. Recommended for most users.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
              <RadioGroupItem value="custom" id="custom" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="custom" className="text-base font-medium cursor-pointer">
                  Use Custom API Key
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Provide your own OpenAI API key for billing and usage control.
                </p>
              </div>
            </div>
          </RadioGroup>

          {apiKeyType === 'custom' && (
            <div className="space-y-2 pt-4 border-t">
              <Label htmlFor="api-key">OpenAI API Key</Label>
              <div className="relative">
                <Input
                  id="api-key"
                  type={showApiKey ? 'text' : 'password'}
                  placeholder="sk-..."
                  value={settings.custom_api_key}
                  onChange={(e) => setSettings({ ...settings, custom_api_key: e.target.value })}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Your API key is stored securely and used only for AI queries.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Model Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Model Selection</CardTitle>
          <CardDescription>
            Choose the AI model for generating responses
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>AI Model</Label>
            <Select
              value={settings.model}
              onValueChange={(value) => setSettings({ ...settings, model: value })}
            >
              <SelectTrigger className="w-full md:w-[300px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-4o-mini">
                  <div className="flex flex-col">
                    <span>GPT-4o Mini</span>
                    <span className="text-xs text-muted-foreground">Fast & cost-effective (Recommended)</span>
                  </div>
                </SelectItem>
                <SelectItem value="gpt-4o">
                  <div className="flex flex-col">
                    <span>GPT-4o</span>
                    <span className="text-xs text-muted-foreground">More powerful, higher cost</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Usage Limits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="h-5 w-5" />
            Usage Limits
          </CardTitle>
          <CardDescription>
            Control how many prompts each user can send per month to manage API costs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Enable Monthly Prompt Limit</Label>
              <p className="text-sm text-muted-foreground">
                Limit each user to a set number of prompts per month
              </p>
            </div>
            <Switch
              checked={settings.prompt_limit_enabled}
              onCheckedChange={(checked) => setSettings({ ...settings, prompt_limit_enabled: checked })}
            />
          </div>
          
          {settings.prompt_limit_enabled && (
            <div className="space-y-2 pt-4 border-t">
              <Label htmlFor="monthly-limit">Monthly Limit per User</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="monthly-limit"
                  type="number"
                  min="1"
                  max="1000"
                  value={settings.monthly_prompt_limit}
                  onChange={(e) => setSettings({ ...settings, monthly_prompt_limit: parseInt(e.target.value) || 10 })}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">prompts per month</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Users will see their remaining prompts and be notified when approaching the limit. Resets on the 1st of each month.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={saveSettings} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? 'Saving...' : 'Save AI Settings'}
        </Button>
      </div>
    </div>
  );
}
