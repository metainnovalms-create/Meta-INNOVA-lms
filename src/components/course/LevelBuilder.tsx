import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, FileText, Film, Link as LinkIcon, Youtube, Presentation, GripVertical, Layers, PlayCircle } from "lucide-react";
import { useState } from "react";
import { ContentType } from "@/types/course";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";

interface ContentItem {
  id: string;
  title: string;
  type: ContentType;
  file?: File;
  url?: string;
  order: number;
}

interface Session {
  id: string;
  title: string;
  description: string;
  duration_minutes?: number;
  learning_objectives: string[];
  order: number;
  content: ContentItem[];
}

interface Level {
  id: string;
  title: string;
  description: string;
  order: number;
  sessions: Session[];
}

interface LevelBuilderProps {
  levels: Level[];
  onChange: (levels: Level[]) => void;
}

export function LevelBuilder({ levels, onChange }: LevelBuilderProps) {
  const [expandedLevelId, setExpandedLevelId] = useState<string | null>(null);
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);

  const addLevel = () => {
    const newLevel: Level = {
      id: `level-${Date.now()}`,
      title: "",
      description: "",
      order: levels.length + 1,
      sessions: [],
    };
    onChange([...levels, newLevel]);
    setExpandedLevelId(newLevel.id);
  };

  const updateLevel = (levelId: string, field: keyof Level, value: string) => {
    onChange(
      levels.map((level) =>
        level.id === levelId ? { ...level, [field]: value } : level
      )
    );
  };

  const deleteLevel = (levelId: string) => {
    onChange(levels.filter((level) => level.id !== levelId));
  };

  // Session management
  const addSession = (levelId: string) => {
    const level = levels.find(l => l.id === levelId);
    const newSession: Session = {
      id: `session-${Date.now()}`,
      title: "",
      description: "",
      duration_minutes: 45,
      learning_objectives: [""],
      order: (level?.sessions.length || 0) + 1,
      content: [],
    };
    onChange(
      levels.map((l) =>
        l.id === levelId
          ? { ...l, sessions: [...l.sessions, newSession] }
          : l
      )
    );
    setExpandedSessionId(newSession.id);
  };

  const updateSession = (levelId: string, sessionId: string, field: keyof Session, value: any) => {
    onChange(
      levels.map((level) =>
        level.id === levelId
          ? {
              ...level,
              sessions: level.sessions.map((s) =>
                s.id === sessionId ? { ...s, [field]: value } : s
              ),
            }
          : level
      )
    );
  };

  const deleteSession = (levelId: string, sessionId: string) => {
    onChange(
      levels.map((level) =>
        level.id === levelId
          ? { ...level, sessions: level.sessions.filter((s) => s.id !== sessionId) }
          : level
      )
    );
  };

  // Content management
  const addContent = (levelId: string, sessionId: string) => {
    const newContent: ContentItem = {
      id: `content-${Date.now()}`,
      title: "",
      type: "pdf",
      order: 1,
    };
    onChange(
      levels.map((level) =>
        level.id === levelId
          ? {
              ...level,
              sessions: level.sessions.map((s) =>
                s.id === sessionId
                  ? { ...s, content: [...s.content, newContent] }
                  : s
              ),
            }
          : level
      )
    );
  };

  const updateContent = (
    levelId: string,
    sessionId: string,
    contentId: string,
    field: keyof ContentItem,
    value: any
  ) => {
    onChange(
      levels.map((level) =>
        level.id === levelId
          ? {
              ...level,
              sessions: level.sessions.map((s) =>
                s.id === sessionId
                  ? {
                      ...s,
                      content: s.content.map((c) =>
                        c.id === contentId ? { ...c, [field]: value } : c
                      ),
                    }
                  : s
              ),
            }
          : level
      )
    );
  };

  const deleteContent = (levelId: string, sessionId: string, contentId: string) => {
    onChange(
      levels.map((level) =>
        level.id === levelId
          ? {
              ...level,
              sessions: level.sessions.map((s) =>
                s.id === sessionId
                  ? { ...s, content: s.content.filter((c) => c.id !== contentId) }
                  : s
              ),
            }
          : level
      )
    );
  };

  const getContentIcon = (type: ContentType) => {
    switch (type) {
      case "pdf":
        return <FileText className="h-4 w-4" />;
      case "ppt":
        return <Presentation className="h-4 w-4" />;
      case "video":
        return <Film className="h-4 w-4" />;
      case "youtube":
        return <Youtube className="h-4 w-4" />;
      case "link":
      case "simulation":
        return <LinkIcon className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getContentTypeLabel = (type: ContentType) => {
    switch (type) {
      case "pdf":
        return "PDF Document";
      case "ppt":
        return "PowerPoint";
      case "video":
        return "Video File";
      case "youtube":
        return "YouTube Video";
      case "link":
        return "External Link";
      case "simulation":
        return "Simulation";
      default:
        return type;
    }
  };

  return (
    <div className="space-y-4">
      {levels.map((level, levelIndex) => (
        <Card key={level.id} className="p-4">
          <Collapsible
            open={expandedLevelId === level.id}
            onOpenChange={(open) => setExpandedLevelId(open ? level.id : null)}
          >
            <div className="flex items-start gap-3">
              <div className="mt-2 cursor-move">
                <GripVertical className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1 space-y-4">
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between cursor-pointer hover:bg-muted/50 p-2 rounded-md -m-2">
                    <div className="flex items-center gap-3">
                      <Layers className="h-5 w-5 text-primary" />
                      <div>
                        <h4 className="text-sm font-semibold">Level {levelIndex + 1}</h4>
                        {level.title && (
                          <p className="text-xs text-muted-foreground">{level.title}</p>
                        )}
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {level.sessions.length} sessions
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteLevel(level.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent className="space-y-4 pt-4">
                  <div className="space-y-3">
                    <div>
                      <Label>Level Title</Label>
                      <Input
                        value={level.title}
                        onChange={(e) => updateLevel(level.id, "title", e.target.value)}
                        placeholder="e.g., Introduction to AI"
                      />
                    </div>
                    <div>
                      <Label>Level Description</Label>
                      <Textarea
                        value={level.description}
                        onChange={(e) => updateLevel(level.id, "description", e.target.value)}
                        placeholder="Brief description of this level"
                        rows={2}
                      />
                    </div>
                  </div>

                  {/* Sessions */}
                  <div className="space-y-3 border-t pt-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <PlayCircle className="h-4 w-4" />
                        Sessions
                      </Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addSession(level.id)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Session
                      </Button>
                    </div>

                    {level.sessions.length === 0 && (
                      <p className="text-sm text-muted-foreground py-4 text-center border border-dashed rounded-md">
                        No sessions added yet. Click "Add Session" to get started.
                      </p>
                    )}

                    {level.sessions.map((session, sessionIndex) => (
                      <Card key={session.id} className="p-3 bg-muted/30">
                        <Collapsible
                          open={expandedSessionId === session.id}
                          onOpenChange={(open) => setExpandedSessionId(open ? session.id : null)}
                        >
                          <CollapsibleTrigger asChild>
                            <div className="flex items-center justify-between cursor-pointer">
                              <div className="flex items-center gap-2">
                                <PlayCircle className="h-4 w-4 text-blue-500" />
                                <span className="text-sm font-medium">
                                  Session {sessionIndex + 1}
                                  {session.title && `: ${session.title}`}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {session.content.length} items
                                </Badge>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteSession(level.id, session.id);
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </CollapsibleTrigger>

                          <CollapsibleContent className="space-y-3 pt-3">
                            <div className="grid gap-3 sm:grid-cols-2">
                              <div>
                                <Label className="text-xs">Session Title</Label>
                                <Input
                                  value={session.title}
                                  onChange={(e) =>
                                    updateSession(level.id, session.id, "title", e.target.value)
                                  }
                                  placeholder="e.g., Introduction"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Duration (minutes)</Label>
                                <Input
                                  type="number"
                                  value={session.duration_minutes || ""}
                                  onChange={(e) =>
                                    updateSession(level.id, session.id, "duration_minutes", parseInt(e.target.value) || 0)
                                  }
                                  placeholder="45"
                                />
                              </div>
                            </div>
                            <div>
                              <Label className="text-xs">Description</Label>
                              <Textarea
                                value={session.description}
                                onChange={(e) =>
                                  updateSession(level.id, session.id, "description", e.target.value)
                                }
                                placeholder="Brief description of this session"
                                rows={2}
                              />
                            </div>

                            {/* Content Items */}
                            <div className="space-y-2 pt-2">
                              <div className="flex items-center justify-between">
                                <Label className="text-xs font-medium">Content Items</Label>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => addContent(level.id, session.id)}
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  Add Content
                                </Button>
                              </div>

                              {session.content.length === 0 && (
                                <p className="text-xs text-muted-foreground py-2 text-center border border-dashed rounded-md">
                                  No content added. Click "Add Content" to add materials.
                                </p>
                              )}

                              {session.content.map((content) => (
                                <Card key={content.id} className="p-3 bg-background">
                                  <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        {getContentIcon(content.type)}
                                        <span className="text-xs text-muted-foreground">
                                          {getContentTypeLabel(content.type)}
                                        </span>
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => deleteContent(level.id, session.id, content.id)}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>

                                    <div className="grid gap-3">
                                      <div>
                                        <Label className="text-xs">Content Type</Label>
                                        <Select
                                          value={content.type}
                                          onValueChange={(value) =>
                                            updateContent(level.id, session.id, content.id, "type", value as ContentType)
                                          }
                                        >
                                          <SelectTrigger>
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="pdf">PDF Document</SelectItem>
                                            <SelectItem value="ppt">PowerPoint</SelectItem>
                                            <SelectItem value="video">Video File</SelectItem>
                                            <SelectItem value="youtube">YouTube Video</SelectItem>
                                            <SelectItem value="link">External Link</SelectItem>
                                            <SelectItem value="simulation">Simulation</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>

                                      <div>
                                        <Label className="text-xs">Content Title</Label>
                                        <Input
                                          value={content.title}
                                          onChange={(e) =>
                                            updateContent(level.id, session.id, content.id, "title", e.target.value)
                                          }
                                          placeholder="e.g., Introduction Video"
                                        />
                                      </div>

                                      {["youtube", "link", "simulation"].includes(content.type) ? (
                                        <div>
                                          <Label className="text-xs">URL</Label>
                                          <Input
                                            value={content.url || ""}
                                            onChange={(e) =>
                                              updateContent(level.id, session.id, content.id, "url", e.target.value)
                                            }
                                            placeholder={
                                              content.type === "youtube"
                                                ? "https://www.youtube.com/watch?v=..."
                                                : "https://..."
                                            }
                                          />
                                          {content.type === "youtube" && content.url && (
                                            <div className="mt-2">
                                              <div className="aspect-video rounded-md overflow-hidden bg-black">
                                                <iframe
                                                  width="100%"
                                                  height="100%"
                                                  src={`https://www.youtube.com/embed/${extractYouTubeId(content.url)}`}
                                                  title={content.title}
                                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                  allowFullScreen
                                                />
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      ) : (
                                        <div>
                                          <Label className="text-xs">Upload File</Label>
                                          <Input
                                            type="file"
                                            accept={
                                              content.type === "pdf"
                                                ? ".pdf"
                                                : content.type === "ppt"
                                                ? ".ppt,.pptx"
                                                : ".mp4,.avi,.mov,.wmv"
                                            }
                                            onChange={(e) => {
                                              const file = e.target.files?.[0];
                                              if (file) {
                                                updateContent(level.id, session.id, content.id, "file", file);
                                              }
                                            }}
                                          />
                                          {content.file && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                              {content.file.name} ({(content.file.size / 1024 / 1024).toFixed(2)} MB)
                                            </p>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </Card>
                              ))}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      </Card>
                    ))}
                  </div>
                </CollapsibleContent>
              </div>
            </div>
          </Collapsible>
        </Card>
      ))}

      <Button onClick={addLevel} variant="outline" className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Add Level
      </Button>
    </div>
  );
}

function extractYouTubeId(url: string): string {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : "";
}
