import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Users, BookOpen, Settings2, ClipboardEdit } from 'lucide-react';
import { InstitutionClass } from '@/types/student';
import { ClassAssessmentMappingDialog } from '@/components/assessment/ClassAssessmentMappingDialog';
import { InternalMarksEntry } from '@/components/assessment/InternalMarksEntry';

interface InstitutionClassesTabProps {
  institutionId: string;
  institutionClasses: InstitutionClass[];
  studentCounts: Record<string, number>;
  onAddClass: () => void;
  onEditClass: (classData: InstitutionClass) => void;
  onDeleteClass: (classId: string) => void;
  onSelectClass: (classId: string) => void;
}

export const InstitutionClassesTab = ({
  institutionId,
  institutionClasses,
  studentCounts,
  onAddClass,
  onEditClass,
  onDeleteClass,
  onSelectClass
}: InstitutionClassesTabProps) => {
  const [mappingDialogOpen, setMappingDialogOpen] = useState(false);
  const [internalMarksOpen, setInternalMarksOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<InstitutionClass | null>(null);

  const handleOpenMapping = (classItem: InstitutionClass) => {
    setSelectedClass(classItem);
    setMappingDialogOpen(true);
  };

  const handleOpenInternalMarks = (classItem: InstitutionClass) => {
    setSelectedClass(classItem);
    setInternalMarksOpen(true);
  };

  if (internalMarksOpen && selectedClass) {
    return (
      <InternalMarksEntry
        classId={selectedClass.id}
        className={selectedClass.class_name}
        institutionId={institutionId}
        onBack={() => {
          setInternalMarksOpen(false);
          setSelectedClass(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Class Management</h3>
          <p className="text-sm text-muted-foreground">Create and manage classes for this institution</p>
        </div>
        <Button onClick={onAddClass}>
          <Plus className="h-4 w-4 mr-2" />
          Add Class
        </Button>
      </div>

      {institutionClasses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Classes Created</h3>
            <p className="text-muted-foreground mb-4 text-center">
              Get started by creating your first class for this institution
            </p>
            <Button onClick={onAddClass}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Class
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {institutionClasses.map((classItem) => {
            const studentCount = studentCounts[classItem.id] || 0;
            const utilizationRate = classItem.capacity 
              ? Math.round((studentCount / classItem.capacity) * 100) 
              : 0;

            return (
              <Card 
                key={classItem.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => onSelectClass(classItem.id)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{classItem.class_name}</CardTitle>
                      <CardDescription className="mt-1">
                        {classItem.academic_year}
                      </CardDescription>
                    </div>
                    <Badge variant={classItem.status === 'active' ? 'default' : 'secondary'}>
                      {classItem.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{studentCount}</span>
                      <span className="text-muted-foreground">
                        {classItem.capacity ? `/ ${classItem.capacity}` : 'students'}
                      </span>
                    </div>
                    {classItem.capacity && (
                      <Badge variant={utilizationRate > 90 ? 'destructive' : utilizationRate > 70 ? 'default' : 'secondary'}>
                        {utilizationRate}% filled
                      </Badge>
                    )}
                  </div>

                  {classItem.room_number && (
                    <div className="text-sm text-muted-foreground">
                      Room: {classItem.room_number}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenMapping(classItem);
                      }}
                      title="Map Assessments to Weightage Categories"
                    >
                      <Settings2 className="h-3 w-3 mr-1" />
                      Mapping
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenInternalMarks(classItem);
                      }}
                      title="Enter Internal Assessment Marks"
                    >
                      <ClipboardEdit className="h-3 w-3 mr-1" />
                      Internal
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditClass(classItem);
                      }}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteClass(classItem.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Assessment Mapping Dialog session */}
      {selectedClass && (
        <ClassAssessmentMappingDialog
          open={mappingDialogOpen}
          onOpenChange={setMappingDialogOpen}
          classId={selectedClass.id}
          className={selectedClass.class_name}
          institutionId={institutionId}
        />
      )}
    </div>
  );
};
