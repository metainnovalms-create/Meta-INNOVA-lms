import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { ClassOverviewTab } from '@/components/institution/ClassOverviewTab';
import { ClassStudentsTab } from '@/components/institution/ClassStudentsTab';
import { ClassCoursesTab } from '@/components/institution/ClassCoursesTab';
import { ClassAnalyticsTab } from '@/components/institution/ClassAnalyticsTab';
import { useClassCourseAssignments } from '@/hooks/useClassCourseAssignments';
import { useClassAnalytics } from '@/hooks/useClassAnalytics';
import { useInstitutions } from '@/hooks/useInstitutions';
import { useClasses } from '@/hooks/useClasses';
import { useStudents } from '@/hooks/useStudents';
import { useBulkImportStudents } from '@/hooks/useBulkImport';
import { useIdCounter } from '@/hooks/useTimetable';
import { Student, InstitutionClass } from '@/types/student';
import { toast } from 'sonner';
import { parseCSV, validateRow } from '@/utils/csvParser';

export default function ClassDetail() {
  const { institutionId, classId } = useParams();
  const navigate = useNavigate();
  const { institutions } = useInstitutions();
  const { classesWithCounts, isLoading: isLoadingClasses } = useClasses(institutionId);
  const { students, isLoading: isLoadingStudents, createStudent, updateStudent, deleteStudent } = useStudents(institutionId, classId);
  const { bulkImport, progress, isImporting } = useBulkImportStudents(institutionId || '', classId || '');
  const { getNextId } = useIdCounter(institutionId);
  const { data: analytics, isLoading: isLoadingAnalytics } = useClassAnalytics(classId, institutionId);
  const { data: dbCourseAssignments = [] } = useClassCourseAssignments(classId);

  const institution = institutions.find(inst => inst.id === institutionId);
  const classData = classesWithCounts.find(c => c.id === classId);

  if (isLoadingClasses || isLoadingStudents) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">Loading class data...</p>
        </div>
      </Layout>
    );
  }

  if (!classData || !institution) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <h2 className="text-2xl font-bold">Class Not Found</h2>
          <p className="text-muted-foreground">The class you're looking for doesn't exist.</p>
          <Button onClick={() => navigate(`/system-admin/institutions/${institutionId}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Institution
          </Button>
        </div>
      </Layout>
    );
  }

  // Transform class data to InstitutionClass format
  const transformedClassData: InstitutionClass = {
    id: classData.id,
    institution_id: classData.institution_id,
    class_name: classData.class_name,
    display_order: classData.display_order || 0,
    academic_year: classData.academic_year || '',
    capacity: classData.capacity || 30,
    room_number: classData.room_number || '',
    class_teacher_id: classData.class_teacher_id || '',
    status: (classData.status === 'active' ? 'active' : 'archived') as 'active' | 'archived',
    created_at: classData.created_at || '',
    updated_at: classData.updated_at || '',
  };

  // Transform students to Student format
  const transformedStudents: Student[] = students.map(s => ({
    id: s.id,
    student_id: s.student_id,
    student_name: s.student_name,
    email: s.email || undefined,
    roll_number: s.roll_number || undefined,
    admission_number: s.admission_number || undefined,
    class: classData.class_name,
    section: classData.class_name.split(' - ')[1] || 'A',
    class_id: s.class_id || undefined,
    institution_id: s.institution_id,
    admission_date: s.admission_date || undefined,
    date_of_birth: s.date_of_birth || undefined,
    gender: (s.gender as 'male' | 'female' | 'other') || 'male',
    status: (s.status as 'active' | 'inactive') || 'active',
    parent_name: s.parent_name || undefined,
    parent_phone: s.parent_phone || undefined,
    parent_email: s.parent_email || undefined,
    address: s.address || undefined,
    blood_group: s.blood_group || undefined,
    previous_school: s.previous_school || undefined,
    avatar: s.avatar || undefined,
    created_at: s.created_at || undefined,
  }));

  const handleAddStudent = async (studentData: Partial<Student>) => {
    try {
      // Generate student ID
      const counter = await getNextId('student');
      const currentYear = new Date().getFullYear();
      const institutionCode = institution.code || institution.slug?.toUpperCase() || 'STU';
      const studentId = `${institutionCode}-${currentYear}-${String(counter).padStart(4, '0')}`;

      await createStudent({
        institution_id: institutionId!,
        class_id: classId!,
        student_id: studentId,
        student_name: studentData.student_name || '',
        email: studentData.email,
        roll_number: studentData.roll_number,
        admission_number: studentData.admission_number,
        date_of_birth: studentData.date_of_birth,
        gender: studentData.gender,
        blood_group: studentData.blood_group,
        admission_date: studentData.admission_date || new Date().toISOString().split('T')[0],
        previous_school: studentData.previous_school,
        parent_name: studentData.parent_name,
        parent_phone: studentData.parent_phone,
        address: studentData.address,
        avatar: studentData.avatar,
        status: studentData.status || 'active',
      });
    } catch (error: any) {
      console.error('Failed to add student:', error);
      throw error;
    }
  };

  const handleEditStudent = async (studentData: Partial<Student>) => {
    if (!studentData.id) return;
    try {
      await updateStudent({
        id: studentData.id,
        institution_id: institutionId!,
        class_id: classId!,
        student_id: studentData.student_id || '',
        student_name: studentData.student_name || '',
        email: studentData.email,
        roll_number: studentData.roll_number,
        admission_number: studentData.admission_number,
        date_of_birth: studentData.date_of_birth,
        gender: studentData.gender,
        blood_group: studentData.blood_group,
        admission_date: studentData.admission_date,
        previous_school: studentData.previous_school,
        parent_name: studentData.parent_name,
        parent_phone: studentData.parent_phone,
        address: studentData.address,
        avatar: studentData.avatar,
        status: studentData.status,
      });
    } catch (error: any) {
      console.error('Failed to update student:', error);
      throw error;
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    try {
      await deleteStudent({
        id: studentId,
        institution_id: institutionId!,
        class_id: classId,
      });
    } catch (error: any) {
      console.error('Failed to delete student:', error);
      throw error;
    }
  };

  const handleBulkUpload = async (file: File) => {
    try {
      const parsedData = await parseCSV(file);
      
      // Validate rows
      const validRows = parsedData.filter((row, index) => validateRow(row, index).isValid);
      
      if (validRows.length === 0) {
        toast.error('No valid rows to import');
        return { imported: 0, updated: 0, skipped: 0, failed: parsedData.length, duplicates: [] };
      }

      const result = await bulkImport({
        students: validRows,
        options: {
          skipDuplicates: true,
          updateExisting: false,
          createAuthUsers: true,
        },
      });

      return {
        imported: result.imported,
        updated: result.updated,
        skipped: result.skipped,
        failed: result.failed,
        duplicates: result.duplicates,
      };
    } catch (error: any) {
      console.error('Bulk upload failed:', error);
      toast.error(`Bulk upload failed: ${error.message}`);
      return { imported: 0, updated: 0, skipped: 0, failed: 0, duplicates: [] };
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Breadcrumb Navigation */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/system-admin/dashboard">System Admin</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/system-admin/institutions">Institutions</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/system-admin/institutions/${institutionId}`}>
                {institution.name}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{classData.class_name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/system-admin/institutions/${institutionId}`)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <h1 className="text-3xl font-bold">{classData.class_name}</h1>
            </div>
            <p className="text-muted-foreground">
              Academic Year: {classData.academic_year || 'N/A'} • Capacity: {classData.capacity || 30} • Students: {students.length}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="students">Students ({students.length})</TabsTrigger>
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <ClassOverviewTab
              classData={transformedClassData}
              studentCount={students.length}
              attendanceRate={analytics?.student_metrics.average_attendance_rate || 0}
              averageGrade={analytics?.academic_metrics.average_grade || 0}
              activeCourses={dbCourseAssignments.length}
              onEditClass={() => {
                navigate(`/system-admin/institutions/${institutionId}`);
                toast.info('Redirecting to institution page to edit class');
              }}
            />
          </TabsContent>

          <TabsContent value="students">
            <ClassStudentsTab
              classId={classId!}
              classData={transformedClassData}
              students={transformedStudents}
              onAddStudent={handleAddStudent}
              onEditStudent={handleEditStudent}
              onRemoveStudent={handleRemoveStudent}
              onBulkUpload={handleBulkUpload}
            />
          </TabsContent>

          <TabsContent value="courses">
            <ClassCoursesTab
              classId={classId!}
              classData={transformedClassData}
              onAssignCourse={async () => {
                // The ClassCoursesTab handles assignment internally via useAssignCourseToClass hook
                // This prop is required by the interface but actual assignment is done by the dialog
              }}
            />
          </TabsContent>

          <TabsContent value="analytics">
            {analytics ? (
              <ClassAnalyticsTab
                classId={classId!}
                classData={transformedClassData}
                analytics={analytics}
                onGenerateReport={async (options) => {
                  toast.success('Report generation started');
                }}
              />
            ) : (
              <div className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">Analytics data not available for this class</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
