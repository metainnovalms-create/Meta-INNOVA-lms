import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Webinar, webinarService } from '@/services/webinar.service';
import { Calendar, User, Play, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface WebinarCardProps {
  webinar: Webinar;
  onView: (webinar: Webinar) => void;
  onEdit?: (webinar: Webinar) => void;
  onDelete?: (webinar: Webinar) => void;
  showActions?: boolean;
}

export function WebinarCard({ webinar, onView, onEdit, onDelete, showActions = false }: WebinarCardProps) {
  const videoId = webinarService.getYouTubeVideoId(webinar.youtube_url);
  const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null;
  const isUpcoming = new Date(webinar.webinar_date) > new Date();

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => onView(webinar)}>
      <div className="relative aspect-video bg-muted">
        {thumbnailUrl ? (
          <img 
            src={thumbnailUrl} 
            alt={webinar.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to medium quality thumbnail
              const target = e.target as HTMLImageElement;
              if (videoId) {
                target.src = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
              }
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Play className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="bg-primary rounded-full p-4">
            <Play className="h-8 w-8 text-primary-foreground" />
          </div>
        </div>
        {isUpcoming && (
          <Badge className="absolute top-2 left-2" variant="secondary">
            Upcoming
          </Badge>
        )}
      </div>
      
      <CardHeader className="pb-2">
        <CardTitle className="text-lg line-clamp-2">{webinar.title}</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {webinar.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{webinar.description}</p>
        )}
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>{format(new Date(webinar.webinar_date), 'PPP')}</span>
        </div>
        
        {webinar.guest_name && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span>{webinar.guest_name}</span>
          </div>
        )}
        
        {showActions && (onEdit || onDelete) && (
          <div className="flex gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
            {onEdit && (
              <Button size="sm" variant="outline" onClick={() => onEdit(webinar)}>
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
            )}
            {onDelete && (
              <Button size="sm" variant="destructive" onClick={() => onDelete(webinar)}>
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
