import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { InstitutionClass } from '@/types/student';
import { Student } from '@/types/student';
import { AddStudentToClassDialog } from './AddStudentToClassDialog';
import { BulkUploadStudentsToClassDialog } from './BulkUploadStudentsToClassDialog';
import { UserPlus, Upload, Search, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface ClassStudentsTabProps {
  classId: string;
  classData: InstitutionClass;
  students: Student[];
  onAddStudent: (studentData: Partial<Student>) => Promise<void>;
  onEditStudent: (studentData: Partial<Student>) => Promise<void>;
  onRemoveStudent: (studentId: string) => Promise<void>;
  onBulkUpload: (file: File) => Promise<any>;
}

export function ClassStudentsTab({
  classId,
  classData,
  students,
  onAddStudent,
  onEditStudent,
  onRemoveStudent,
  onBulkUpload
}: ClassStudentsTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showBulkUploadDialog, setShowBulkUploadDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | undefined>();
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

  const filteredStudents = students.filter(student =>
    student.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (student.email && student.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (student.roll_number && student.roll_number.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleAddStudent = async (studentData: any) => {
    await onAddStudent(studentData);
    setShowAddDialog(false);
  };

  const handleEditStudent = async (studentData: any) => {
    if (selectedStudent) {
      await onEditStudent({ ...studentData, id: selectedStudent.id });
      setSelectedStudent(undefined);
      setShowAddDialog(false);
    }
  };

  const handleDeleteStudent = async () => {
    if (studentToDelete) {
      await onRemoveStudent(studentToDelete.id);
      setStudentToDelete(null);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Students</CardTitle>
                <CardDescription>
                  Manage students enrolled in {classData.class_name}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowBulkUploadDialog(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Bulk Upload
                </Button>
                <Button size="sm" onClick={() => {
                  setSelectedStudent(undefined);
                  setShowAddDialog(true);
                }}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Student
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search students by name, email, or roll number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {filteredStudents.length > 0 ? (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Roll Number</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={student.avatar || undefined} />
                              <AvatarFallback>
                                {student.student_name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="font-medium">{student.student_name}</div>
                          </div>
                        </TableCell>
                        <TableCell>{student.roll_number || '-'}</TableCell>
                        <TableCell className="text-sm">{student.email}</TableCell>
                        <TableCell className="text-sm">{student.parent_phone || '-'}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={student.status === 'active' ? 'default' : 'secondary'}
                            className="capitalize"
                          >
                            {student.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => {
                                setSelectedStudent(student);
                                setShowAddDialog(true);
                              }}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => setStudentToDelete(student)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Remove
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 border rounded-lg">
                <p className="text-muted-foreground mb-4">
                  {searchQuery ? 'No students found matching your search' : 'No students enrolled in this class'}
                </p>
                {!searchQuery && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setShowBulkUploadDialog(true)}>
                      <Upload className="h-4 w-4 mr-2" />
                      Bulk Upload
                    </Button>
                    <Button size="sm" onClick={() => {
                      setSelectedStudent(undefined);
                      setShowAddDialog(true);
                    }}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add First Student
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AddStudentToClassDialog
        isOpen={showAddDialog}
        onOpenChange={(open) => {
          setShowAddDialog(open);
          if (!open) setSelectedStudent(undefined);
        }}
        mode={selectedStudent ? 'edit' : 'add'}
        student={selectedStudent}
        classData={classData}
        institutionId={classData.institution_id}
        existingStudents={students}
        onSave={selectedStudent ? handleEditStudent : handleAddStudent}
      />

      <BulkUploadStudentsToClassDialog
        isOpen={showBulkUploadDialog}
        onOpenChange={setShowBulkUploadDialog}
        classData={classData}
        institutionId={classData.institution_id}
        onUploadComplete={onBulkUpload}
      />

      <AlertDialog open={!!studentToDelete} onOpenChange={() => setStudentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Student</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {studentToDelete?.student_name} from {classData.class_name}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteStudent}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
