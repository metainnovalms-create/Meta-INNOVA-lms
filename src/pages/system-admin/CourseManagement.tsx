import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Plus, Upload, FileText, Search, Filter, Edit, Trash2, BarChart3, Users, TrendingUp, Award, Eye, Layers, Loader2, Target } from 'lucide-react';
import { SDGGoalSelector } from '@/components/project/SDGGoalSelector';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { uploadCourseThumbnail } from '@/services/courseStorage.service';
import { StorageImage } from '@/components/course/StorageImage';
import { CoursePreviewDialog } from '@/components/course/CoursePreviewDialog';
import { EditCourseDialog } from '@/components/course/EditCourseDialog';
import { useCourses, useCourseById, useCreateCourse, useDeleteCourse, useTotalContentCount, DbCourse } from '@/hooks/useCourses';
import { useAuth } from '@/contexts/AuthContext';

export default function CourseManagement() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all-courses');
  const [searchTerm, setSearchTerm] = useState('');
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  
  // Supabase hooks
  const { data: courses = [], isLoading, refetch } = useCourses();
  const { data: selectedCourseData } = useCourseById(previewDialogOpen ? selectedCourseId : null);
  const createCourse = useCreateCourse();
  const deleteCourse = useDeleteCourse();
  const { data: totalContentCount = 0 } = useTotalContentCount();
  
  // Course creation form state
  const [newCourse, setNewCourse] = useState({
    course_code: '',
    title: '',
    description: '',
    thumbnail_url: '',
    prerequisites: '',
    learning_outcomes: [''],
    sdg_goals: [] as number[],
  });

  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.course_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const courseStats = {
    total: courses.length,
    active: courses.filter(c => c.status === 'active').length,
    draft: courses.filter(c => c.status === 'draft').length,
    totalContent: totalContentCount
  };

  const handleCreateCourse = async (isDraft = false) => {
    if (!newCourse.title || !newCourse.course_code) {
      toast.error("Please fill in course title and code");
      return;
    }

    try {
      let thumbnailPath = newCourse.thumbnail_url;
      
      // Upload thumbnail if file is selected
      if (thumbnailFile) {
        setIsUploadingThumbnail(true);
        try {
          // Generate a temporary course ID for the thumbnail path
          const tempId = crypto.randomUUID();
          const result = await uploadCourseThumbnail(thumbnailFile, tempId);
          thumbnailPath = result.path;
        } catch (uploadError: any) {
          toast.error(`Failed to upload thumbnail: ${uploadError.message}`);
          setIsUploadingThumbnail(false);
          return;
        }
        setIsUploadingThumbnail(false);
      }

      await createCourse.mutateAsync({
        course_code: newCourse.course_code,
        title: newCourse.title,
        description: newCourse.description,
        thumbnail_url: thumbnailPath || null,
        prerequisites: newCourse.prerequisites || null,
        learning_outcomes: newCourse.learning_outcomes.filter(o => o.trim()),
        sdg_goals: newCourse.sdg_goals.length > 0 ? newCourse.sdg_goals.map(String) : null,
        status: isDraft ? 'draft' : 'active',
        created_by: user?.id || null
      });

      // Reset form after creation
      setNewCourse({
        course_code: '',
        title: '',
        description: '',
        thumbnail_url: '',
        prerequisites: '',
        learning_outcomes: [''],
        sdg_goals: [] as number[],
      });
      setThumbnailPreview('');
      setThumbnailFile(null);
      setActiveTab('all-courses');
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    try {
      await deleteCourse.mutateAsync(courseId);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    // Store file for later upload
    setThumbnailFile(file);
    
    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setThumbnailPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    toast.success('Thumbnail ready for upload');
  };


  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Course Management</h1>
          <p className="text-muted-foreground mt-2">
            Create, manage, and assign courses across institutions
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all-courses">All Courses</TabsTrigger>
            <TabsTrigger value="create">Create Course</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Tab 1: All Courses */}
          <TabsContent value="all-courses" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{courseStats.total}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{courseStats.active}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Draft Courses</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{courseStats.draft}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Content</CardTitle>
                  <Layers className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{courseStats.totalContent}</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>All Courses</CardTitle>
                    <CardDescription>Manage your course library</CardDescription>
                  </div>
                  <Button onClick={() => setActiveTab('create')}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Course
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search courses..."
                      className="pl-9"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button variant="outline">
                    <Filter className="mr-2 h-4 w-4" />
                    Filters
                  </Button>
                </div>

                {isLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredCourses.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No courses found</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {searchTerm 
                        ? `No courses match "${searchTerm}"`
                        : "Get started by creating your first course"
                      }
                    </p>
                    <Button onClick={() => setActiveTab('create')}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Course
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredCourses.map((course) => (
                      <Card 
                        key={course.id} 
                        className="overflow-hidden hover:shadow-lg transition-shadow group cursor-pointer"
                        onClick={() => navigate(`/system-admin/courses/${course.id}`)}
                      >
                        <div className="relative aspect-video overflow-hidden bg-muted">
                          <StorageImage
                            filePath={course.thumbnail_url}
                            alt={course.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <Badge 
                            className="absolute top-2 right-2" 
                            variant={course.status === 'active' ? 'default' : 'secondary'}
                          >
                            {course.status}
                          </Badge>
                        </div>

                        <CardContent className="p-4 space-y-3">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">{course.course_code}</p>
                            <h3 className="font-semibold text-lg line-clamp-2 mb-2">{course.title}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {course.description}
                            </p>
                          </div>

                          <Separator />

                          <div className="flex gap-2 pt-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="flex-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedCourseId(course.id);
                                setPreviewDialogOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Preview
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedCourseId(course.id);
                                setEditDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteCourse(course.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: Create Course */}
          <TabsContent value="create" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Course Information</CardTitle>
                <CardDescription>Enter the fundamental details of your course</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Course Code *</Label>
                    <Input
                      placeholder="e.g., AI101"
                      value={newCourse.course_code}
                      onChange={(e) => setNewCourse({ ...newCourse, course_code: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Course Title *</Label>
                    <Input
                      placeholder="e.g., Introduction to AI"
                      value={newCourse.title}
                      onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Description *</Label>
                  <Textarea
                    placeholder="Provide a detailed course description..."
                    className="min-h-32"
                    value={newCourse.description}
                    onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Course Thumbnail</Label>
                  <p className="text-sm text-muted-foreground">
                    Upload a cover image for your course (Recommended: 1280x720px, Max: 5MB)
                  </p>
                  
                  {!thumbnailPreview ? (
                    <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleThumbnailUpload}
                        className="hidden"
                        id="thumbnail-upload"
                      />
                      <label htmlFor="thumbnail-upload" className="cursor-pointer">
                        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-sm font-medium">Click to upload or drag and drop</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          PNG, JPG, WEBP up to 5MB
                        </p>
                      </label>
                    </div>
                  ) : (
                    <div className="relative">
                      <img
                        src={thumbnailPreview}
                        alt="Course thumbnail preview"
                        className="w-full h-48 object-cover rounded-lg border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          setThumbnailPreview('');
                          setNewCourse({ ...newCourse, thumbnail_url: '' });
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    </div>
                  )}
                </div>


                <div className="space-y-2">
                  <Label>Prerequisites</Label>
                  <Textarea
                    placeholder="List any prerequisites for this course..."
                    value={newCourse.prerequisites}
                    onChange={(e) => setNewCourse({ ...newCourse, prerequisites: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Learning Outcomes</Label>
                  {newCourse.learning_outcomes.map((outcome, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder={`Learning outcome ${index + 1}`}
                        value={outcome}
                        onChange={(e) => {
                          const updated = [...newCourse.learning_outcomes];
                          updated[index] = e.target.value;
                          setNewCourse({ ...newCourse, learning_outcomes: updated });
                        }}
                      />
                      {newCourse.learning_outcomes.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            const updated = newCourse.learning_outcomes.filter((_, i) => i !== index);
                            setNewCourse({ ...newCourse, learning_outcomes: updated });
                          }}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setNewCourse({ ...newCourse, learning_outcomes: [...newCourse.learning_outcomes, ''] })}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Outcome
                  </Button>
                </div>

                <Separator className="my-4" />

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    SDG Goals
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Select the UN Sustainable Development Goals that this course addresses
                  </p>
                  <SDGGoalSelector
                    selectedGoals={newCourse.sdg_goals}
                    onChange={(goals) => setNewCourse({ ...newCourse, sdg_goals: goals })}
                  />
                </div>

              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  Course Structure
                </CardTitle>
                <CardDescription>
                  After creating the course, you can add modules, sessions, and content from the course detail page.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  First create the basic course, then navigate to the course detail page to build the full curriculum with modules, sessions, and content (PDFs, presentations, YouTube videos).
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <Button 
                    onClick={() => handleCreateCourse(false)} 
                    className="flex-1"
                    disabled={createCourse.isPending}
                  >
                    {createCourse.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <BookOpen className="mr-2 h-4 w-4" />
                    )}
                    Save & Publish Course
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1" 
                    onClick={() => handleCreateCourse(true)}
                    disabled={createCourse.isPending}
                  >
                    Save as Draft
                  </Button>
                  <Button 
                    variant="ghost" 
                    onClick={() => {
                      setNewCourse({
                        course_code: '',
                        title: '',
                        description: '',
                        thumbnail_url: '',
                        prerequisites: '',
                        learning_outcomes: [''],
                        sdg_goals: [] as number[],
                      });
                      setThumbnailPreview('');
                      setThumbnailFile(null);
                      setActiveTab('all-courses');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Enrollments</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-xs text-muted-foreground">Across all courses</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Completion Rate</CardTitle>
                  <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0%</div>
                  <p className="text-xs text-muted-foreground">Course completion</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Assignment Score</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0%</div>
                  <p className="text-xs text-muted-foreground">Student performance</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Quiz Score</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0%</div>
                  <p className="text-xs text-muted-foreground">Assessment performance</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Course Performance</CardTitle>
                <CardDescription>Detailed analytics for each course</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Course</TableHead>
                        <TableHead>Enrollments</TableHead>
                        <TableHead>Active</TableHead>
                        <TableHead>Completed</TableHead>
                        <TableHead>Completion Rate</TableHead>
                        <TableHead>Avg Score</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {courses.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No courses to display analytics for
                          </TableCell>
                        </TableRow>
                      ) : (
                        courses.map((course) => (
                          <TableRow key={course.id}>
                            <TableCell className="font-medium">{course.title}</TableCell>
                            <TableCell>0</TableCell>
                            <TableCell>0</TableCell>
                            <TableCell>0</TableCell>
                            <TableCell>0%</TableCell>
                            <TableCell>0%</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <CoursePreviewDialog
        open={previewDialogOpen}
        onOpenChange={setPreviewDialogOpen}
        course={selectedCourseData || null}
      />

      <EditCourseDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        courseId={selectedCourseId}
        onSave={() => refetch()}
      />
    </Layout>
  );
}
