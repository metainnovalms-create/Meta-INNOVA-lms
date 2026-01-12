import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Search, Loader2, BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAllPublishedCourses } from "@/hooks/useClassCourseAssignments";
import { StorageImage } from "@/components/course/StorageImage";

export function ManagementCoursesView() {
  const navigate = useNavigate();
  const { tenantId } = useParams();
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch all active courses
  const { data: courses, isLoading } = useAllPublishedCourses();

  // Apply search filter only
  const filteredCourses = (courses || []).filter(course => {
    const matchesSearch = course.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          course.course_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          course.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleViewDetails = (courseId: string) => {
    navigate(`/tenant/${tenantId}/management/courses/${courseId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Active Courses</h2>
        <p className="text-muted-foreground">
          Browse all active courses available in the system
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search courses by name or code..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Course Grid */}
      {filteredCourses.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {searchQuery
              ? "No courses found matching your search."
              : "No active courses available yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleViewDetails(course.id)}>
              <div className="aspect-video bg-muted relative">
                {course.thumbnail_url ? (
                  <StorageImage
                    filePath={course.thumbnail_url}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                    <BookOpen className="h-12 w-12 text-primary/50" />
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg line-clamp-2 mb-1">{course.title}</h3>
                <p className="text-sm text-muted-foreground mb-3">{course.course_code}</p>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                  {course.description || 'No description available'}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {course.modules?.length || 0} modules
                  </span>
                  <Button size="sm" variant="outline">
                    View Course
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}