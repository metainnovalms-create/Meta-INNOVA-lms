import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Users } from "lucide-react";
import { CourseWithEnrollments } from "@/utils/courseHelpers";
import { StorageImage } from "@/components/course/StorageImage";

interface CourseCardProps {
  course: CourseWithEnrollments;
  onViewDetails: (courseId: string) => void;
}

export function CourseCard({ course, onViewDetails }: CourseCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="w-full h-32 mb-3 rounded-md overflow-hidden bg-muted">
          {course.thumbnail_url ? (
            <StorageImage 
              filePath={course.thumbnail_url} 
              alt={course.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary to-primary/50">
              <BookOpen className="h-12 w-12 text-white" />
            </div>
          )}
        </div>
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground mb-1">{course.course_code}</p>
              <h3 className="font-semibold text-base line-clamp-2">{course.title}</h3>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>
        
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-blue-500" />
          <span className="text-sm font-medium">{course.total_enrollments} classes enrolled</span>
        </div>

        {course.classes.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Classes:</p>
            <div className="flex flex-wrap gap-1">
              {course.classes.slice(0, 3).map((className, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {className}
                </Badge>
              ))}
              {course.classes.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{course.classes.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}

        <Button 
          className="w-full" 
          variant="outline"
          onClick={() => onViewDetails(course.id)}
        >
          <BookOpen className="h-4 w-4 mr-2" />
          View Course
        </Button>
      </CardContent>
    </Card>
  );
}
