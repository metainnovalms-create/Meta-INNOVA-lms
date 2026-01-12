import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SchoolTeacher } from '@/types/teacher';
import { GraduationCap, Clock } from 'lucide-react';
import { TeacherDetailsDialog } from './TeacherDetailsDialog';

interface TeacherSidebarProfileProps {
  teacher: SchoolTeacher;
  collapsed: boolean;
  photoUrl?: string | null;
}

export function TeacherSidebarProfile({ teacher, collapsed, photoUrl }: TeacherSidebarProfileProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'on_leave':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'inactive':
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  if (collapsed) {
    // Collapsed view - only show avatar
    return (
      <>
        <div className="border-t border-meta-dark-lighter p-2">
          <Avatar 
            className="h-10 w-10 mx-auto cursor-pointer hover:ring-2 hover:ring-meta-accent transition-all" 
            onClick={() => setDialogOpen(true)}
          >
            {photoUrl ? (
              <AvatarImage src={photoUrl} alt={teacher.name} />
            ) : null}
            <AvatarFallback className="bg-meta-accent text-meta-dark font-semibold">
              {getInitials(teacher.name)}
            </AvatarFallback>
          </Avatar>
        </div>
        <TeacherDetailsDialog
          teacher={teacher}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />
      </>
    );
  }

  // Expanded view - full profile card
  return (
    <>
      <div className="border-t border-meta-dark-lighter p-4">
        <Card 
          className="bg-meta-dark-lighter border-meta-dark-lighter hover:bg-meta-dark transition-colors cursor-pointer hover:shadow-lg" 
          onClick={() => setDialogOpen(true)}
        >
          <CardContent className="p-4 space-y-3">
          {/* Header with Avatar and Name */}
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              {photoUrl ? (
                <AvatarImage src={photoUrl} alt={teacher.name} />
              ) : null}
              <AvatarFallback className="bg-meta-accent text-meta-dark font-semibold">
                {getInitials(teacher.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {teacher.name}
              </p>
              <p className="text-xs text-gray-400">{teacher.employee_id}</p>
            </div>
          </div>

          {/* Primary Subject Badge */}
          <div className="flex items-center gap-2">
            <GraduationCap className="h-3 w-3 text-blue-400" />
            <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-xs">
              {teacher.subjects[0]}
            </Badge>
          </div>

          {/* Experience & Status */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 text-gray-400">
              <Clock className="h-3 w-3" />
              <span>{teacher.experience_years} years</span>
            </div>
            <Badge variant="outline" className={getStatusColor(teacher.status)}>
              {teacher.status.replace('_', ' ')}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
    <TeacherDetailsDialog
      teacher={teacher}
      open={dialogOpen}
      onOpenChange={setDialogOpen}
    />
  </>
  );
}
