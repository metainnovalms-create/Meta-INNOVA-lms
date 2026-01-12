import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Video,
  Link as LinkIcon,
  CheckCircle2,
  Circle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { mockContent, mockSessions } from '@/data/mockCourseData';
import type { CourseModule, CourseContent, CourseSession } from '@/types/course';
import type { ContentCompletion, CourseProgress } from '@/types/contentCompletion';

interface ModuleNavigationSidebarProps {
  modules: CourseModule[];
  courseId: string;
  selectedModuleId: string | null;
  selectedContentId: string | null;
  onModuleSelect: (moduleId: string) => void;
  onContentSelect: (contentId: string, moduleId: string, sessionId: string) => void;
  completions: ContentCompletion[];
  courseProgress: CourseProgress;
}

export function ModuleNavigationSidebar({
  modules,
  courseId,
  selectedModuleId,
  selectedContentId,
  onModuleSelect,
  onContentSelect,
  completions,
  courseProgress,
}: ModuleNavigationSidebarProps) {
  const [openModules, setOpenModules] = useState<string[]>(
    selectedModuleId ? [selectedModuleId] : []
  );
  const [openSessions, setOpenSessions] = useState<string[]>([]);

  const sessions = mockSessions.filter(s => s.course_id === courseId);

  const toggleSession = (sessionId: string) => {
    setOpenSessions(prev =>
      prev.includes(sessionId)
        ? prev.filter(id => id !== sessionId)
        : [...prev, sessionId]
    );
  };

  const toggleModule = (moduleId: string) => {
    setOpenModules(prev =>
      prev.includes(moduleId)
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
    onModuleSelect(moduleId);
  };

  const getContentIcon = (type: CourseContent['type']) => {
    const iconClass = "h-4 w-4";
    switch (type) {
      case 'pdf':
        return <FileText className={iconClass} />;
      case 'video':
      case 'youtube':
        return <Video className={iconClass} />;
      case 'ppt':
        return <FileText className={iconClass} />;
      case 'link':
      case 'simulation':
        return <LinkIcon className={iconClass} />;
      default:
        return <FileText className={iconClass} />;
    }
  };

  const isContentCompleted = (contentId: string) => {
    return completions.some(c => c.content_id === contentId && c.completed);
  };

  const getCompletionTime = (contentId: string) => {
    const completion = completions.find(c => c.content_id === contentId && c.completed);
    if (!completion) return null;
    try {
      return formatDistanceToNow(new Date(completion.completed_at), { addSuffix: true });
    } catch {
      return null;
    }
  };

  return (
    <div className="w-72 border-r bg-muted/30 flex flex-col">
      <div className="p-4 border-b bg-card">
        <h2 className="font-semibold text-lg">Course Content</h2>
        <p className="text-xs text-muted-foreground mt-1">
          {modules.length} modules
        </p>
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-medium">{Math.round(courseProgress.percentage)}%</span>
          </div>
          <Progress value={courseProgress.percentage} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">
            {courseProgress.completed_content} of {courseProgress.total_content} completed
          </p>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {modules
            .sort((a, b) => a.order - b.order)
            .map((module) => {
              const moduleSessions = sessions
                .filter(s => s.module_id === module.id)
                .sort((a, b) => a.order - b.order);
              const isOpen = openModules.includes(module.id);
              const isSelected = selectedModuleId === module.id;
              const moduleProgressData = courseProgress.modules.find(m => m.module_id === module.id);
              const completedCount = moduleProgressData?.completed_content || 0;
              const totalCount = moduleProgressData?.total_content || 0;

              return (
                <Collapsible
                  key={module.id}
                  open={isOpen}
                  onOpenChange={() => toggleModule(module.id)}
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      variant={isSelected ? "secondary" : "ghost"}
                      className="w-full justify-start font-medium"
                    >
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4 mr-2" />
                      ) : (
                        <ChevronRight className="h-4 w-4 mr-2" />
                      )}
                      <span className="flex-1 text-left truncate">
                        {module.title}
                      </span>
                      <div className="flex items-center gap-1">
                        {completedCount === totalCount && totalCount > 0 && (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        )}
                        <Badge variant="outline" className="ml-1">
                          {completedCount}/{totalCount}
                        </Badge>
                      </div>
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="ml-2 mt-1 space-y-1">
                    {moduleSessions.map((session) => {
                      const sessionContents = mockContent
                        .filter(c => c.session_id === session.id)
                        .sort((a, b) => a.order - b.order);
                      const isSessionOpen = openSessions.includes(session.id);
                      const sessionCompletedCount = sessionContents.filter(c => isContentCompleted(c.id)).length;
                      const sessionTotalCount = sessionContents.length;

                      return (
                        <Collapsible
                          key={session.id}
                          open={isSessionOpen}
                          onOpenChange={() => toggleSession(session.id)}
                        >
                          <CollapsibleTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start font-normal text-xs pl-2"
                            >
                              {isSessionOpen ? (
                                <ChevronDown className="h-3 w-3 mr-1" />
                              ) : (
                                <ChevronRight className="h-3 w-3 mr-1" />
                              )}
                              <span className="flex-1 text-left truncate">
                                {session.title}
                              </span>
                              <Badge variant="secondary" className="ml-1 text-xs">
                                {sessionCompletedCount}/{sessionTotalCount}
                              </Badge>
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="ml-4 mt-1 space-y-1">
                            {sessionContents.map((content) => {
                              const isContentSelected = selectedContentId === content.id;
                              const completed = isContentCompleted(content.id);
                              const completionTime = getCompletionTime(content.id);
                              
                              return (
                                <div key={content.id} className="space-y-0.5">
                                  <Button
                                    variant={isContentSelected ? "secondary" : "ghost"}
                                    size="sm"
                                    className="w-full justify-start text-xs"
                                    onClick={() => onContentSelect(content.id, module.id, session.id)}
                                  >
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                      {completed ? (
                                        <CheckCircle2 className="h-3 w-3 text-green-500 flex-shrink-0" />
                                      ) : (
                                        <Circle className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                      )}
                                      {getContentIcon(content.type)}
                                      <span className="truncate flex-1 text-left">
                                        {content.title}
                                      </span>
                                    </div>
                                  </Button>
                                  {completed && completionTime && (
                                    <p className="text-xs text-muted-foreground ml-9 px-2">
                                      Completed {completionTime}
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </CollapsibleContent>
                        </Collapsible>
                      );
                    })}
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
        </div>
      </ScrollArea>
    </div>
  );
}
