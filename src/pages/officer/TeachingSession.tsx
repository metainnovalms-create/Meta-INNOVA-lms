import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Menu, Loader2, BookOpen, TrendingUp } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TeachingCourseSidebar } from '@/components/officer/TeachingCourseSidebar';
import { TeachingStudentPanel } from '@/components/officer/TeachingStudentPanel';
import { LMSCourseViewer } from '@/components/student/LMSCourseViewer';
import { getContentSignedUrl } from '@/services/courseStorage.service';
import { PDFViewer } from '@/components/content-viewer/PDFViewer';
import { FullscreenWrapper } from '@/components/content-viewer/FullscreenWrapper';
import { useSessionCompletionStatus } from '@/hooks/useSessionCompletionStatus';

interface ContentItem {
  id: string;
  title: string;
  type: string;
  youtube_url?: string | null;
  file_path?: string | null;
  duration_minutes?: number | null;
}

export default function TeachingSession() {
  const { tenantId, courseId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  
  const classId = searchParams.get('class_id') || '';
  const className = searchParams.get('class_name') || '';
  const classAssignmentId = searchParams.get('assignment_id') || '';

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [selectedSessionAssignmentId, setSelectedSessionAssignmentId] = useState<string | null>(null);
  const [selectedModuleAssignmentId, setSelectedModuleAssignmentId] = useState<string | null>(null);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [contentUrl, setContentUrl] = useState<string | null>(null);
  const [isLoadingContent, setIsLoadingContent] = useState(false);

  // Fetch course details
  const { data: course, isLoading: loadingCourse } = useQuery({
    queryKey: ['teaching-course', courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch module assignments for this class
  const { data: moduleAssignments, isLoading: loadingModules } = useQuery({
    queryKey: ['teaching-module-assignments', classAssignmentId],
    queryFn: async () => {
      if (!classAssignmentId) return [];
      
      const { data, error } = await supabase
        .from('class_module_assignments')
        .select(`
          id,
          module_id,
          is_unlocked,
          unlock_order,
          course_modules (
            id,
            title,
            description,
            display_order
          )
        `)
        .eq('class_assignment_id', classAssignmentId)
        .order('unlock_order');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!classAssignmentId
  });

  // Fetch session assignments
  const { data: sessionAssignments, isLoading: loadingSessions } = useQuery({
    queryKey: ['teaching-session-assignments', moduleAssignments?.map(m => m.id)],
    queryFn: async () => {
      if (!moduleAssignments?.length) return [];
      
      const moduleAssignmentIds = moduleAssignments.map(m => m.id);
      const { data, error } = await supabase
        .from('class_session_assignments')
        .select(`
          id,
          class_module_assignment_id,
          session_id,
          is_unlocked,
          unlock_order,
          course_sessions (
            id,
            title,
            description,
            display_order
          )
        `)
        .in('class_module_assignment_id', moduleAssignmentIds)
        .order('unlock_order');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!moduleAssignments?.length
  });

  // Fetch all content for this course
  const { data: allContent } = useQuery({
    queryKey: ['teaching-course-content', courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_content')
        .select('*')
        .eq('course_id', courseId)
        .order('display_order');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!courseId
  });

  // Get all session IDs for completion status query
  const allSessionIds = useMemo(() => {
    return sessionAssignments?.map(sa => sa.session_id) || [];
  }, [sessionAssignments]);

  // Fetch session completion status
  const { data: completionStatus, refetch: refetchCompletions } = useSessionCompletionStatus(
    classId,
    classAssignmentId,
    allSessionIds
  );

  // Build structured module data with completion status
  const structuredModules = useMemo(() => {
    return moduleAssignments?.map(ma => {
      const moduleSessions = sessionAssignments?.filter(
        sa => sa.class_module_assignment_id === ma.id
      ) || [];

      const sessions = moduleSessions.map(sa => {
        const sessionContent = allContent?.filter(
          c => c.session_id === sa.session_id
        ) || [];

        const completionInfo = completionStatus?.sessionStatuses.get(sa.session_id);

        return {
          id: sa.session_id,
          assignmentId: sa.id,
          title: sa.course_sessions?.title || 'Session',
          description: sa.course_sessions?.description,
          is_unlocked: sa.is_unlocked || false,
          content: sessionContent.map(c => ({
            id: c.id,
            title: c.title,
            type: c.type,
            youtube_url: c.youtube_url,
            file_path: c.file_path,
            duration_minutes: c.duration_minutes
          })),
          isCompleted: completionInfo?.isConducted || false, // Show green tick when conducted
          completedStudents: completionInfo?.completedStudents || 0,
          totalStudents: completionInfo?.totalStudents || 0
        };
      });

      // Count completed sessions in this module
      const completedSessionCount = sessions.filter(s => s.isCompleted).length;

      return {
        id: ma.module_id,
        assignmentId: ma.id,
        title: ma.course_modules?.title || 'Level',
        description: ma.course_modules?.description,
        is_unlocked: ma.is_unlocked || false,
        sessions,
        completedSessionCount
      };
    }) || [];
  }, [moduleAssignments, sessionAssignments, allContent, completionStatus]);

  // Auto-select first available session
  useEffect(() => {
    if (!selectedSessionId && structuredModules.length > 0) {
      const firstUnlockedModule = structuredModules.find(m => m.is_unlocked);
      if (firstUnlockedModule) {
        const firstUnlockedSession = firstUnlockedModule.sessions.find(s => s.is_unlocked);
        if (firstUnlockedSession) {
          setSelectedSessionId(firstUnlockedSession.id);
          setSelectedSessionAssignmentId(firstUnlockedSession.assignmentId);
          setSelectedModuleAssignmentId(firstUnlockedModule.assignmentId);
          
          // Auto-select first content
          if (firstUnlockedSession.content.length > 0) {
            setSelectedContent(firstUnlockedSession.content[0]);
          }
        }
      }
    }
  }, [structuredModules, selectedSessionId]);

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

      if (selectedContent.type === 'pdf' && selectedContent.file_path && !selectedContent.file_path.startsWith('http')) {
        setContentUrl(null);
        setIsLoadingContent(false);
        return;
      }

      if (selectedContent.file_path) {
        if (selectedContent.file_path.startsWith('http')) {
          setContentUrl(selectedContent.file_path);
          setIsLoadingContent(false);
          return;
        }

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

  const handleSessionSelect = (sessionId: string, assignmentId: string, moduleAssignmentId: string) => {
    setSelectedSessionId(sessionId);
    setSelectedSessionAssignmentId(assignmentId);
    setSelectedModuleAssignmentId(moduleAssignmentId);
    
    // Find and select first content in session
    const module = structuredModules.find(m => m.assignmentId === moduleAssignmentId);
    const session = module?.sessions.find(s => s.id === sessionId);
    if (session?.content.length) {
      setSelectedContent(session.content[0]);
    }
  };

  const handleContentSelect = (contentId: string) => {
    const content = allContent?.find(c => c.id === contentId);
    if (content) {
      setSelectedContent({
        id: content.id,
        title: content.title,
        type: content.type,
        youtube_url: content.youtube_url,
        file_path: content.file_path,
        duration_minutes: content.duration_minutes
      });
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
          <p className="text-lg">Select content from the sidebar to start teaching</p>
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
              <BookOpen className="h-16 w-16" />
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

      default:
        return (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Unsupported content type
          </div>
        );
    }
  };

  const isLoading = loadingCourse || loadingModules || loadingSessions;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Course Not Found</h2>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>
    );
  }

  // Get current session info
  const currentModule = structuredModules.find(m => m.assignmentId === selectedModuleAssignmentId);
  const currentSession = currentModule?.sessions.find(s => s.id === selectedSessionId);

  return (
    <div className="flex h-screen bg-background">
      {/* Left Sidebar - Course Navigation */}
      {sidebarOpen && (
        <TeachingCourseSidebar
          courseTitle={course.title}
          courseCode={course.course_code}
          modules={structuredModules}
          selectedSessionId={selectedSessionId}
          selectedContentId={selectedContent?.id || null}
          onSessionSelect={handleSessionSelect}
          onContentSelect={handleContentSelect}
          onClose={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="border-b bg-card px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {!sidebarOpen && (
                <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
                  <Menu className="h-5 w-5" />
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="font-semibold">{course.title}</h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{course.course_code}</span>
                  <span>•</span>
                  <Badge variant="secondary">{className}</Badge>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Course Progress - Levels & Sessions */}
              {structuredModules.length > 0 && (
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Course Progress</p>
                    <div className="flex items-center gap-2">
                      {(() => {
                        const totalLevels = structuredModules.filter(m => m.is_unlocked).length;
                        const completedLevels = structuredModules.filter(
                          m => m.is_unlocked && m.sessions.every(s => s.isCompleted)
                        ).length;
                        const totalSessions = structuredModules.reduce(
                          (acc, m) => acc + m.sessions.filter(s => s.is_unlocked).length, 0
                        );
                        const completedSessions = structuredModules.reduce(
                          (acc, m) => acc + m.sessions.filter(s => s.isCompleted).length, 0
                        );
                        const progressPercent = totalSessions > 0 
                          ? Math.round((completedSessions / totalSessions) * 100) 
                          : 0;
                        
                        return (
                          <>
                            <span className="text-xs text-muted-foreground">
                              {completedLevels}/{totalLevels} Levels • {completedSessions}/{totalSessions} Sessions
                            </span>
                            <Progress value={progressPercent} className="w-20 h-2" />
                            <span className="text-sm font-medium">{progressPercent}%</span>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              )}

              {currentSession && (
                <div className="text-right border-l pl-4">
                  <p className="text-sm font-medium">{currentModule?.title}</p>
                  <p className="text-xs text-muted-foreground">{currentSession.title}</p>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Viewer */}
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 p-4 overflow-auto">
            {renderContentViewer()}
          </div>

          {/* Right Sidebar - Student Panel */}
          <TeachingStudentPanel
            classId={classId}
            sessionId={selectedSessionId}
            classAssignmentId={classAssignmentId}
            onCompletionMarked={() => {
              // Refetch to update completion status
              refetchCompletions();
            }}
          />
        </div>
      </div>
    </div>
  );
}
