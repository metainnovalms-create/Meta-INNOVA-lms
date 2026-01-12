import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface SidebarProfileCardProps {
  userName: string;
  photoUrl: string | null;
  subtitle?: string;
  profilePath: string;
  collapsed: boolean;
}

export function SidebarProfileCard({
  userName,
  photoUrl,
  subtitle,
  profilePath,
  collapsed,
}: SidebarProfileCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (collapsed) {
    return (
      <div className="p-2">
        <Link to={profilePath}>
          <Avatar className="h-10 w-10 mx-auto cursor-pointer hover:ring-2 hover:ring-meta-accent transition-all">
            {photoUrl ? (
              <AvatarImage src={photoUrl} alt={userName} />
            ) : null}
            <AvatarFallback className="bg-meta-accent text-meta-dark font-semibold">
              {getInitials(userName)}
            </AvatarFallback>
          </Avatar>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4">
      <Link 
        to={profilePath}
        className="flex items-center gap-3 p-2 rounded-lg hover:bg-meta-dark-lighter transition-colors cursor-pointer"
      >
        <Avatar className="h-10 w-10">
          {photoUrl ? (
            <AvatarImage src={photoUrl} alt={userName} />
          ) : null}
          <AvatarFallback className="bg-meta-accent text-meta-dark font-semibold">
            {getInitials(userName)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{userName}</p>
          {subtitle && (
            <p className="text-xs text-gray-400 truncate">{subtitle}</p>
          )}
        </div>
      </Link>
    </div>
  );
}
