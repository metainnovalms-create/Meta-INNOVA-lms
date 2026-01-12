import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, FileText, Film, Link as LinkIcon, Youtube, Presentation, GripVertical } from "lucide-react";
import { useState } from "react";
import { ContentType } from "@/types/course";

interface ContentItem {
  id: string;
  title: string;
  type: ContentType;
  file?: File;
  url?: string;
  order: number;
}

interface Module {
  id: string;
  title: string;
  description: string;
  order: number;
  content: ContentItem[];
}

interface ModuleBuilderProps {
  modules: Module[];
  onChange: (modules: Module[]) => void;
}

export function ModuleBuilder({ modules, onChange }: ModuleBuilderProps) {
  const [expandedModuleId, setExpandedModuleId] = useState<string | null>(null);

  const addModule = () => {
    const newModule: Module = {
      id: `module-${Date.now()}`,
      title: "",
      description: "",
      order: modules.length + 1,
      content: [],
    };
    onChange([...modules, newModule]);
    setExpandedModuleId(newModule.id);
  };

  const updateModule = (moduleId: string, field: keyof Module, value: string) => {
    onChange(
      modules.map((mod) =>
        mod.id === moduleId ? { ...mod, [field]: value } : mod
      )
    );
  };

  const deleteModule = (moduleId: string) => {
    onChange(modules.filter((mod) => mod.id !== moduleId));
  };

  const addContent = (moduleId: string) => {
    const newContent: ContentItem = {
      id: `content-${Date.now()}`,
      title: "",
      type: "pdf",
      order: 1,
    };
    onChange(
      modules.map((mod) =>
        mod.id === moduleId
          ? { ...mod, content: [...mod.content, newContent] }
          : mod
      )
    );
  };

  const updateContent = (
    moduleId: string,
    contentId: string,
    field: keyof ContentItem,
    value: any
  ) => {
    onChange(
      modules.map((mod) =>
        mod.id === moduleId
          ? {
              ...mod,
              content: mod.content.map((c) =>
                c.id === contentId ? { ...c, [field]: value } : c
              ),
            }
          : mod
      )
    );
  };

  const deleteContent = (moduleId: string, contentId: string) => {
    onChange(
      modules.map((mod) =>
        mod.id === moduleId
          ? {
              ...mod,
              content: mod.content.filter((c) => c.id !== contentId),
            }
          : mod
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
      {modules.map((module, moduleIndex) => (
        <Card key={module.id} className="p-4">
          <div className="flex items-start gap-3">
            <div className="mt-2 cursor-move">
              <GripVertical className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">Level {moduleIndex + 1}</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteModule(module.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

                <div className="space-y-3">
                  <div>
                    <Label>Level Title</Label>
                    <Input
                      value={module.title}
                      onChange={(e) => updateModule(module.id, "title", e.target.value)}
                      placeholder="e.g., Introduction to AI"
                    />
                  </div>
                  <div>
                    <Label>Level Description</Label>
                    <Textarea
                      value={module.description}
                      onChange={(e) => updateModule(module.id, "description", e.target.value)}
                      placeholder="Brief description of this level"
                      rows={2}
                    />
                  </div>
                </div>

              {/* Content Items */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Level Content</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addContent(module.id)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Content
                  </Button>
                </div>

                {module.content.length === 0 && (
                  <p className="text-sm text-muted-foreground py-4 text-center border border-dashed rounded-md">
                    No content added yet. Click "Add Content" to get started.
                  </p>
                )}

                {module.content.map((content) => (
                  <Card key={content.id} className="p-3 bg-muted/50">
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
                          onClick={() => deleteContent(module.id, content.id)}
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
                              updateContent(module.id, content.id, "type", value as ContentType)
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
                              updateContent(module.id, content.id, "title", e.target.value)
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
                                updateContent(module.id, content.id, "url", e.target.value)
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
                                  updateContent(module.id, content.id, "file", file);
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
            </div>
          </div>
        </Card>
      ))}

      <Button onClick={addModule} variant="outline" className="w-full">
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
