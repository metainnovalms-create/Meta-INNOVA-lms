import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ProfilePhotoUpload } from './ProfilePhotoUpload';
import { AccountSettingsSection } from '@/components/settings/AccountSettingsSection';

interface MyProfilePageProps {
  photoLabel?: string;
  currentPhotoUrl?: string | null;
  onPhotoChange?: (newUrl: string | null) => void;
  additionalInfo?: React.ReactNode;
}

export function MyProfilePage({
  photoLabel = 'Profile Photo',
  currentPhotoUrl,
  onPhotoChange,
  additionalInfo,
}: MyProfilePageProps) {
  const { user } = useAuth();

  if (!user) return null;

  const formatRole = (role: string) => {
    return role
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="space-y-6">
      {/* Profile Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Information
          </CardTitle>
          <CardDescription>
            Manage your profile photo and view account details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Photo Upload */}
          <ProfilePhotoUpload
            currentPhotoUrl={currentPhotoUrl}
            userId={user.id}
            userName={user.name || 'User'}
            label={photoLabel}
            onPhotoChange={onPhotoChange}
          />

          {/* User Information */}
          <div className="grid gap-4 md:grid-cols-2 pt-4 border-t">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{user.name || 'N/A'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{user.email || 'N/A'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Role</p>
              <Badge variant="outline" className="capitalize">
                {formatRole(user.role || 'user')}
              </Badge>
            </div>
            {user.position_name && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Position</p>
                <Badge variant="secondary" className="capitalize">
                  {formatRole(user.position_name)}
                </Badge>
              </div>
            )}
          </div>

          {/* Additional Info */}
          {additionalInfo}
        </CardContent>
      </Card>

      {/* Password Management */}
      <AccountSettingsSection showAccountInfo={false} />
    </div>
  );
}
