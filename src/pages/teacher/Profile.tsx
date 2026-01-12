import { Layout } from '@/components/layout/Layout';
import { MyProfilePage } from '@/components/profile/MyProfilePage';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfilePhoto, updateProfilePhoto } from '@/hooks/useUserProfilePhoto';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function TeacherProfile() {
  const { user } = useAuth();
  const { photoUrl, isLoading } = useUserProfilePhoto(user?.id);
  const queryClient = useQueryClient();

  const handlePhotoChange = async (url: string | null) => {
    if (!user?.id) return;
    
    try {
      await updateProfilePhoto(user.id, url);
      queryClient.invalidateQueries({ queryKey: ['user-profile-photo', user.id] });
      toast.success(url ? 'Profile photo updated' : 'Profile photo removed');
    } catch (error) {
      toast.error('Failed to update profile photo');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
          <p className="text-muted-foreground">
            Manage your profile photo and account settings
          </p>
        </div>

        <MyProfilePage
          photoLabel="Profile Photo"
          currentPhotoUrl={isLoading ? undefined : photoUrl}
          onPhotoChange={handlePhotoChange}
        />
      </div>
    </Layout>
  );
}
