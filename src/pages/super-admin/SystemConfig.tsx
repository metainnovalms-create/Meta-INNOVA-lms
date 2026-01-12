import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Settings, Plug, Database, Shield, HardDrive, RefreshCw, CheckCircle2, AlertTriangle, Clock, Paintbrush } from 'lucide-react';
import { BrandingTab } from '@/components/system-config/BrandingTab';
import { supabase } from '@/integrations/supabase/client';
import { 
  useStorageStats, 
  useDatabaseStats, 
  useSecurityStats, 
  useSystemConfigurations,
  useUpdateConfiguration,
  useConfigValue
} from '@/hooks/useSystemStats';
import { formatDistanceToNow } from 'date-fns';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default function SystemConfig() {
  const { data: storageStats, isLoading: storageLoading, refetch: refetchStorage } = useStorageStats();
  const { data: dbStats, isLoading: dbLoading, refetch: refetchDb } = useDatabaseStats();
  const { data: securityStats, isLoading: securityLoading, refetch: refetchSecurity } = useSecurityStats();
  const { data: configurations, isLoading: configLoading } = useSystemConfigurations();
  const updateConfig = useUpdateConfiguration();

  // Local state for form inputs
  const [localConfig, setLocalConfig] = useState({
    email_service: { smtp_host: '', smtp_port: '587', smtp_user: '', enabled: false },
    sms_gateway: { provider: 'twilio', api_key: '', enabled: false },
    feature_ai: { enabled: false },
    feature_proctoring: { enabled: true },
    feature_gamification: { enabled: true },
    backup_settings: { enabled: true, frequency: 'daily' }
  });

  // Update local state when configurations load
  useEffect(() => {
    if (configurations) {
      const newConfig = { ...localConfig };
      configurations.forEach(config => {
        if (config.key in newConfig) {
          (newConfig as any)[config.key] = config.value;
        }
      });
      setLocalConfig(newConfig);
    }
  }, [configurations]);

  const handleSaveConfig = async (key: string, value: Record<string, any>) => {
    await updateConfig.mutateAsync({ key, value });
  };

  const handleRefreshAll = () => {
    refetchStorage();
    refetchDb();
    refetchSecurity();
    toast.success('Stats refreshed');
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">System Configuration</h1>
            <p className="text-muted-foreground">Monitor and manage platform-wide settings</p>
          </div>
          <Button variant="outline" onClick={handleRefreshAll}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Stats
          </Button>
        </div>

        <Tabs defaultValue="branding" className="space-y-6">
          <TabsList className="flex-wrap">
            <TabsTrigger value="branding">
              <Paintbrush className="mr-2 h-4 w-4" />
              Branding
            </TabsTrigger>
            <TabsTrigger value="integrations">
              <Plug className="mr-2 h-4 w-4" />
              Integrations
            </TabsTrigger>
            <TabsTrigger value="features">
              <Settings className="mr-2 h-4 w-4" />
              Features
            </TabsTrigger>
            <TabsTrigger value="storage">
              <HardDrive className="mr-2 h-4 w-4" />
              Storage
            </TabsTrigger>
            <TabsTrigger value="database">
              <Database className="mr-2 h-4 w-4" />
              Database
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="mr-2 h-4 w-4" />
              Security
            </TabsTrigger>
          </TabsList>

          {/* Branding Tab */}
          <TabsContent value="branding">
            <BrandingTab />
          </TabsContent>

          {/* Integrations Tab */}
          <TabsContent value="integrations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Email Service (SMTP)</CardTitle>
                <CardDescription>Configure email delivery settings for notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Email Service</Label>
                    <p className="text-sm text-muted-foreground">Send email notifications to users</p>
                  </div>
                  <Switch
                    checked={localConfig.email_service.enabled}
                    onCheckedChange={(checked) => {
                      const newValue = { ...localConfig.email_service, enabled: checked };
                      setLocalConfig({ ...localConfig, email_service: newValue });
                    }}
                  />
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="smtp_host">SMTP Host</Label>
                    <Input
                      id="smtp_host"
                      value={localConfig.email_service.smtp_host}
                      onChange={(e) => setLocalConfig({
                        ...localConfig,
                        email_service: { ...localConfig.email_service, smtp_host: e.target.value }
                      })}
                      placeholder="smtp.gmail.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtp_port">SMTP Port</Label>
                    <Input
                      id="smtp_port"
                      value={localConfig.email_service.smtp_port}
                      onChange={(e) => setLocalConfig({
                        ...localConfig,
                        email_service: { ...localConfig.email_service, smtp_port: e.target.value }
                      })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp_user">SMTP Username</Label>
                  <Input
                    id="smtp_user"
                    value={localConfig.email_service.smtp_user}
                    onChange={(e) => setLocalConfig({
                      ...localConfig,
                      email_service: { ...localConfig.email_service, smtp_user: e.target.value }
                    })}
                    placeholder="noreply@example.com"
                  />
                </div>
                <Button 
                  onClick={() => handleSaveConfig('email_service', localConfig.email_service)}
                  disabled={updateConfig.isPending}
                >
                  Save Email Settings
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>SMS Gateway</CardTitle>
                <CardDescription>Configure SMS service for alerts and OTP</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable SMS Service</Label>
                    <p className="text-sm text-muted-foreground">Send SMS notifications to users</p>
                  </div>
                  <Switch
                    checked={localConfig.sms_gateway.enabled}
                    onCheckedChange={(checked) => {
                      const newValue = { ...localConfig.sms_gateway, enabled: checked };
                      setLocalConfig({ ...localConfig, sms_gateway: newValue });
                    }}
                  />
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label htmlFor="sms_provider">Provider</Label>
                  <Input
                    id="sms_provider"
                    value={localConfig.sms_gateway.provider}
                    onChange={(e) => setLocalConfig({
                      ...localConfig,
                      sms_gateway: { ...localConfig.sms_gateway, provider: e.target.value }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sms_api_key">API Key</Label>
                  <Input
                    id="sms_api_key"
                    type="password"
                    value={localConfig.sms_gateway.api_key}
                    onChange={(e) => setLocalConfig({
                      ...localConfig,
                      sms_gateway: { ...localConfig.sms_gateway, api_key: e.target.value }
                    })}
                    placeholder="••••••••"
                  />
                </div>
                <Button 
                  onClick={() => handleSaveConfig('sms_gateway', localConfig.sms_gateway)}
                  disabled={updateConfig.isPending}
                >
                  Save SMS Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Features Tab */}
          <TabsContent value="features" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Feature Toggles</CardTitle>
                <CardDescription>Enable or disable platform features globally</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>AI Features (Ask Metova)</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable AI-powered content generation and analysis
                    </p>
                  </div>
                  <Switch
                    checked={localConfig.feature_ai.enabled}
                    onCheckedChange={async (checked) => {
                      const newValue = { enabled: checked };
                      setLocalConfig({ ...localConfig, feature_ai: newValue });
                      await handleSaveConfig('feature_ai', newValue);
                      // Also sync with ask_metova_settings for consistency
                      try {
                        const { data } = await supabase
                          .from('system_configurations')
                          .select('value')
                          .eq('key', 'ask_metova_settings')
                          .single();
                        
                        const defaultSettings = { enabled: true, custom_api_key: '', model: 'gpt-4o-mini' };
                        const currentSettings = data?.value 
                          ? (typeof data.value === 'string' ? JSON.parse(data.value) : data.value)
                          : defaultSettings;
                        const updatedSettings = { 
                          ...defaultSettings,
                          ...(typeof currentSettings === 'object' ? currentSettings : {}),
                          enabled: checked 
                        };
                        
                        await supabase
                          .from('system_configurations')
                          .upsert({
                            key: 'ask_metova_settings',
                            value: updatedSettings,
                            category: 'features',
                            description: 'Ask Metova AI integration settings'
                          }, { onConflict: 'key' });
                      } catch (e) {
                        console.error('Error syncing Ask Metova settings:', e);
                      }
                    }}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Exam Proctoring</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable video proctoring for online assessments
                    </p>
                  </div>
                  <Switch
                    checked={localConfig.feature_proctoring.enabled}
                    onCheckedChange={(checked) => {
                      const newValue = { enabled: checked };
                      setLocalConfig({ ...localConfig, feature_proctoring: newValue });
                      handleSaveConfig('feature_proctoring', newValue);
                    }}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Gamification</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable points, badges, and leaderboards
                    </p>
                  </div>
                  <Switch
                    checked={localConfig.feature_gamification.enabled}
                    onCheckedChange={(checked) => {
                      const newValue = { enabled: checked };
                      setLocalConfig({ ...localConfig, feature_gamification: newValue });
                      handleSaveConfig('feature_gamification', newValue);
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Storage Tab */}
          <TabsContent value="storage" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              {storageLoading ? (
                <>
                  <Skeleton className="h-24" />
                  <Skeleton className="h-24" />
                  <Skeleton className="h-24" />
                  <Skeleton className="h-24" />
                </>
              ) : (
                <>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">{storageStats?.totalBuckets || 0}</div>
                      <p className="text-xs text-muted-foreground">Total Buckets</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">{storageStats?.totalFiles || 0}</div>
                      <p className="text-xs text-muted-foreground">Total Files</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">{formatBytes(storageStats?.totalSizeBytes || 0)}</div>
                      <p className="text-xs text-muted-foreground">Storage Used</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">
                        {storageStats?.publicBuckets || 0} / {storageStats?.privateBuckets || 0}
                      </div>
                      <p className="text-xs text-muted-foreground">Public / Private</p>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Bucket Breakdown</CardTitle>
                <CardDescription>Storage usage by bucket</CardDescription>
              </CardHeader>
              <CardContent>
                {storageLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-12" />)}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {storageStats?.buckets.map(bucket => (
                      <div key={bucket.name} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <HardDrive className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{bucket.name}</p>
                            <p className="text-sm text-muted-foreground">{bucket.fileCount} files</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={bucket.isPublic ? 'default' : 'secondary'}>
                            {bucket.isPublic ? 'Public' : 'Private'}
                          </Badge>
                          <span className="text-sm font-medium">{formatBytes(bucket.totalSizeBytes)}</span>
                        </div>
                      </div>
                    ))}
                    {(!storageStats?.buckets || storageStats.buckets.length === 0) && (
                      <p className="text-muted-foreground text-center py-4">No storage buckets found</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Database Tab */}
          <TabsContent value="database" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              {dbLoading ? (
                <>
                  <Skeleton className="h-24" />
                  <Skeleton className="h-24" />
                  <Skeleton className="h-24" />
                </>
              ) : (
                <>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">{dbStats?.totalTables || 0}</div>
                      <p className="text-xs text-muted-foreground">Total Tables</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">{dbStats?.totalRows?.toLocaleString() || 0}</div>
                      <p className="text-xs text-muted-foreground">Total Rows</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-6 w-6 text-green-500" />
                        <div className="text-2xl font-bold">Healthy</div>
                      </div>
                      <p className="text-xs text-muted-foreground">Database Status</p>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Largest Tables</CardTitle>
                <CardDescription>Tables with the most rows</CardDescription>
              </CardHeader>
              <CardContent>
                {dbLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-12" />)}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {dbStats?.largestTables.map((table, index) => (
                      <div key={table.name} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-muted-foreground w-6">#{index + 1}</span>
                          <Database className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{table.name}</span>
                        </div>
                        <span className="text-sm">{table.rowCount.toLocaleString()} rows</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Backup Settings</CardTitle>
                <CardDescription>Configure database backup preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Automated Backups</Label>
                    <p className="text-sm text-muted-foreground">Enable automatic database backups</p>
                  </div>
                  <Switch
                    checked={localConfig.backup_settings.enabled}
                    onCheckedChange={(checked) => {
                      const newValue = { ...localConfig.backup_settings, enabled: checked };
                      setLocalConfig({ ...localConfig, backup_settings: newValue });
                      handleSaveConfig('backup_settings', newValue);
                    }}
                  />
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>Backup Frequency</Label>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                    value={localConfig.backup_settings.frequency}
                    onChange={(e) => {
                      const newValue = { ...localConfig.backup_settings, frequency: e.target.value };
                      setLocalConfig({ ...localConfig, backup_settings: newValue });
                      handleSaveConfig('backup_settings', newValue);
                    }}
                  >
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              {securityLoading ? (
                <>
                  <Skeleton className="h-24" />
                  <Skeleton className="h-24" />
                  <Skeleton className="h-24" />
                </>
              ) : (
                <>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                        <div className="text-2xl font-bold">{securityStats?.rlsEnabledTables || 0}</div>
                      </div>
                      <p className="text-xs text-muted-foreground">Tables with RLS</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">{securityStats?.totalPolicies || 0}+</div>
                      <p className="text-xs text-muted-foreground">Security Policies</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">{securityStats?.totalUsers || 0}</div>
                      <p className="text-xs text-muted-foreground">Registered Users</p>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Security Overview</CardTitle>
                <CardDescription>Current security status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800 dark:text-green-200">Row Level Security Enabled</p>
                    <p className="text-sm text-green-600 dark:text-green-400">All tables have RLS policies configured</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800 dark:text-green-200">Authentication Configured</p>
                    <p className="text-sm text-green-600 dark:text-green-400">Email confirmation enabled for new signups</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest system events</CardDescription>
              </CardHeader>
              <CardContent>
                {securityLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-12" />)}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {securityStats?.recentLogs.map(log => (
                      <div key={log.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{log.action}</p>
                            <p className="text-sm text-muted-foreground">{log.user_name} • {log.entity}</p>
                          </div>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    ))}
                    {(!securityStats?.recentLogs || securityStats.recentLogs.length === 0) && (
                      <p className="text-muted-foreground text-center py-4">No recent activity</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Security Policies</CardTitle>
                <CardDescription>Platform security configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>JWT Token Expiry</Label>
                  <Input value="24 hours" disabled />
                </div>
                <div className="space-y-2">
                  <Label>Password Policy</Label>
                  <Input value="Minimum 8 characters, 1 uppercase, 1 number" disabled />
                </div>
                <div className="space-y-2">
                  <Label>Session Timeout</Label>
                  <Input value="30 minutes of inactivity" disabled />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
