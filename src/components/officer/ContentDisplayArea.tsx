import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  ExternalLink,
  FileText,
  Video,
  Link as LinkIcon,
  CheckCircle2,
  Circle
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { CourseContent, CourseModule } from '@/types/course';
import { FullscreenWrapper } from '@/components/content-viewer/FullscreenWrapper';

interface ContentDisplayAreaProps {
  content: CourseContent | undefined;
  module: CourseModule | undefined;
  isPresentationMode: boolean;
  onNavigate: (direction: 'prev' | 'next') => void;
  onExitPresentation?: () => void;
  onMarkComplete: (contentId: string, moduleId: string, watchPercentage?: number) => void;
  isCompleted: boolean;
  completedAt?: string;
  onCheckAutoComplete?: () => boolean;
}

export function ContentDisplayArea({
  content,
  module,
  isPresentationMode,
  onNavigate,
  onMarkComplete,
  isCompleted,
  completedAt,
  onCheckAutoComplete,
}: ContentDisplayAreaProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const viewStartTime = useRef<number>(Date.now());
  const [videoWatchPercentage, setVideoWatchPercentage] = useState(0);
  const [hasAutoCompleted, setHasAutoCompleted] = useState(false);

  // Reset view tracking when content changes
  useEffect(() => {
    setHasAutoCompleted(false);
    setVideoWatchPercentage(0);
    viewStartTime.current = Date.now();
  }, [content?.id]);

  // Check if content should be auto-completed based on viewing time
  const shouldAutoComplete = (): boolean => {
    if (!content || isCompleted || hasAutoCompleted) return false;
    
    const viewDuration = (Date.now() - viewStartTime.current) / 1000; // in seconds
    
    switch (content.type) {
      case 'video':
        // Auto-complete if 90%+ watched OR viewed for 80%+ of duration
        return videoWatchPercentage >= 90 || 
               (content.duration_minutes ? viewDuration >= content.duration_minutes * 60 * 0.8 : false);
      case 'pdf':
        return viewDuration >= 30;
      case 'youtube':
        return viewDuration >= 60;
      case 'ppt':
        return viewDuration >= 45;
      case 'link':
      case 'simulation':
        return viewDuration >= 20;
      default:
        return viewDuration >= 10;
    }
  };

  // Expose auto-complete check to parent
  useEffect(() => {
    if (onCheckAutoComplete) {
      // Create a function that can be called from parent
      (window as any).__checkAutoComplete = shouldAutoComplete;
    }
  }, [content, isCompleted, hasAutoCompleted, videoWatchPercentage, onCheckAutoComplete]);

  // Track video progress
  useEffect(() => {
    const video = videoRef.current;
    if (!video || content?.type !== 'video') return;

    const handleTimeUpdate = () => {
      const percentage = (video.currentTime / video.duration) * 100;
      setVideoWatchPercentage(percentage);

      // Auto-complete at 90%
      if (percentage >= 90 && !isCompleted && !hasAutoCompleted && content && module) {
        setHasAutoCompleted(true);
        onMarkComplete(content.id, module.id, percentage);
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [content, module, isCompleted, hasAutoCompleted, onMarkComplete]);
  if (!content) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/20">
        <div className="text-center space-y-4">
          <FileText className="h-16 w-16 mx-auto text-muted-foreground" />
          <div>
            <h3 className="text-lg font-semibold">No Content Selected</h3>
            <p className="text-sm text-muted-foreground">
              Select a lesson from the sidebar to begin
            </p>
          </div>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    const contentUrl = content.file_url || content.youtube_url || content.external_url || '';
    
    switch (content.type) {
      case 'pdf':
        return (
          <div className="w-full h-full bg-white rounded-lg">
            <iframe
              src={content.file_url || `https://docs.google.com/viewer?url=${encodeURIComponent(contentUrl)}&embedded=true`}
              className="w-full h-full rounded-lg"
              title={content.title}
            />
          </div>
        );

      case 'video':
        return (
          <FullscreenWrapper className="w-full aspect-video">
            <video
              ref={videoRef}
              src={content.file_url}
              controls
              className="w-full h-full rounded-lg bg-black"
            >
              Your browser does not support video playback.
            </video>
          </FullscreenWrapper>
        );

      case 'youtube':
        const videoId = extractYouTubeId(content.youtube_url || '');
        return (
          <FullscreenWrapper className="w-full aspect-video">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}`}
              className="w-full h-full rounded-lg bg-black"
              title={content.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </FullscreenWrapper>
        );

      case 'ppt':
        return (
          <div className="w-full h-full bg-white rounded-lg">
            <iframe
              src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(content.file_url || '')}`}
              className="w-full h-full rounded-lg"
              title={content.title}
            />
          </div>
        );

      case 'link':
      case 'simulation':
        return (
          <div className="w-full h-full bg-white rounded-lg">
            <iframe
              src={content.external_url}
              className="w-full h-full rounded-lg"
              title={content.title}
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        );

      default:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Content Not Available</CardTitle>
              <CardDescription>
                This content type is not yet supported in the viewer
              </CardDescription>
            </CardHeader>
          </Card>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-muted/10 relative">
      {/* Completion Badge in Presentation Mode */}
      {isPresentationMode && isCompleted && (
        <div className="absolute top-4 right-4 z-10">
          <Badge variant="secondary" className="bg-green-500/90 text-white shadow-lg">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        </div>
      )}

      {/* Content Header */}
      {!isPresentationMode && (
        <div className="border-b bg-card p-4">
          {/* Completion Status */}
          {isCompleted && completedAt && (
            <Alert className="mb-4 bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-800 dark:text-green-300">
                Completed on {format(parseISO(completedAt), 'MMMM d, yyyy \'at\' h:mm a')}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="capitalize">
                  {content.type}
                </Badge>
                {isCompleted && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Completed
                  </Badge>
                )}
              </div>
              <h2 className="text-xl font-semibold mb-1">{content.title}</h2>
              {module && (
                <p className="text-sm text-muted-foreground">
                  Level: {module.title}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {(content.file_url || content.youtube_url || content.external_url) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(content.file_url || content.youtube_url || content.external_url, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open
                </Button>
              )}
              {content.file_url && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = content.file_url!;
                    link.download = content.title;
                    link.click();
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Content Display */}
      <div className={`flex-1 ${isPresentationMode ? 'p-8' : 'p-6'} overflow-auto`}>
        {renderContent()}
      </div>

      {/* Navigation Footer */}
      {!isPresentationMode && (
        <div className="border-t bg-card p-4">
          <div className="flex items-center justify-between gap-4">
            <Button
              variant="outline"
              onClick={() => onNavigate('prev')}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            
            <div className="flex items-center gap-3">
              {content.duration_minutes && (
                <span className="text-sm text-muted-foreground">
                  {content.duration_minutes} min
                </span>
              )}
              {!isCompleted && content && module && (
                <Button
                  onClick={() => onMarkComplete(content.id, module.id, videoWatchPercentage || undefined)}
                  variant="default"
                  size="sm"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Mark as Complete
                </Button>
              )}
            </div>

            <Button
              variant="outline"
              onClick={() => onNavigate('next')}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function extractYouTubeId(url: string): string {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/,
    /youtube\.com\/embed\/([^&\s]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  
  return url;
}
