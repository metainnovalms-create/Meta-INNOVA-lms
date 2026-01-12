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
  Layers,
  Lock,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { CourseModule, CourseContent, CourseSession } from '@/types/course';
import type { ContentCompletion, CourseProgress } from '@/types/contentCompletion';
import { getSessionsByLevel, getContentBySession } from '@/utils/courseDataHelpers';

interface LevelNavigationSidebarProps {
  levels: CourseModule[];
  courseId: string;
  selectedLevelId: string | null;
  selectedContentId: string | null;
  onLevelSelect: (levelId: string) => void;
  onContentSelect: (contentId: string, levelId: string, sessionId: string) => void;
  completions: ContentCompletion[];
  courseProgress: CourseProgress;
  accessibleLevelCount?: number; // Number of levels accessible to the current class
}

export function LevelNavigationSidebar({
  levels,
  courseId,
  selectedLevelId,
  selectedContentId,
  onLevelSelect,
  onContentSelect,
  completions,
  courseProgress,
  accessibleLevelCount,
}: LevelNavigationSidebarProps) {
  const [openLevels, setOpenLevels] = useState<string[]>(
    selectedLevelId ? [selectedLevelId] : []
  );
  const [openSessions, setOpenSessions] = useState<string[]>([]);

  const toggleSession = (sessionId: string) => {
    setOpenSessions(prev =>
      prev.includes(sessionId)
        ? prev.filter(id => id !== sessionId)
        : [...prev, sessionId]
    );
  };

  const toggleLevel = (levelId: string) => {
    setOpenLevels(prev =>
      prev.includes(levelId)
        ? prev.filter(id => id !== levelId)
        : [...prev, levelId]
    );
    onLevelSelect(levelId);
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

  const isLevelAccessible = (levelOrder: number) => {
    if (!accessibleLevelCount) return true;
    return levelOrder <= accessibleLevelCount;
  };

  return (
    <div className="w-72 border-r bg-muted/30 flex flex-col">
      <div className="p-4 border-b bg-card">
        <h2 className="font-semibold text-lg">Course Content</h2>
        <p className="text-xs text-muted-foreground mt-1">
          {levels.length} levels
          {accessibleLevelCount && accessibleLevelCount < levels.length && (
            <span className="ml-1">• {accessibleLevelCount} accessible</span>
          )}
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
          {levels
            .sort((a, b) => a.order - b.order)
            .map((level) => {
              const levelSessions = getSessionsByLevel(level.id);
              const isOpen = openLevels.includes(level.id);
              const isSelected = selectedLevelId === level.id;
              const levelProgressData = courseProgress.modules.find(m => m.module_id === level.id);
              const completedCount = levelProgressData?.completed_content || 0;
              const totalCount = levelProgressData?.total_content || 0;
              const isAccessible = isLevelAccessible(level.order);

              return (
                <Collapsible
                  key={level.id}
                  open={isOpen && isAccessible}
                  onOpenChange={() => isAccessible && toggleLevel(level.id)}
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      variant={isSelected ? "secondary" : "ghost"}
                      className={`w-full justify-start font-medium ${!isAccessible ? 'opacity-50' : ''}`}
                      disabled={!isAccessible}
                    >
                      {isAccessible ? (
                        isOpen ? (
                          <ChevronDown className="h-4 w-4 mr-2" />
                        ) : (
                          <ChevronRight className="h-4 w-4 mr-2" />
                        )
                      ) : (
                        <Lock className="h-4 w-4 mr-2 text-muted-foreground" />
                      )}
                      <Layers className="h-4 w-4 mr-2 text-primary" />
                      <span className="flex-1 text-left truncate">
                        Level {level.order}: {level.title}
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
                    {levelSessions.map((session) => {
                      const sessionContents = getContentBySession(session.id);
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
                                    onClick={() => onContentSelect(content.id, level.id, session.id)}
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
