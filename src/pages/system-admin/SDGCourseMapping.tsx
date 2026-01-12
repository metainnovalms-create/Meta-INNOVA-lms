import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { SDG_GOALS, sdgService, getSDGByNumber } from "@/services/sdg.service";
import { useCourses } from "@/hooks/useCourses";
import { Edit, BookOpen, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function SDGCourseMapping() {
  const { data: courses = [], isLoading, refetch } = useCourses();
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [selectedCourseName, setSelectedCourseName] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSDGs, setSelectedSDGs] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  const handleEditSDGs = (courseId: string, courseName: string, currentSDGs: number[] | null) => {
    setSelectedCourse(courseId);
    setSelectedCourseName(courseName);
    setSelectedSDGs(currentSDGs || []);
    setDialogOpen(true);
  };

  const handleSaveSDGs = async () => {
    if (!selectedCourse) return;
    
    setSaving(true);
    try {
      await sdgService.updateCourseSDGs(selectedCourse, selectedSDGs);
      toast.success(`SDGs updated for ${selectedCourseName}`);
      refetch();
      setDialogOpen(false);
      setSelectedCourse(null);
      setSelectedSDGs([]);
    } catch (error) {
      toast.error('Failed to update SDGs');
    } finally {
      setSaving(false);
    }
  };

  const toggleSDG = (sdgNumber: number) => {
    setSelectedSDGs(prev => 
      prev.includes(sdgNumber) 
        ? prev.filter(n => n !== sdgNumber)
        : [...prev, sdgNumber]
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Course SDG Mapping</CardTitle>
          <p className="text-sm text-muted-foreground">
            Assign UN Sustainable Development Goals to courses
          </p>
        </CardHeader>
        <CardContent>
          {courses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No courses found</p>
              <p className="text-sm">Create courses first to map them to SDGs</p>
            </div>
          ) : (
            <div className="space-y-4">
              {courses.map((course) => {
                const courseSDGs = Array.isArray(course.sdg_goals) 
                  ? (course.sdg_goals as (number | string)[]).map(g => typeof g === 'string' ? parseInt(g) : g)
                  : [];
                return (
                  <div key={course.id} className="flex items-start justify-between border rounded-lg p-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-primary" />
                        <h3 className="font-semibold text-foreground">{course.title}</h3>
                        <Badge variant="outline" className="text-xs">{course.course_code}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">{course.description}</p>
                      
                      {/* SDG Badges */}
                      <div className="flex flex-wrap gap-1">
                        {courseSDGs.length > 0 ? (
                          courseSDGs.map(sdgNum => {
                            const sdgInfo = getSDGByNumber(sdgNum);
                            return sdgInfo ? (
                              <Badge 
                                key={sdgNum}
                                style={{ 
                                  backgroundColor: sdgInfo.color,
                                  color: '#ffffff',
                                  borderColor: sdgInfo.color
                                }}
                                className="text-xs font-semibold"
                              >
                                SDG {sdgInfo.number}
                              </Badge>
                            ) : null;
                          })
                        ) : (
                          <span className="text-xs text-muted-foreground italic">No SDGs assigned</span>
                        )}
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditSDGs(course.id, course.title, courseSDGs)}
                      className="ml-4"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit SDGs
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit SDGs Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit SDG Goals</DialogTitle>
            <DialogDescription>
              Select the UN Sustainable Development Goals that apply to{" "}
              <span className="font-semibold">{selectedCourseName}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            {SDG_GOALS.map((sdg) => (
              <div 
                key={sdg.number} 
                className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                onClick={() => toggleSDG(sdg.number)}
              >
                <Checkbox
                  id={`sdg-${sdg.number}`}
                  checked={selectedSDGs.includes(sdg.number)}
                  onCheckedChange={() => toggleSDG(sdg.number)}
                />
                <div className="flex-1 space-y-1">
                  <Label 
                    htmlFor={`sdg-${sdg.number}`}
                    className="text-sm font-medium leading-none cursor-pointer flex items-center gap-2"
                  >
                    <div 
                      className="h-2 w-2 rounded-full" 
                      style={{ backgroundColor: sdg.color }}
                    />
                    {sdg.number}. {sdg.title}
                  </Label>
                  <p className="text-xs text-muted-foreground">{sdg.description}</p>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSDGs} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save SDG Mappings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
