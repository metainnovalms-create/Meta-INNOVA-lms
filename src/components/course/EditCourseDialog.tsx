import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Plus, Trash2, Save, Layers, PlayCircle, FileText, ImageIcon, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { uploadCourseThumbnail } from '@/services/courseStorage.service';
import { StorageImage } from '@/components/course/StorageImage';
import {
  useCourseById, 
  useUpdateCourse, 
  useUpdateModule, 
  useDeleteModule,
  useUpdateSession,
  useDeleteSession,
  useUpdateContent,
  useDeleteContent,
  DbCourseModule,
  DbCourseSession,
  DbCourseContent
} from '@/hooks/useCourses';

interface EditCourseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string | null;
  onSave?: () => void;
}

export function EditCourseDialog({ open, onOpenChange, courseId, onSave }: EditCourseDialogProps) {
  const [activeTab, setActiveTab] = useState('basic');
  const [selectedLevelId, setSelectedLevelId] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  
  // Local state for editing
  const [courseTitle, setCourseTitle] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [description, setDescription] = useState('');
  const [prerequisites, setPrerequisites] = useState('');
  const [status, setStatus] = useState('draft');
  const [learningOutcomes, setLearningOutcomes] = useState<string[]>([]);
  const [thumbnailUrl, setThumbnailUrl] = useState<string>('');
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);

  const { data: course, isLoading } = useCourseById(open ? courseId : null);
  const updateCourse = useUpdateCourse();
  const updateModule = useUpdateModule();
  const deleteModule = useDeleteModule();
  const updateSession = useUpdateSession();
  const deleteSession = useDeleteSession();
  const updateContent = useUpdateContent();
  const deleteContent = useDeleteContent();

  useEffect(() => {
    if (course) {
      setCourseTitle(course.title);
      setCourseCode(course.course_code);
      setDescription(course.description || '');
      setPrerequisites(course.prerequisites || '');
      setStatus(course.status);
      setLearningOutcomes(course.learning_outcomes || []);
      setThumbnailUrl(course.thumbnail_url || '');
      setThumbnailFile(null);
      
      if (course.modules?.length > 0 && !selectedLevelId) {
        setSelectedLevelId(course.modules[0].id);
      }
    }
  }, [course]);

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      const previewUrl = URL.createObjectURL(file);
      setThumbnailUrl(previewUrl);
    }
  };

  const handleSave = async () => {
    if (!courseId) return;

    try {
      let newThumbnailUrl = thumbnailUrl;
      
      // Upload new thumbnail if file selected
      if (thumbnailFile) {
        setIsUploadingThumbnail(true);
        try {
          const result = await uploadCourseThumbnail(thumbnailFile, courseId);
          newThumbnailUrl = result.path;
        } catch (uploadError) {
          setIsUploadingThumbnail(false);
          toast.error('Failed to upload thumbnail');
          return;
        }
        setIsUploadingThumbnail(false);
      }

      await updateCourse.mutateAsync({
        courseId,
        updates: {
          title: courseTitle,
          course_code: courseCode,
          description,
          prerequisites,
          status,
          learning_outcomes: learningOutcomes,
          thumbnail_url: newThumbnailUrl || null
        }
      });
      onSave?.();
      onOpenChange(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  const addLearningOutcome = () => {
    setLearningOutcomes([...learningOutcomes, '']);
  };

  const updateLearningOutcome = (index: number, value: string) => {
    const outcomes = [...learningOutcomes];
    outcomes[index] = value;
    setLearningOutcomes(outcomes);
  };

  const removeLearningOutcome = (index: number) => {
    setLearningOutcomes(learningOutcomes.filter((_, i) => i !== index));
  };

  const handleUpdateModule = async (moduleId: string, field: keyof DbCourseModule, value: any) => {
    if (!courseId) return;
    await updateModule.mutateAsync({
      moduleId,
      courseId,
      updates: { [field]: value }
    });
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!courseId) return;
    await deleteModule.mutateAsync({ moduleId, courseId });
    if (selectedLevelId === moduleId) {
      setSelectedLevelId(course?.modules?.[0]?.id || null);
    }
  };

  const handleUpdateSession = async (sessionId: string, field: keyof DbCourseSession, value: any) => {
    if (!courseId) return;
    await updateSession.mutateAsync({
      sessionId,
      courseId,
      updates: { [field]: value }
    });
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!courseId) return;
    await deleteSession.mutateAsync({ sessionId, courseId });
    if (selectedSessionId === sessionId) {
      setSelectedSessionId(null);
    }
  };

  const handleUpdateContent = async (contentId: string, field: keyof DbCourseContent, value: any) => {
    if (!courseId) return;
    await updateContent.mutateAsync({
      contentId,
      courseId,
      updates: { [field]: value }
    });
  };

  const handleDeleteContent = async (contentId: string) => {
    if (!courseId) return;
    await deleteContent.mutateAsync({ contentId, courseId });
  };

  const levels = course?.modules || [];
  const selectedLevel = levels.find(l => l.id === selectedLevelId);
  const levelSessions = selectedLevel?.sessions || [];
  const sessionContent = levelSessions.find(s => s.id === selectedSessionId)?.content || [];

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl h-[90vh] flex items-center justify-center">
          <p>Loading course data...</p>
        </DialogContent>
      </Dialog>
    );
  }

  if (!course) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle>Edit Course: {course.title}</DialogTitle>
            <div className="flex items-center gap-2">
              <Badge variant={status === 'active' ? 'default' : 'secondary'}>
                {status}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mx-4 grid grid-cols-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="levels">Levels ({levels.length})</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1">
            {/* Basic Info Tab */}
            <TabsContent value="basic" className="p-4 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Course Code</Label>
                  <Input
                    value={courseCode}
                    onChange={(e) => setCourseCode(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Course Title</Label>
                  <Input
                    value={courseTitle}
                    onChange={(e) => setCourseTitle(e.target.value)}
                  />
                </div>
              </div>

              {/* Course Thumbnail Section */}
              <div className="space-y-2">
                <Label>Course Thumbnail</Label>
                <div className="flex items-start gap-4">
                  {/* Thumbnail Preview */}
                  <div className="relative w-32 h-20 rounded-lg overflow-hidden border bg-muted flex-shrink-0">
                    {thumbnailUrl ? (
                      thumbnailFile ? (
                        <img 
                          src={thumbnailUrl} 
                          alt="Course thumbnail" 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <StorageImage 
                          filePath={thumbnailUrl} 
                          alt="Course thumbnail"
                          className="w-full h-full object-cover"
                        />
                      )
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  
                  {/* Upload Button */}
                  <div className="flex-1">
                    <label className="cursor-pointer inline-block">
                      <div className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-accent transition-colors">
                        <Upload className="h-4 w-4" />
                        <span className="text-sm">
                          {thumbnailFile ? 'Change Image' : 'Upload New Thumbnail'}
                        </span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleThumbnailChange}
                        className="hidden"
                      />
                    </label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Recommended: 1280x720px (16:9 ratio)
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Prerequisites</Label>
                  <Input
                    value={prerequisites}
                    onChange={(e) => setPrerequisites(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Learning Outcomes</Label>
                  <Button variant="outline" size="sm" onClick={addLearningOutcome}>
                    <Plus className="h-3 w-3 mr-1" />
                    Add
                  </Button>
                </div>
                {learningOutcomes.map((outcome, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={outcome}
                      onChange={(e) => updateLearningOutcome(index, e.target.value)}
                      placeholder={`Outcome ${index + 1}`}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLearningOutcome(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Levels Tab */}
            <TabsContent value="levels" className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Course Levels</h3>
              </div>

              <div className="space-y-3">
                {levels.map((level, index) => (
                  <Card key={level.id} className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex items-center gap-2">
                        <Layers className="h-5 w-5 text-primary" />
                        <span className="font-medium">Level {index + 1}</span>
                      </div>
                      <div className="flex-1 grid gap-3 md:grid-cols-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Title</Label>
                          <Input
                            value={level.title}
                            onChange={(e) => handleUpdateModule(level.id, 'title', e.target.value)}
                            placeholder="Level title"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Description</Label>
                          <Input
                            value={level.description || ''}
                            onChange={(e) => handleUpdateModule(level.id, 'description', e.target.value)}
                            placeholder="Brief description"
                          />
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteModule(level.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Sessions Tab */}
            <TabsContent value="sessions" className="p-4">
              <div className="grid grid-cols-3 gap-4 h-[500px]">
                {/* Level Selection */}
                <div className="border rounded-lg p-3 space-y-2">
                  <h4 className="font-medium text-sm">Select Level</h4>
                  {levels.map((level, index) => (
                    <Button
                      key={level.id}
                      variant={selectedLevelId === level.id ? 'default' : 'ghost'}
                      className="w-full justify-start text-left"
                      onClick={() => {
                        setSelectedLevelId(level.id);
                        setSelectedSessionId(null);
                      }}
                    >
                      <Layers className="h-4 w-4 mr-2" />
                      Level {index + 1}: {level.title || 'Untitled'}
                    </Button>
                  ))}
                </div>

                {/* Sessions List */}
                <div className="col-span-2 border rounded-lg p-3 space-y-2 overflow-y-auto">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm">
                      Sessions in {selectedLevel?.title || 'Level'}
                    </h4>
                  </div>
                  {levelSessions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No sessions in this module</p>
                  ) : (
                    levelSessions.map((session, index) => (
                      <Card key={session.id} className="p-3">
                        <div className="flex items-start gap-3">
                          <PlayCircle className="h-4 w-4 text-blue-500 mt-1" />
                          <div className="flex-1 space-y-2">
                            <div className="space-y-1">
                              <Label className="text-xs">Title</Label>
                              <Input
                                value={session.title}
                                onChange={(e) => handleUpdateSession(session.id, 'title', e.target.value)}
                                placeholder="Session title"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Description</Label>
                              <Input
                                value={session.description || ''}
                                onChange={(e) => handleUpdateSession(session.id, 'description', e.target.value)}
                                placeholder="Session description"
                              />
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteSession(session.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Content Tab */}
            <TabsContent value="content" className="p-4">
              <div className="grid grid-cols-4 gap-4 h-[500px]">
                {/* Level Selection */}
                <div className="border rounded-lg p-3 space-y-2 overflow-y-auto">
                  <h4 className="font-medium text-sm">Levels</h4>
                  {levels.map((level, index) => (
                    <Button
                      key={level.id}
                      variant={selectedLevelId === level.id ? 'default' : 'ghost'}
                      className="w-full justify-start text-left text-xs"
                      onClick={() => {
                        setSelectedLevelId(level.id);
                        setSelectedSessionId(null);
                      }}
                    >
                      <Layers className="h-3 w-3 mr-1" />
                      {level.title || `Level ${index + 1}`}
                    </Button>
                  ))}
                </div>

                {/* Session Selection */}
                <div className="border rounded-lg p-3 space-y-2 overflow-y-auto">
                  <h4 className="font-medium text-sm">Sessions</h4>
                  {levelSessions.map((session, index) => (
                    <Button
                      key={session.id}
                      variant={selectedSessionId === session.id ? 'default' : 'ghost'}
                      className="w-full justify-start text-left text-xs"
                      onClick={() => setSelectedSessionId(session.id)}
                    >
                      <PlayCircle className="h-3 w-3 mr-1" />
                      {session.title || `Session ${index + 1}`}
                    </Button>
                  ))}
                </div>

                {/* Content List */}
                <div className="col-span-2 border rounded-lg p-3 space-y-2 overflow-y-auto">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm">Content Items</h4>
                  </div>
                  {!selectedSessionId ? (
                    <p className="text-sm text-muted-foreground">Select a session to view content</p>
                  ) : sessionContent.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No content in this session</p>
                  ) : (
                    sessionContent.map((content) => (
                      <Card key={content.id} className="p-3">
                        <div className="flex items-start gap-3">
                          <FileText className="h-4 w-4 text-orange-500 mt-1" />
                          <div className="flex-1 space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <Label className="text-xs">Title</Label>
                                <Input
                                  value={content.title}
                                  onChange={(e) => handleUpdateContent(content.id, 'title', e.target.value)}
                                  placeholder="Content title"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Type</Label>
                                <Select
                                  value={content.type}
                                  onValueChange={(value) => handleUpdateContent(content.id, 'type', value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pdf">PDF</SelectItem>
                                    <SelectItem value="ppt">PowerPoint</SelectItem>
                                    <SelectItem value="youtube">YouTube</SelectItem>
                                    <SelectItem value="video">Videos</SelectItem>
                                    <SelectItem value="link">Link</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            {content.type === 'youtube' && (
                              <div className="space-y-1">
                                <Label className="text-xs">YouTube URL</Label>
                                <Input
                                  value={content.youtube_url || ''}
                                  onChange={(e) => handleUpdateContent(content.id, 'youtube_url', e.target.value)}
                                  placeholder="https://youtube.com/..."
                                />
                              </div>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteContent(content.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            </TabsContent>
          </ScrollArea>

          {/* Footer */}
          <div className="p-4 border-t flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={updateCourse.isPending || isUploadingThumbnail}>
              <Save className="h-4 w-4 mr-2" />
              {isUploadingThumbnail ? 'Uploading...' : 'Save Changes'}
            </Button>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
