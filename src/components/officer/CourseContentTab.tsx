import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BookOpen,
  Clock,
  Search,
  Eye,
  Loader2,
  Info,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CoursePreviewDialog } from '@/components/course/CoursePreviewDialog';
import { CourseWithStructure, DbCourse } from '@/hooks/useCourses';
import { useThumbnailUrl } from '@/hooks/useThumbnailUrl';

// Course card with thumbnail loading
function CourseCard({ course, onPreview }: { course: DbCourse; onPreview: (course: DbCourse) => void }) {
  const { url: thumbnailUrl, isLoading: thumbnailLoading } = useThumbnailUrl(course.thumbnail_url);

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {/* Course Thumbnail */}
      <div className="relative h-40 bg-gradient-to-br from-primary/20 via-primary/10 to-background overflow-hidden">
        {thumbnailUrl ? (
          <img 
            src={thumbnailUrl} 
            alt={course.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            {thumbnailLoading ? (
              <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
            ) : (
              <BookOpen className="h-16 w-16 text-primary/30" />
            )}
          </div>
        )}
        <div className="absolute top-3 right-3">
          <Badge variant="secondary" className="capitalize">
            {course.category.replace(/-/g, ' ')}
          </Badge>
        </div>
        <div className="absolute bottom-3 left-3">
          <Badge variant={course.difficulty === 'beginner' ? 'default' : 'outline'}>
            {course.difficulty}
          </Badge>
        </div>
      </div>

      <CardHeader className="pb-3">
        <CardTitle className="line-clamp-1">{course.title}</CardTitle>
        <CardDescription className="line-clamp-2">
          {course.course_code} • {course.description || 'No description available'}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {course.duration_weeks && (
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{course.duration_weeks} weeks</span>
            </div>
          )}
        </div>

        {/* Action Button */}
        <Button
          variant="outline"
          className="w-full"
          onClick={() => onPreview(course)}
        >
          <Eye className="h-4 w-4 mr-2" />
          Preview Course
        </Button>
      </CardContent>
    </Card>
  );
}

export function CourseContentTab() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [previewCourse, setPreviewCourse] = useState<CourseWithStructure | null>(null);

  // Fetch all active/published courses
  const { data: courses, isLoading } = useQuery({
    queryKey: ['officer-all-courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .in('status', ['active', 'published'])
        .order('title');
      
      if (error) throw error;
      return data as DbCourse[];
    },
  });

  // Fetch course structure when preview is needed
  const fetchCourseStructure = async (course: DbCourse): Promise<CourseWithStructure> => {
    // Fetch modules
    const { data: modules, error: modulesError } = await supabase
      .from('course_modules')
      .select('*')
      .eq('course_id', course.id)
      .order('display_order');
    
    if (modulesError) throw modulesError;

    // Fetch sessions
    const { data: sessions, error: sessionsError } = await supabase
      .from('course_sessions')
      .select('*')
      .eq('course_id', course.id)
      .order('display_order');
    
    if (sessionsError) throw sessionsError;

    // Fetch content
    const { data: content, error: contentError } = await supabase
      .from('course_content')
      .select('*')
      .eq('course_id', course.id)
      .order('display_order');
    
    if (contentError) throw contentError;

    // Build structure - ensure proper typing
    const structuredModules = (modules || []).map(module => ({
      ...module,
      sessions: (sessions || [])
        .filter(s => s.module_id === module.id)
        .map(session => ({
          ...session,
          learning_objectives: (session.learning_objectives as string[]) || [],
          content: (content || []).filter(c => c.session_id === session.id).map(c => ({
            ...c,
            views_count: c.views_count || 0,
          })),
        })),
    }));

    return {
      ...course,
      learning_outcomes: (course.learning_outcomes as string[]) || [],
      sdg_goals: (course.sdg_goals as string[]) || [],
      modules: structuredModules,
    };
  };

  const handlePreviewCourse = async (course: DbCourse) => {
    try {
      const courseWithStructure = await fetchCourseStructure(course);
      setPreviewCourse(courseWithStructure);
    } catch (error) {
      console.error('Failed to load course structure:', error);
    }
  };

  // Get unique categories
  const categories = [...new Set(courses?.map(c => c.category) || [])];

  // Filter courses based on search and category
  const filteredCourses = courses?.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.course_code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || course.category === categoryFilter;
    return matchesSearch && matchesCategory;
  }) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border">
        <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
        <div>
          <p className="text-sm font-medium">View-Only Mode</p>
          <p className="text-sm text-muted-foreground">
            Browse all courses created by the administration. Use the Preview button to view course content.
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat} value={cat} className="capitalize">
                {cat.replace(/-/g, ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Course Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredCourses.map((course) => (
          <CourseCard key={course.id} course={course} onPreview={handlePreviewCourse} />
        ))}
      </div>

      {/* Empty State */}
      {filteredCourses.length === 0 && (
        <Card className="p-12">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
                <BookOpen className="h-10 w-10 text-muted-foreground" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">No Courses Found</h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery ? 'Try adjusting your search filters' : 'No active courses available yet'}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Course Preview Dialog */}
      {previewCourse && (
        <CoursePreviewDialog
          open={!!previewCourse}
          onOpenChange={(open) => !open && setPreviewCourse(null)}
          course={previewCourse}
        />
      )}
    </div>
  );
}
