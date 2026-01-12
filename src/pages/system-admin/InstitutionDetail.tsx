import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { ArrowLeft, Users, GraduationCap, Building2, Mail, Phone, Calendar, MapPin, Pencil } from 'lucide-react';
import { EditInstitutionDialog } from '@/components/institution/EditInstitutionDialog';
import { AddClassDialog } from '@/components/institution/AddClassDialog';
import { InstitutionClassesTab } from '@/components/institution/InstitutionClassesTab';
import { InstitutionOfficersTab } from '@/components/institution/InstitutionOfficersTab';
import { InstitutionAnalyticsTab } from '@/components/institution/InstitutionAnalyticsTab';
import { InstitutionTimetableTab } from '@/components/institution/InstitutionTimetableTab';
import { InstituteHolidayCalendar } from '@/components/institution/InstituteHolidayCalendar';
import { InstitutionClass } from '@/types/student';
import { useInstitutionAnalytics } from '@/hooks/useInstitutionAnalytics';
import { toast } from 'sonner';
import { useInstitutions } from '@/hooks/useInstitutions';
import { useClasses } from '@/hooks/useClasses';
import { useStudents } from '@/hooks/useStudents';
import { useInstitutionPeriods, useInstitutionTimetable } from '@/hooks/useTimetable';
import { useOfficersByInstitution, useAvailableOfficers, useOfficerAssignment } from '@/hooks/useInstitutionOfficers';
import { PeriodConfig, InstitutionTimetableAssignment } from '@/types/institution';
import { Loader2 } from 'lucide-react';

// Analytics content wrapper component
function InstitutionAnalyticsContent({ institutionId, institutionName }: { institutionId: string; institutionName: string }) {
  const { data: analytics, isLoading } = useInstitutionAnalytics(institutionId);
  
  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mb-2" />
          <p className="text-muted-foreground">Loading analytics...</p>
        </CardContent>
      </Card>
    );
  }
  
  if (!analytics) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">No data available yet. Analytics will appear once students and attendance records are added.</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <InstitutionAnalyticsTab
      institutionId={institutionId}
      institutionName={institutionName}
      analytics={analytics}
      onGenerateReport={async () => { toast.success('Report generated'); }}
    />
  );
}

export default function InstitutionDetail() {
  const { institutionId } = useParams();
  const navigate = useNavigate();
  const { institutions, updateInstitution } = useInstitutions();
  const [isEditInstitutionOpen, setIsEditInstitutionOpen] = useState(false);
  const [isAddClassOpen, setIsAddClassOpen] = useState(false);
  const [isEditClassOpen, setIsEditClassOpen] = useState(false);
  const [selectedClassForEdit, setSelectedClassForEdit] = useState<InstitutionClass | null>(null);

  // Use database hooks
  const { 
    classesWithCounts, 
    isLoading: isLoadingClasses,
    createClass,
    updateClass,
    deleteClass,
  } = useClasses(institutionId);
  
  const { 
    students, 
    isLoading: isLoadingStudents 
  } = useStudents(institutionId);

  // Use database hooks for timetable
  const { 
    periods, 
    savePeriods,
    isLoading: isLoadingPeriods 
  } = useInstitutionPeriods(institutionId);
  
  const { 
    assignments: timetableAssignments, 
    saveTimetable,
    isLoading: isLoadingTimetable 
  } = useInstitutionTimetable(institutionId);

  // Use database hooks for officers
  const { 
    officers: assignedOfficers, 
    isLoading: isLoadingAssignedOfficers,
    refetch: refetchAssignedOfficers 
  } = useOfficersByInstitution(institutionId);
  
  const { 
    officers: availableOfficers, 
    isLoading: isLoadingAvailableOfficers,
    refetch: refetchAvailableOfficers 
  } = useAvailableOfficers(institutionId);
  
  const { assignOfficer, removeOfficer } = useOfficerAssignment(institutionId);

  const institution = institutions.find(inst => inst.id === institutionId);

  const handleAssignOfficer = async (officerId: string) => {
    await assignOfficer(officerId);
    refetchAssignedOfficers();
    refetchAvailableOfficers();
  };

  const handleRemoveOfficer = async (officerId: string) => {
    await removeOfficer(officerId);
    refetchAssignedOfficers();
    refetchAvailableOfficers();
  };

  if (!institution) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <h2 className="text-2xl font-bold">Institution Not Found</h2>
          <p className="text-muted-foreground">The institution you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/system-admin/institutions')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Institutions
          </Button>
        </div>
      </Layout>
    );
  }

  const handleAddClass = async (classData: Partial<InstitutionClass>) => {
    try {
      await createClass({
        institution_id: institutionId!,
        class_name: classData.class_name || '',
        display_order: classData.display_order,
        academic_year: classData.academic_year,
        capacity: classData.capacity,
        room_number: classData.room_number,
        class_teacher_id: classData.class_teacher_id,
        status: classData.status,
      });
    } catch (error) {
      console.error('Failed to create class:', error);
    }
  };

  const handleEditClass = async (classData: Partial<InstitutionClass>) => {
    if (!selectedClassForEdit) return;
    try {
      await updateClass({
        id: selectedClassForEdit.id,
        institution_id: institutionId!,
        class_name: classData.class_name || '',
        display_order: classData.display_order,
        academic_year: classData.academic_year,
        capacity: classData.capacity,
        room_number: classData.room_number,
        class_teacher_id: classData.class_teacher_id,
        status: classData.status,
      });
      setSelectedClassForEdit(null);
    } catch (error) {
      console.error('Failed to update class:', error);
    }
  };

  const handleDeleteClass = async (classId: string) => {
    const classToDelete = classesWithCounts.find(c => c.id === classId);
    const studentsInClass = classToDelete?.student_count || 0;
    
    const confirmMessage = studentsInClass > 0
      ? `Delete class "${classToDelete?.class_name}" with ${studentsInClass} students?\n\nThis will permanently delete:\n• All students in this class\n• All student progress and submissions\n• All attendance records\n\nThis action cannot be undone.`
      : `Delete class "${classToDelete?.class_name}"? This action cannot be undone.`;
    
    if (window.confirm(confirmMessage)) {
      try {
        await deleteClass({ id: classId, institution_id: institutionId! });
      } catch (error) {
        console.error('Failed to delete class:', error);
      }
    }
  };

  const handleSaveInstitution = async (updatedInstitution: Partial<any>) => {
    if (institutionId) {
      try {
        await updateInstitution({ id: institutionId, updates: updatedInstitution });
        toast.success('Institution details updated successfully');
        setIsEditInstitutionOpen(false);
      } catch (error) {
        console.error('Failed to update institution:', error);
      }
    }
  };

  // Transform periods to PeriodConfig format
  const transformedPeriods: PeriodConfig[] = periods.map(p => ({
    id: p.id,
    institution_id: p.institution_id,
    label: p.label,
    start_time: p.start_time,
    end_time: p.end_time,
    is_break: p.is_break,
    display_order: p.display_order,
    created_at: p.created_at,
    updated_at: p.updated_at,
  }));

  // Transform timetable assignments
  const transformedTimetable: InstitutionTimetableAssignment[] = timetableAssignments.map(a => ({
    id: a.id,
    institution_id: a.institution_id,
    academic_year: a.academic_year,
    day: a.day as InstitutionTimetableAssignment['day'],
    period_id: a.period_id,
    class_id: a.class_id,
    class_name: a.class_name,
    subject: a.subject,
    teacher_id: a.teacher_id,
    teacher_name: a.teacher_name,
    room: a.room,
    created_at: a.created_at,
    updated_at: a.updated_at,
  }));

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header with Breadcrumb */}
        <div className="space-y-4">
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
                <BreadcrumbPage>{institution.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/system-admin/institutions')}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <h1 className="text-3xl font-bold">{institution.name}</h1>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Building2 className="h-4 w-4" />
                  {institution.code}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {institution.location}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Est. {institution.established_year}
                </span>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="classes">Classes</TabsTrigger>
            <TabsTrigger value="officers">Officers</TabsTrigger>
            <TabsTrigger value="holidays">Holidays</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="timetable">Timetable</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{students.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Faculty</CardTitle>
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{institution.total_faculty}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Classes</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{classesWithCounts.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {classesWithCounts.length === 0 
                      ? 'No classes created' 
                      : `${classesWithCounts.length} active class${classesWithCounts.length !== 1 ? 'es' : ''}`
                    }
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Students</CardTitle>
                  <Users className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {students.filter(s => s.status === 'active').length}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Institution Information</CardTitle>
                    <CardDescription>Basic details and contact information</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditInstitutionOpen(true)}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">Institution Code</div>
                    <div className="font-medium">{institution.code}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">Type</div>
                    <Badge className="capitalize">{institution.type}</Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">Contact Email</div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{institution.contact_email}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">Contact Phone</div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{institution.contact_phone}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">Admin Name</div>
                    <div className="font-medium">{institution.admin_name}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">Admin Email</div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{institution.admin_email}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Student ID Configuration */}
            {(institution.student_id_prefix || institution.student_id_suffix) && (
              <Card>
                <CardHeader>
                  <CardTitle>Student ID Configuration</CardTitle>
                  <CardDescription>Settings for generating unique student IDs</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">ID Prefix</div>
                      <div className="font-medium">{institution.student_id_prefix || 'Not set'}</div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">ID Suffix</div>
                      <div className="font-medium">{institution.student_id_suffix || 'Not set'}</div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">Example ID</div>
                      <div className="font-medium text-primary">{institution.student_id_prefix || 'XXX'}-0001-{institution.student_id_suffix || 'XXXX'}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* GPS & Attendance Configuration */}
            {institution.gps_location && (
              <Card>
                <CardHeader>
                  <CardTitle>GPS & Attendance Configuration</CardTitle>
                  <CardDescription>Location-based attendance validation settings for Innovation Officers</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">GPS Coordinates</div>
                      <a 
                        href={`https://www.google.com/maps?q=${institution.gps_location.latitude},${institution.gps_location.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-blue-600 hover:underline flex items-center gap-2"
                      >
                        <MapPin className="h-4 w-4" />
                        {institution.gps_location.latitude.toFixed(6)}, {institution.gps_location.longitude.toFixed(6)}
                      </a>
                      {institution.gps_location.address && (
                        <p className="text-sm text-muted-foreground mt-1">{institution.gps_location.address}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">Attendance Radius</div>
                      <div className="font-medium">{institution.attendance_radius_meters || 1500} meters</div>
                      <p className="text-xs text-muted-foreground">Officers must be within this radius to check in</p>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">Check-in Time</div>
                      <div className="font-medium">{institution.check_in_time || '09:00'}</div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">Check-out Time</div>
                      <div className="font-medium">{institution.check_out_time || '17:00'}</div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">Normal Working Hours</div>
                      <div className="font-medium">{institution.normal_working_hours || 8} hours/day</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Classes Tab */}
          <TabsContent value="classes" className="space-y-6">
            <InstitutionClassesTab
              institutionId={institutionId!}
              institutionClasses={classesWithCounts.map(c => ({
                id: c.id,
                institution_id: c.institution_id,
                class_name: c.class_name,
                display_order: c.display_order || 0,
                academic_year: c.academic_year || '',
                capacity: c.capacity || 30,
                room_number: c.room_number || '',
                class_teacher_id: c.class_teacher_id || '',
                status: (c.status === 'active' ? 'active' : 'archived') as 'active' | 'archived',
                created_at: c.created_at || '',
                updated_at: c.updated_at || '',
              }))}
              studentCounts={classesWithCounts.reduce((acc, c) => ({ ...acc, [c.id]: c.student_count || 0 }), {} as Record<string, number>)}
              onAddClass={() => setIsAddClassOpen(true)}
              onEditClass={(cls) => { setSelectedClassForEdit(cls); setIsEditClassOpen(true); }}
              onDeleteClass={handleDeleteClass}
              onSelectClass={(id) => navigate(`/system-admin/institutions/${institutionId}/classes/${id}`)}
            />
          </TabsContent>

          {/* Innovation Officers Tab */}
          <TabsContent value="officers" className="space-y-6">
            <InstitutionOfficersTab
              institutionId={institutionId!}
              institutionName={institution.name}
              assignedOfficers={assignedOfficers}
              availableOfficers={availableOfficers}
              onAssignOfficer={handleAssignOfficer}
              onRemoveOfficer={handleRemoveOfficer}
            />
          </TabsContent>

          {/* Holidays Tab */}
          <TabsContent value="holidays" className="space-y-6">
            <InstituteHolidayCalendar
              institutionId={institutionId!}
              institutionName={institution.name}
            />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <InstitutionAnalyticsContent
              institutionId={institutionId!}
              institutionName={institution.name}
            />
          </TabsContent>

          {/* Timetable Tab */}
          <TabsContent value="timetable" className="space-y-6">
            <InstitutionTimetableTab
              institutionId={institutionId!}
              institutionName={institution.name}
              classes={classesWithCounts.filter(c => c.status === 'active').map(c => ({
                id: c.id,
                institution_id: c.institution_id,
                class_name: c.class_name,
                display_order: c.display_order || 0,
                academic_year: c.academic_year || '',
                capacity: c.capacity || 30,
                room_number: c.room_number || '',
                class_teacher_id: c.class_teacher_id || '',
                status: 'active' as const,
                created_at: c.created_at || '',
                updated_at: c.updated_at || '',
              }))}
              assignedOfficers={assignedOfficers}
              periods={transformedPeriods}
              timetableData={transformedTimetable}
              onSavePeriods={async (newPeriods) => {
                const saved = await savePeriods(newPeriods);
                return saved || [];
              }}
              onSaveTimetable={async (assignments) => {
                await saveTimetable(assignments);
              }}
            />
          </TabsContent>

        </Tabs>

        {/* Dialogs */}
        <EditInstitutionDialog
          institution={institution}
          open={isEditInstitutionOpen}
          onOpenChange={setIsEditInstitutionOpen}
          onSave={handleSaveInstitution}
        />

        <AddClassDialog
          open={isAddClassOpen || isEditClassOpen}
          onOpenChange={(open) => {
            setIsAddClassOpen(open);
            setIsEditClassOpen(open);
            if (!open) setSelectedClassForEdit(null);
          }}
          onSave={selectedClassForEdit ? handleEditClass : handleAddClass}
          existingClass={selectedClassForEdit}
          institutionId={institutionId || ''}
        />
      </div>
    </Layout>
  );
}
