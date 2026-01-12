import { Link, useParams } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { OfficerDetails } from '@/services/systemadmin.service';

interface OfficerSidebarProfileProps {
  officer: OfficerDetails;
  collapsed: boolean;
  photoUrl?: string | null;
}

export function OfficerSidebarProfile({ officer, collapsed, photoUrl }: OfficerSidebarProfileProps) {
  // Use photoUrl from database if available, fallback to officer.profile_photo_url
  const displayPhoto = photoUrl || officer.profile_photo_url;
  const { tenantId } = useParams<{ tenantId: string }>();
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const profilePath = tenantId 
    ? `/tenant/${tenantId}/officer/profile`
    : '/officer/profile';

  if (collapsed) {
    // Collapsed view - only show avatar
    return (
      <div className="border-t border-meta-dark-lighter p-2">
        <Avatar className="h-10 w-10 mx-auto">
          <AvatarImage src={displayPhoto} alt={officer.name} />
          <AvatarFallback className="bg-meta-accent text-meta-dark">
            {getInitials(officer.name)}
          </AvatarFallback>
        </Avatar>
      </div>
    );
  }

  // Expanded view - full profile card
  return (
    <div className="border-t border-meta-dark-lighter p-4">
      <Link to={profilePath}>
        <Card className="bg-meta-dark-lighter border-meta-dark-lighter hover:bg-meta-dark transition-colors cursor-pointer">
          <CardContent className="p-4">
            {/* Header with Avatar and Name */}
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={displayPhoto} alt={officer.name} />
                <AvatarFallback className="bg-meta-accent text-meta-dark font-semibold">
                  {getInitials(officer.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {officer.name}
                </p>
                <p className="text-xs text-gray-400">{officer.designation || officer.department || 'Innovation Officer'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
