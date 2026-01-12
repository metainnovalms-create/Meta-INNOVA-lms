import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  ChevronRight,
  BookOpen,
  PlayCircle,
  Lock,
  CheckCircle2,
  Video,
  FileText,
  Link as LinkIcon,
  X
} from 'lucide-react';

interface ContentItem {
  id: string;
  title: string;
  type: string;
  youtube_url?: string;
  file_path?: string;
  duration_minutes?: number;
}

interface SessionData {
  id: string;
  assignmentId: string;
  title: string;
  description?: string;
  is_unlocked: boolean;
  content: ContentItem[];
  isCompleted?: boolean;
  completedStudents?: number;
  totalStudents?: number;
}

interface ModuleData {
  id: string;
  assignmentId: string;
  title: string;
  description?: string;
  is_unlocked: boolean;
  sessions: SessionData[];
  completedSessionCount: number;
}

interface TeachingCourseSidebarProps {
  courseTitle: string;
  courseCode: string;
  modules: ModuleData[];
  selectedSessionId: string | null;
  selectedContentId: string | null;
  onSessionSelect: (sessionId: string, assignmentId: string, moduleAssignmentId: string) => void;
  onContentSelect: (contentId: string) => void;
  onClose: () => void;
}

export function TeachingCourseSidebar({
  courseTitle,
  courseCode,
  modules,
  selectedSessionId,
  selectedContentId,
  onSessionSelect,
  onContentSelect,
  onClose
}: TeachingCourseSidebarProps) {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set(modules.filter(m => m.is_unlocked).map(m => m.id))
  );
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(
    new Set(selectedSessionId ? [selectedSessionId] : [])
  );

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
      case 'youtube':
        return <Video className="h-3 w-3" />;
      case 'pdf':
      case 'ppt':
        return <FileText className="h-3 w-3" />;
      case 'link':
      case 'simulation':
        return <LinkIcon className="h-3 w-3" />;
      default:
        return <FileText className="h-3 w-3" />;
    }
  };

  return (
    <div className="w-72 md:w-80 border-r bg-card flex flex-col h-full">
      {/* Header */}
      <div className="p-3 md:p-4 border-b flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-base md:text-lg line-clamp-2 break-words">
            {courseTitle}
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground">{courseCode}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Level/Session Tree */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {modules.map((module) => {
            const isModuleExpanded = expandedModules.has(module.id);
            const isModuleLocked = !module.is_unlocked;
            // Level is completed when all sessions are conducted (at least 1 student marked per session)
            const allSessionsConducted = module.sessions.length > 0 && 
              module.sessions.filter(s => s.is_unlocked).every(s => s.isCompleted);

            return (
              <div key={module.id} className="mb-2">
                {/* Level Header */}
                <button
                  onClick={() => !isModuleLocked && toggleModule(module.id)}
                  disabled={isModuleLocked}
                  className={cn(
                    "w-full flex items-center gap-2 p-3 rounded-lg text-left",
                    isModuleLocked
                      ? "opacity-60 cursor-not-allowed"
                      : "hover:bg-accent"
                  )}
                >
                  {isModuleLocked ? (
                    <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
                  ) : allSessionsConducted ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                  ) : (
                    <BookOpen className="h-4 w-4 shrink-0 text-primary" />
                  )}
                  <span className={cn(
                    "flex-1 font-medium text-sm break-words whitespace-normal",
                    isModuleLocked && "text-muted-foreground"
                  )}>
                    {module.title}
                  </span>
                  {!isModuleLocked && (
                    <ChevronRight
                      className={cn(
                        "h-4 w-4 shrink-0 transition-transform",
                        isModuleExpanded && "rotate-90"
                      )}
                    />
                  )}
                </button>

                {/* Sessions */}
                {isModuleExpanded && !isModuleLocked && (
                  <div className="ml-4 border-l pl-2">
                    {module.sessions.map((session) => {
                      const isSessionExpanded = expandedSessions.has(session.id);
                      const isSessionLocked = !session.is_unlocked;
                      const isSessionSelected = session.id === selectedSessionId;

                      return (
                        <div key={session.id} className="mb-1">
                          {/* Session Header */}
                          <button
                            onClick={() => {
                              if (!isSessionLocked) {
                                toggleSession(session.id);
                                onSessionSelect(session.id, session.assignmentId, module.assignmentId);
                              }
                            }}
                            disabled={isSessionLocked}
                            className={cn(
                              "w-full flex items-center gap-2 p-2 rounded-lg text-left",
                              isSessionLocked
                                ? "opacity-60 cursor-not-allowed"
                                : isSessionSelected
                                  ? "bg-primary/10 border border-primary/20"
                                  : "hover:bg-accent"
                            )}
                          >
                            {isSessionLocked ? (
                              <Lock className="h-3 w-3 shrink-0 text-muted-foreground" />
                            ) : session.isCompleted ? (
                              <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                            ) : (
                              <PlayCircle className="h-4 w-4 shrink-0 text-muted-foreground" />
                            )}
                            <div className="flex-1 min-w-0">
                              <span className={cn(
                                "text-sm break-words whitespace-normal block",
                                isSessionLocked && "text-muted-foreground"
                              )}>
                                {session.title}
                              </span>
                              {!isSessionLocked && session.totalStudents !== undefined && session.totalStudents > 0 && (
                                <span className={cn(
                                  "text-xs",
                                  session.isCompleted ? "text-green-600" : "text-muted-foreground"
                                )}>
                                  {session.completedStudents}/{session.totalStudents} students
                                </span>
                              )}
                            </div>
                            {!isSessionLocked && session.content.length > 0 && (
                              <ChevronRight
                                className={cn(
                                  "h-4 w-4 shrink-0 transition-transform",
                                  isSessionExpanded && "rotate-90"
                                )}
                              />
                            )}
                          </button>

                          {/* Content Items */}
                          {isSessionExpanded && !isSessionLocked && (
                            <div className="ml-4 space-y-1 py-1">
                              {session.content.map((content) => (
                                <button
                                  key={content.id}
                                  onClick={() => onContentSelect(content.id)}
                                  className={cn(
                                    "w-full flex items-center gap-2 p-2 rounded-lg text-left text-xs",
                                    selectedContentId === content.id
                                      ? "bg-primary text-primary-foreground"
                                      : "hover:bg-accent"
                                  )}
                                >
                                  {getContentIcon(content.type)}
                                  <span className="flex-1 break-words whitespace-normal">
                                    {content.title}
                                  </span>
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
    </div>
  );
}
