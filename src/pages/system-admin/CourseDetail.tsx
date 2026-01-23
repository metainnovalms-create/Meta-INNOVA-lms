import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ArrowLeft, Users, Clock, BarChart3, Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ContentItem } from '@/components/course/ContentItem';
import { AddModuleDialog } from '@/components/course/AddModuleDialog';
import { AddSessionDialog } from '@/components/course/AddSessionDialog';
import { AddContentDialog } from '@/components/course/AddContentDialog';
import { EditContentDialog } from '@/components/course/EditContentDialog';
import { StorageImage } from '@/components/course/StorageImage';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { 
  useCourseById, 
  useCreateModule, 
  useUpdateModule, 
  useDeleteModule,
  useCreateSession,
  useUpdateSession,
  useDeleteSession,
  useCreateContent,
  useUpdateContent,
  useDeleteContent,
  DbCourseModule,
  DbCourseSession,
  DbCourseContent
} from '@/hooks/useCourses';
import { CourseModule, CourseSession, CourseContent } from '@/types/course';

export default function SystemAdminCourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('curriculum');

  // Supabase hooks
  const { data: courseData, isLoading, error } = useCourseById(courseId || null);
  const createModule = useCreateModule();
  const updateModule = useUpdateModule();
  const deleteModule = useDeleteModule();
  const createSession = useCreateSession();
  const updateSession = useUpdateSession();
  const deleteSession = useDeleteSession();
  const createContent = useCreateContent();
  const updateContent = useUpdateContent();
  const deleteContentMutation = useDeleteContent();

  // Dialog states
  const [isAddModuleOpen, setIsAddModuleOpen] = useState(false);
  const [isEditModuleOpen, setIsEditModuleOpen] = useState(false);
  const [isAddSessionOpen, setIsAddSessionOpen] = useState(false);
  const [isEditSessionOpen, setIsEditSessionOpen] = useState(false);
  const [isAddContentOpen, setIsAddContentOpen] = useState(false);
  const [isEditContentOpen, setIsEditContentOpen] = useState(false);
  const [isDeleteModuleOpen, setIsDeleteModuleOpen] = useState(false);
  const [isDeleteSessionOpen, setIsDeleteSessionOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState<DbCourseModule | null>(null);
  const [selectedSession, setSelectedSession] = useState<DbCourseSession | null>(null);
  const [selectedContent, setSelectedContent] = useState<DbCourseContent | null>(null);

  // Convert DB types to UI types
  const mapDbModuleToUi = (m: DbCourseModule): CourseModule => ({
    id: m.id,
    course_id: m.course_id,
    title: m.title,
    description: m.description || '',
    order: m.display_order,
    created_at: m.created_at
  });

  const mapDbSessionToUi = (s: DbCourseSession): CourseSession => ({
    id: s.id,
    course_id: s.course_id,
    module_id: s.module_id,
    title: s.title,
    description: s.description || '',
    order: s.display_order,
    duration_minutes: s.duration_minutes || undefined,
    learning_objectives: s.learning_objectives || [],
    created_at: s.created_at
  });

  const mapDbContentToUi = (c: DbCourseContent): CourseContent => ({
    id: c.id,
    course_id: c.course_id,
    module_id: c.module_id,
    session_id: c.session_id,
    title: c.title,
    type: c.type as CourseContent['type'],
    file_url: c.file_path || undefined,
    youtube_url: c.youtube_url || undefined,
    duration_minutes: c.duration_minutes || undefined,
    file_size_mb: c.file_size_mb || undefined,
    order: c.display_order,
    views_count: c.views_count || 0,
    created_at: c.created_at
  });

  const handleEditModule = (e: React.MouseEvent, module: DbCourseModule) => {
    e.stopPropagation();
    setSelectedModule(module);
    setIsEditModuleOpen(true);
  };

  const handleDeleteModuleClick = (e: React.MouseEvent, module: DbCourseModule) => {
    e.stopPropagation();
    setSelectedModule(module);
    setIsDeleteModuleOpen(true);
  };

  const confirmDeleteModule = async () => {
    if (selectedModule && courseId) {
      await deleteModule.mutateAsync({ moduleId: selectedModule.id, courseId });
      setIsDeleteModuleOpen(false);
      setSelectedModule(null);
    }
  };

  const handleAddContent = (module: DbCourseModule) => {
    setSelectedModule(module);
    setIsAddContentOpen(true);
  };

  const handleEditContent = (contentItem: CourseContent) => {
    // Find the original DB content
    const dbContent = courseData?.modules
      .flatMap(m => m.sessions)
      .flatMap(s => s.content)
      .find(c => c.id === contentItem.id);
    if (dbContent) {
      setSelectedContent(dbContent);
      setIsEditContentOpen(true);
    }
  };

  const handleDeleteContent = async (contentId: string) => {
    if (courseId) {
      await deleteContentMutation.mutateAsync({ contentId, courseId });
    }
  };

  const handleSaveModule = async (moduleData: Partial<CourseModule>) => {
    if (!courseId) return;

    if (selectedModule) {
      // Edit mode
      await updateModule.mutateAsync({
        moduleId: selectedModule.id,
        courseId,
        updates: {
          title: moduleData.title,
          description: moduleData.description
        }
      });
    } else {
      // Add mode
      await createModule.mutateAsync({
        courseId,
        moduleData: {
          title: moduleData.title!,
          description: moduleData.description
        }
      });
    }
    setIsAddModuleOpen(false);
    setIsEditModuleOpen(false);
    setSelectedModule(null);
  };

  // Session handlers
  const handleAddSession = (module: DbCourseModule) => {
    setSelectedModule(module);
    setSelectedSession(null);
    setIsAddSessionOpen(true);
  };

  const handleEditSession = (e: React.MouseEvent, session: DbCourseSession) => {
    e.stopPropagation();
    setSelectedSession(session);
    setIsEditSessionOpen(true);
  };

  const handleDeleteSessionClick = (e: React.MouseEvent, session: DbCourseSession) => {
    e.stopPropagation();
    setSelectedSession(session);
    setIsDeleteSessionOpen(true);
  };

  const confirmDeleteSession = async () => {
    if (selectedSession && courseId) {
      await deleteSession.mutateAsync({ sessionId: selectedSession.id, courseId });
      setIsDeleteSessionOpen(false);
      setSelectedSession(null);
    }
  };

  const handleSaveSession = async (sessionData: Partial<CourseSession>) => {
    if (!courseId || !selectedModule) return;

    if (selectedSession) {
      // Edit mode
      await updateSession.mutateAsync({
        sessionId: selectedSession.id,
        courseId,
        updates: {
          title: sessionData.title,
          description: sessionData.description,
          duration_minutes: sessionData.duration_minutes,
          learning_objectives: sessionData.learning_objectives
        }
      });
    } else {
      // Add mode
      await createSession.mutateAsync({
        courseId,
        moduleId: selectedModule.id,
        sessionData: {
          title: sessionData.title!,
          description: sessionData.description,
          duration_minutes: sessionData.duration_minutes,
          learning_objectives: sessionData.learning_objectives
        }
      });
    }
    setIsAddSessionOpen(false);
    setIsEditSessionOpen(false);
    setSelectedSession(null);
  };

  const handleAddContentToSession = (session: DbCourseSession) => {
    setSelectedSession(session);
    const module = courseData?.modules.find(m => m.id === session.module_id);
    setSelectedModule(module || null);
    setIsAddContentOpen(true);
  };

  const handleSaveContent = async (contentData: {
    title?: string;
    type?: string;
    file_path?: string;
    youtube_url?: string;
    duration_minutes?: number;
    file_size_mb?: number;
  }) => {
    if (!courseId || !selectedModule || !selectedSession) return;

    if (selectedContent) {
      // Edit mode
      await updateContent.mutateAsync({
        contentId: selectedContent.id,
        courseId,
        updates: {
          title: contentData.title,
          type: contentData.type,
          file_path: contentData.file_path,
          youtube_url: contentData.youtube_url,
          duration_minutes: contentData.duration_minutes,
          file_size_mb: contentData.file_size_mb
        }
      });
    } else {
      // Add mode
      await createContent.mutateAsync({
        courseId,
        moduleId: selectedModule.id,
        sessionId: selectedSession.id,
        contentData: {
          title: contentData.title!,
          type: contentData.type!,
          file_path: contentData.file_path,
          youtube_url: contentData.youtube_url,
          duration_minutes: contentData.duration_minutes,
          file_size_mb: contentData.file_size_mb
        }
      });
    }
    setIsAddContentOpen(false);
    setIsEditContentOpen(false);
    setSelectedContent(null);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  if (error || !courseData) {
    return (
      <Layout>
        <div className="space-y-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/system-admin/course-management')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Courses
          </Button>
          <Card>
            <CardContent className="text-center py-16">
              <p className="text-muted-foreground">Course not found</p>
              <Button 
                className="mt-4"
                onClick={() => navigate('/system-admin/course-management')}
              >
                Return to Course Management
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  const modules = courseData.modules || [];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/system-admin/course-management')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Courses
        </Button>

        {/* Hero Section */}
        <Card className="overflow-hidden">
          <div className="relative aspect-video overflow-hidden bg-muted">
            <StorageImage
              filePath={courseData.thumbnail_url}
              alt={courseData.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-background/20" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge variant={courseData.status === 'active' ? 'default' : 'secondary'}>
                  {courseData.status.toUpperCase()}
                </Badge>
              </div>
              <h1 className="text-4xl font-bold mb-2">{courseData.title}</h1>
              <p className="text-muted-foreground mb-3">{courseData.course_code}</p>
            </div>
          </div>
        </Card>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Levels</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{modules.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sessions</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {modules.reduce((acc, m) => acc + m.sessions.length, 0)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Content Items</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {modules.reduce((acc, m) => acc + m.sessions.reduce((a, s) => a + s.content.length, 0), 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabbed Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Course Description</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">{courseData.description}</p>

                {courseData.prerequisites && (
                  <div>
                    <h3 className="font-semibold mb-2">Prerequisites</h3>
                    <p className="text-muted-foreground">{courseData.prerequisites}</p>
                  </div>
                )}

                {courseData.learning_outcomes && courseData.learning_outcomes.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Learning Outcomes</h3>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      {courseData.learning_outcomes.map((outcome, index) => (
                        <li key={index}>{outcome}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Curriculum Tab */}
          <TabsContent value="curriculum" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Course Levels</h2>
                <p className="text-muted-foreground">Manage course content and structure</p>
              </div>
              <Button onClick={() => setIsAddModuleOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Level
              </Button>
            </div>

            {modules.length === 0 ? (
              <Card>
                <CardContent className="text-center py-16">
                  <div className="text-muted-foreground mb-4">No levels yet</div>
                  <Button onClick={() => setIsAddModuleOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add First Level
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Accordion type="multiple" className="space-y-4">
                {modules.map((module) => (
                  <AccordionItem key={module.id} value={module.id} className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">Level {module.display_order + 1}</Badge>
                          <h3 className="font-semibold text-lg">{module.title}</h3>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={(e) => handleEditModule(e, module)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={(e) => handleDeleteModuleClick(e, module)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4">
                      <p className="text-muted-foreground mb-4">{module.description}</p>
                      
                      {/* Sessions within module */}
                      <div className="ml-4 space-y-3">
                        {module.sessions.length === 0 ? (
                          <p className="text-sm text-muted-foreground italic py-4">
                            No sessions yet. Click below to add sessions.
                          </p>
                        ) : (
                          module.sessions.map((session) => (
                            <Card key={session.id} className="border-l-4 border-l-primary">
                              <CardHeader>
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <CardTitle className="text-base">{session.title}</CardTitle>
                                    <CardDescription className="mt-1">{session.description}</CardDescription>
                                    {session.learning_objectives && session.learning_objectives.length > 0 && (
                                      <div className="mt-2">
                                        <p className="text-xs font-semibold mb-1">Learning Objectives:</p>
                                        <ul className="text-xs text-muted-foreground list-disc list-inside">
                                          {session.learning_objectives.map((obj, idx) => (
                                            <li key={idx}>{obj}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex gap-2">
                                    <Button variant="ghost" size="sm" onClick={(e) => handleEditSession(e, session)}>
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={(e) => handleDeleteSessionClick(e, session)}>
                                      <Trash2 className="h-3 w-3 text-destructive" />
                                    </Button>
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-2">
                                  {session.content.length === 0 ? (
                                    <p className="text-sm text-muted-foreground italic">No content yet</p>
                                  ) : (
                                    session.content.map((contentItem) => (
                                      <ContentItem
                                        key={contentItem.id}
                                        content={mapDbContentToUi(contentItem)}
                                        onEdit={handleEditContent}
                                        onDelete={handleDeleteContent}
                                      />
                                    ))
                                  )}
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="mt-3"
                                  onClick={() => handleAddContentToSession(session)}
                                >
                                  <Plus className="mr-2 h-3 w-3" />
                                  Add Content
                                </Button>
                              </CardContent>
                            </Card>
                          ))
                        )}
                        <Button variant="outline" onClick={() => handleAddSession(module)}>
                          <Plus className="mr-2 h-4 w-4" />
                          Add Session to Level
                        </Button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        <AddModuleDialog
          open={isAddModuleOpen}
          onOpenChange={setIsAddModuleOpen}
          onSave={handleSaveModule}
        />

        <AddModuleDialog
          open={isEditModuleOpen}
          onOpenChange={setIsEditModuleOpen}
          onSave={handleSaveModule}
          module={selectedModule ? mapDbModuleToUi(selectedModule) : undefined}
        />

        <AddSessionDialog
          open={isAddSessionOpen}
          onOpenChange={setIsAddSessionOpen}
          onSave={handleSaveSession}
          session={null}
          moduleName={selectedModule?.title || ''}
        />

        <AddSessionDialog
          open={isEditSessionOpen}
          onOpenChange={setIsEditSessionOpen}
          onSave={handleSaveSession}
          session={selectedSession ? mapDbSessionToUi(selectedSession) : null}
          moduleName={selectedModule?.title || ''}
        />

        <AddContentDialog
          open={isAddContentOpen}
          onOpenChange={setIsAddContentOpen}
          onSave={handleSaveContent}
          sessionName={selectedSession?.title || ''}
          courseId={courseId || ''}
        />

        <EditContentDialog
          open={isEditContentOpen}
          onOpenChange={setIsEditContentOpen}
          onSave={handleSaveContent}
          content={selectedContent ? mapDbContentToUi(selectedContent) : null}
        />

        <AlertDialog open={isDeleteModuleOpen} onOpenChange={setIsDeleteModuleOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Level</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{selectedModule?.title}"? All sessions and content will be deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteModule} className="bg-destructive text-destructive-foreground">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={isDeleteSessionOpen} onOpenChange={setIsDeleteSessionOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Session</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{selectedSession?.title}"? All content in this session will be deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteSession} className="bg-destructive text-destructive-foreground">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}
