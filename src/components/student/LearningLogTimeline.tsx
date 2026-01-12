import { StudentContentCompletion } from '@/types/contentCompletion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, Clock, Users, BookOpen, CheckCircle, Video, FileText, Link as LinkIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Props {
  completions: StudentContentCompletion[];
}

export function LearningLogTimeline({ completions }: Props) {
  // Group completions by date
  const groupedByDate = completions.reduce((acc, completion) => {
    const date = new Date(completion.completed_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(completion);
    return acc;
  }, {} as Record<string, StudentContentCompletion[]>);

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'video':
      case 'youtube':
        return <Video className="h-4 w-4" />;
      case 'pdf':
        return <FileText className="h-4 w-4" />;
      case 'ppt':
        return <FileText className="h-4 w-4" />;
      case 'link':
      case 'simulation':
        return <LinkIcon className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (completions.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="font-medium">No learning records yet</p>
        <p className="text-sm mt-2">Complete sessions to see your progress here</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {Object.entries(groupedByDate).map(([date, items]) => (
        <div key={date} className="relative">
          {/* Date Header */}
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-4 w-4 text-primary" />
            <h3 className="font-semibold">{date}</h3>
            <Badge variant="secondary">{items.length} item{items.length !== 1 ? 's' : ''}</Badge>
          </div>

          {/* Timeline Items */}
          <div className="space-y-4 pl-6 border-l-2 border-border">
            {items.map((completion) => (
              <div key={completion.id} className="relative pb-4">
                {/* Timeline Dot */}
                <div className="absolute -left-[25px] top-2 h-4 w-4 rounded-full bg-primary border-4 border-background" />

                {/* Content Card */}
                <Card className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="text-primary">
                          {getContentIcon(completion.content_type)}
                        </div>
                        <h4 className="font-medium">{completion.content_title}</h4>
                        <Badge variant="outline" className="text-xs">
                          {completion.content_type}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-2">
                        Level: {completion.module_title}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>Taught by: <span className="font-medium">{completion.officer_name}</span></span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatTime(completion.completed_at)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span>Class: {completion.class_name}</span>
                        </div>
                      </div>
                    </div>

                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 ml-4" />
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
