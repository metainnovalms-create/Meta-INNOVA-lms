import { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import { getContentSignedUrl } from '@/services/courseStorage.service';
import { DbCourseContent } from '@/hooks/useCourses';
import { PDFViewer } from './PDFViewer';

interface SecureContentViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content: DbCourseContent | null;
  isCompleted?: boolean;
  onMarkComplete?: () => void;
}

export function SecureContentViewer({
  open,
  onOpenChange,
  content,
  isCompleted = false,
  onMarkComplete
}: SecureContentViewerProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasViewed, setHasViewed] = useState(false);
  const viewStartTime = useRef<number>(Date.now());
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Fetch signed URL when content changes (only needed for PPT)
  useEffect(() => {
    if (!open || !content) return;

    setError(null);

    if (content.type === 'ppt' && content.file_path) {
      setLoading(true);
      getContentSignedUrl(content.file_path)
        .then((url) => {
          setSignedUrl(url);
          setLoading(false);
        })
        .catch(() => {
          setError('Failed to load content');
          setLoading(false);
        });
      return;
    }

    // PDFs are rendered via in-app viewer (no signed URL needed)
    setSignedUrl(null);
    setLoading(false);
  }, [open, content?.id, content?.type, content?.file_path]);


  // Reset viewed state when dialog opens
  useEffect(() => {
    if (open) {
      viewStartTime.current = Date.now();
      setHasViewed(false);
    }
  }, [open, content?.id]);

  // Auto-mark as viewed after 10 seconds for non-video content
  useEffect(() => {
    if (open && content && content.type !== 'youtube') {
      const timer = setTimeout(() => {
        setHasViewed(true);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [open, content]);

  // Prevent right-click context menu
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    return false;
  }, []);

  // Prevent keyboard shortcuts for printing/saving
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Block Ctrl+P (print), Ctrl+S (save), Ctrl+Shift+S
      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 's' || e.key === 'P' || e.key === 'S')) {
        e.preventDefault();
        return false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  if (!content) return null;

  const handleMarkComplete = () => {
    onMarkComplete?.();
    setHasViewed(true);
  };

  const extractYouTubeId = (url?: string | null) => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? match[1] : null;
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <p className="text-destructive">{error}</p>
        </div>
      );
    }

    switch (content.type) {
      case 'youtube': {
        const youtubeId = extractYouTubeId(content.youtube_url);
        if (!youtubeId) {
          return <p className="text-destructive">Invalid YouTube URL</p>;
        }
        return (
          <div 
            className="relative aspect-video"
            onContextMenu={handleContextMenu}
          >
            <iframe
              src={`https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1&disablekb=0`}
              className="w-full h-full rounded-lg"
              allowFullScreen
              title={content.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>
        );
      }

      case 'pdf':
        if (!content.file_path) {
          return <p className="text-destructive">PDF file not available</p>;
        }
        // Use react-pdf with blob data to bypass CORS restrictions
        return <PDFViewer filePath={content.file_path} title={content.title} />;

      case 'ppt':
        if (!signedUrl) {
          return <p className="text-destructive">Presentation URL not available</p>;
        }
        // Office Online viewer doesn't work with signed URLs from private storage
        // Provide a button to open the presentation in a new tab
        return (
          <div 
            className="flex flex-col items-center justify-center h-[50vh] gap-6 select-none"
            onContextMenu={handleContextMenu}
            style={{ userSelect: 'none' }}
          >
            <div className="text-center space-y-2">
              <h3 className="text-lg font-medium">{content.title}</h3>
              <p className="text-muted-foreground text-sm">
                PowerPoint presentations open in a new tab for the best viewing experience.
              </p>
            </div>
            <Button
              size="lg"
              onClick={() => window.open(signedUrl, '_blank', 'noopener,noreferrer')}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Open Presentation
            </Button>
          </div>
        );

      default:
        return <p className="text-muted-foreground">Unsupported content type</p>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-6xl max-h-[95vh] overflow-y-auto"
        onContextMenu={handleContextMenu}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between pr-8">
            <span>{content.title}</span>
            {isCompleted && (
              <CheckCircle className="h-5 w-5 text-green-600" />
            )}
          </DialogTitle>
        </DialogHeader>

        <div 
          className="space-y-4 select-none" 
          style={{ userSelect: 'none' }}
        >
          {renderContent()}

          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {hasViewed ? (
                <span className="text-green-600">✓ Content viewed</span>
              ) : (
                <span>Keep viewing to mark as complete</span>
              )}
            </div>

            {!isCompleted && onMarkComplete && (
              <Button
                onClick={handleMarkComplete}
                disabled={!hasViewed}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Mark as Complete
              </Button>
            )}
          </div>
        </div>

        {/* Disable print styles */}
        <style>{`
          @media print {
            body * {
              display: none !important;
            }
            body::before {
              content: "Printing is not allowed for this content.";
              display: block;
              font-size: 24px;
              padding: 50px;
              text-align: center;
            }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
}
