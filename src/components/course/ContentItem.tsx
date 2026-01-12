import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Presentation, Video, Play, Gamepad2, Link as LinkIcon, Edit, Trash2 } from 'lucide-react';
import { CourseContent, ContentType } from '@/types/course';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface ContentItemProps {
  content: CourseContent;
  onEdit: (content: CourseContent) => void;
  onDelete: (contentId: string) => void;
}

export function ContentItem({ content, onEdit, onDelete }: ContentItemProps) {
  const getContentIcon = (type: ContentType) => {
    const iconMap = {
      pdf: <FileText className="h-6 w-6" />,
      ppt: <Presentation className="h-6 w-6" />,
      video: <Video className="h-6 w-6" />,
      youtube: <Play className="h-6 w-6" />,
      simulation: <Gamepad2 className="h-6 w-6" />,
      link: <LinkIcon className="h-6 w-6" />
    };
    return iconMap[type] || <FileText className="h-6 w-6" />;
  };

  const formatFileSize = (mb?: number) => {
    if (!mb) return null;
    if (mb < 1) return `${(mb * 1024).toFixed(0)} KB`;
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-lg">
            {getContentIcon(content.type)}
          </div>
          <div>
            <h4 className="font-medium">{content.title}</h4>
            <div className="flex gap-4 text-sm text-muted-foreground mt-1">
              {content.duration_minutes && <span>⏱️ {content.duration_minutes} min</span>}
              {content.file_size_mb && <span>📦 {formatFileSize(content.file_size_mb)}</span>}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => onEdit(content)}>
            <Edit className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Content?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{content.title}"? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(content.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </Card>
  );
}
