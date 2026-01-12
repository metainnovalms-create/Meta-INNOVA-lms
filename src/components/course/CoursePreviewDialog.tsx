import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  ChevronLeft,
  ChevronRight,
  Layers,
  PlayCircle,
  FileText,
  Video,
  Link as LinkIcon,
  Youtube,
  BookOpen,
  ExternalLink,
  Menu,
  X,
  Loader2,
} from 'lucide-react';
import { CourseWithStructure } from '@/hooks/useCourses';
import { PDFViewer } from '@/components/content-viewer/PDFViewer';
import { FullscreenWrapper } from '@/components/content-viewer/FullscreenWrapper';
import { getContentSignedUrl } from '@/services/courseStorage.service';

interface CoursePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: CourseWithStructure | null;
}

interface ContentItem {
  id: string;
  title: string;
  type: string;
  youtube_url?: string | null;
  file_path?: string | null;
  duration_minutes?: number | null;
}

export function CoursePreviewDialog({ open, onOpenChange, course }: CoursePreviewDialogProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [contentUrl, setContentUrl] = useState<string | null>(null);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());

  const modules = course?.modules || [];

  // Flatten content for navigation
  const allContent = modules.flatMap(m => 
    (m.sessions || []).flatMap(s => 
      (s.content || []).map(c => ({
        ...c,
        moduleId: m.id,
        sessionId: s.id,
        moduleTitle: m.title,
        sessionTitle: s.title
      }))
    )
  );

  const currentIndex = allContent.findIndex(c => c.id === selectedContent?.id);
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < allContent.length - 1;

  // Auto-expand first module and session, select first content
  useEffect(() => {
    if (open && modules.length > 0 && !selectedContent) {
      const firstModule = modules[0];
      if (firstModule) {
        setExpandedModules(new Set([firstModule.id]));
        if (firstModule.sessions && firstModule.sessions.length > 0) {
          const firstSession = firstModule.sessions[0];
          setExpandedSessions(new Set([firstSession.id]));
          if (firstSession.content && firstSession.content.length > 0) {
            handleSelectContent(firstSession.content[0]);
          }
        }
      }
    }
  }, [open, modules]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedContent(null);
      setContentUrl(null);
      setExpandedModules(new Set());
      setExpandedSessions(new Set());
    }
  }, [open]);

  // Load content URL when content changes
  useEffect(() => {
    const loadContentUrl = async () => {
      if (!selectedContent) {
        setContentUrl(null);
        return;
      }

      setIsLoadingContent(true);

      if (selectedContent.type === 'youtube') {
        setContentUrl(selectedContent.youtube_url || null);
        setIsLoadingContent(false);
        return;
      }

      // PDFs are rendered via our in-app PDFViewer (downloads via SDK), so no signed URL needed.
      if (selectedContent.type === 'pdf' && selectedContent.file_path && !selectedContent.file_path.startsWith('http')) {
        setContentUrl(null);
        setIsLoadingContent(false);
        return;
      }

      if (selectedContent.file_path) {
        // Check if it's already a URL
        if (selectedContent.file_path.startsWith('http')) {
          setContentUrl(selectedContent.file_path);
          setIsLoadingContent(false);
          return;
        }
        
        // Get signed URL from storage
        try {
          const signedUrl = await getContentSignedUrl(selectedContent.file_path, 3600);
          setContentUrl(signedUrl);
        } catch (error) {
          console.error('Failed to get signed URL:', error);
          setContentUrl(null);
        }
      }

      setIsLoadingContent(false);
    };

    loadContentUrl();
  }, [selectedContent]);

  const handleSelectContent = (content: ContentItem) => {
    setSelectedContent(content);
  };

  const handlePrevious = () => {
    if (hasPrevious) {
      handleSelectContent(allContent[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (hasNext) {
      handleSelectContent(allContent[currentIndex + 1]);
    }
  };

  const toggleModule = (moduleId: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  const toggleSession = (sessionId: string) => {
    const newExpanded = new Set(expandedSessions);
    if (newExpanded.has(sessionId)) {
      newExpanded.delete(sessionId);
    } else {
      newExpanded.add(sessionId);
    }
    setExpandedSessions(newExpanded);
  };

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'youtube':
        return <Youtube className="h-4 w-4" />;
      case 'pdf':
      case 'ppt':
        return <FileText className="h-4 w-4" />;
      case 'link':
      case 'simulation':
        return <LinkIcon className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const extractYouTubeId = (url?: string | null) => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? match[1] : null;
  };

  const renderContentViewer = () => {
    if (!selectedContent) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
          <BookOpen className="h-16 w-16 mb-4" />
          <p className="text-lg">Select content from the sidebar to preview</p>
        </div>
      );
    }

    if (isLoadingContent) {
      return (
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    switch (selectedContent.type) {
      case 'youtube':
        const youtubeId = extractYouTubeId(contentUrl);
        return youtubeId ? (
          <FullscreenWrapper className="w-full h-full">
            <iframe
              src={`https://www.youtube.com/embed/${youtubeId}?rel=0`}
              className="w-full h-full rounded-lg"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              title={selectedContent.title}
            />
          </FullscreenWrapper>
        ) : (
          <div className="flex items-center justify-center h-full text-destructive">
            Invalid YouTube URL
          </div>
        );

      case 'video':
        return contentUrl ? (
          <FullscreenWrapper className="w-full h-full">
            <video
              controls
              className="w-full h-full rounded-lg bg-black"
              src={contentUrl}
            >
              Your browser does not support the video tag.
            </video>
          </FullscreenWrapper>
        ) : (
          <div className="flex items-center justify-center h-full text-destructive">
            Video not available
          </div>
        );

      case 'pdf':
        if (!selectedContent.file_path) {
          return (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4">
              <FileText className="h-16 w-16" />
              <p className="text-lg font-medium">PDF Not Uploaded Yet</p>
            </div>
          );
        }

        if (!selectedContent.file_path.startsWith('http')) {
          return (
            <div className="h-full">
              <PDFViewer filePath={selectedContent.file_path} title={selectedContent.title} />
            </div>
          );
        }

        return (
          <iframe
            src={selectedContent.file_path}
            className="w-full h-full rounded-lg bg-card"
            title={selectedContent.title}
          />
        );

      case 'ppt':
        if (!selectedContent.file_path) {
          return (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4">
              <FileText className="h-16 w-16" />
              <p className="text-lg font-medium">Presentation Not Uploaded Yet</p>
            </div>
          );
        }

        return contentUrl ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4">
            <FileText className="h-16 w-16" />
            <p className="text-lg font-medium">Open Presentation</p>
            <Button asChild>
              <a href={contentUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Open in new tab
              </a>
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p>Loading presentation...</p>
          </div>
        );

      case 'link':
      case 'simulation':
        return (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <ExternalLink className="h-16 w-16 text-muted-foreground" />
            <p className="text-lg">External Resource</p>
            <Button asChild>
              <a href={contentUrl || '#'} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Open Link
              </a>
            </Button>
          </div>
        );

      default:
        return (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Unsupported content type
          </div>
        );
    }
  };

  if (!course) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-full h-[90vh] p-0 gap-0">
        <div className="flex h-full bg-background">
          {/* Sidebar */}
          <div 
            className={cn(
              "border-r bg-card transition-all duration-300 flex flex-col",
              sidebarOpen ? "w-72 md:w-80" : "w-0 overflow-hidden"
            )}
          >
            <div className="p-3 md:p-4 border-b flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold text-base md:text-lg line-clamp-2 break-words">{course.title}</h2>
                <p className="text-xs md:text-sm text-muted-foreground">{course.course_code}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)} className="shrink-0">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-2">
                {modules.map((module, moduleIdx) => {
                  const sessions = module.sessions || [];
                  const isModuleExpanded = expandedModules.has(module.id);

                  return (
                    <div key={module.id} className="mb-2">
                      <button
                        onClick={() => toggleModule(module.id)}
                        className="w-full flex items-center gap-2 p-3 rounded-lg text-left hover:bg-accent"
                      >
                        <Layers className="h-4 w-4 shrink-0 text-primary" />
                        <span className="flex-1 font-medium text-sm break-words whitespace-normal">
                          {module.title}
                        </span>
                        <ChevronRight 
                          className={cn(
                            "h-4 w-4 shrink-0 transition-transform",
                            isModuleExpanded && "rotate-90"
                          )} 
                        />
                      </button>

                      {isModuleExpanded && (
                        <div className="ml-4 border-l pl-2">
                          {sessions.map((session, sessionIdx) => {
                            const contentItems = session.content || [];
                            const isSessionExpanded = expandedSessions.has(session.id);

                            return (
                              <div key={session.id} className="mb-1">
                                <button
                                  onClick={() => toggleSession(session.id)}
                                  className="w-full flex items-center gap-2 p-2 rounded-lg text-left hover:bg-accent"
                                >
                                  <PlayCircle className="h-4 w-4 shrink-0 text-muted-foreground" />
                                  <span className="flex-1 text-sm break-words whitespace-normal">
                                    {session.title}
                                  </span>
                                  <ChevronRight 
                                    className={cn(
                                      "h-4 w-4 shrink-0 transition-transform",
                                      isSessionExpanded && "rotate-90"
                                    )} 
                                  />
                                </button>

                                {isSessionExpanded && (
                                  <div className="ml-4 space-y-1">
                                    {contentItems.map((content) => (
                                      <button
                                        key={content.id}
                                        onClick={() => handleSelectContent(content)}
                                        className={cn(
                                          "w-full flex items-center gap-2 p-2 rounded-lg text-left text-sm",
                                          selectedContent?.id === content.id 
                                            ? "bg-primary text-primary-foreground" 
                                            : "hover:bg-accent"
                                        )}
                                      >
                                        {getContentIcon(content.type)}
                                        <span className="flex-1 break-words whitespace-normal">{content.title}</span>
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            <div className="p-4 border-t">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => onOpenChange(false)}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Close Preview
              </Button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Header */}
            <div className="h-14 border-b bg-card px-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {!sidebarOpen && (
                  <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
                    <Menu className="h-5 w-5" />
                  </Button>
                )}
                {selectedContent && (
                  <div className="flex items-center gap-2 text-sm">
                    {getContentIcon(selectedContent.type)}
                    <span className="font-medium truncate max-w-[200px] md:max-w-[400px]">
                      {selectedContent.title}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {currentIndex + 1} / {allContent.length}
                </span>
              </div>
            </div>

            {/* Content Viewer */}
            <div className="flex-1 overflow-hidden p-4 bg-background">
              <div className="h-full rounded-lg border bg-card overflow-hidden">
                {renderContentViewer()}
              </div>
            </div>

            {/* Navigation Footer */}
            <div className="h-16 border-t bg-card px-4 flex items-center justify-center gap-4">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={!hasPrevious}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={handleNext}
                disabled={!hasNext}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
