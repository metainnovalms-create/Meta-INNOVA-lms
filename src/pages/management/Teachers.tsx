import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, UserCheck, Mail, BookOpen, Users, Award, Phone, Plus } from "lucide-react";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { InstitutionHeader } from "@/components/management/InstitutionHeader";
import { getInstitutionBySlug } from "@/data/mockInstitutionData";
import { useLocation } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockTeachers, mockTimetables } from "@/data/mockTeacherData";
import { SCHOOL_SUBJECTS, SchoolTeacher, TeacherTimetable, TimetableSlot } from "@/types/teacher";
import { TeacherDetailsDialog } from "@/components/teacher/TeacherDetailsDialog";
import { AddEditTeacherDialog } from "@/components/teacher/AddEditTeacherDialog";
import { DeleteTeacherDialog } from "@/components/teacher/DeleteTeacherDialog";
import { TimetableManagementTab } from "@/components/teacher/TimetableManagementTab";
import { toast } from "sonner";

const Teachers = () => {
  const { tenantId } = useParams();
  
  // Extract institution from URL
  const location = useLocation();
  const institutionSlug = location.pathname.split('/')[2];
  const institution = getInstitutionBySlug(institutionSlug);
  
  const [teachers, setTeachers] = useState(mockTeachers);
  const [timetables, setTimetables] = useState<TeacherTimetable[]>(mockTimetables);
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("list");
  const [highlightedTeacherId, setHighlightedTeacherId] = useState<string | undefined>();
  
  // Dialog states
  const [selectedTeacher, setSelectedTeacher] = useState<SchoolTeacher | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const filteredTeachers = teachers.filter((teacher) => {
    const matchesSearch = 
      teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.employee_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.subjects.some(subject => subject.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesSubject = 
      subjectFilter === "all" || 
      teacher.subjects.includes(subjectFilter);
    
    return matchesSearch && matchesSubject;
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "default",
      on_leave: "secondary",
      inactive: "destructive",
    } as const;
    return variants[status as keyof typeof variants] || "secondary";
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      active: "Active",
      on_leave: "On Leave",
      inactive: "Inactive",
    };
    return labels[status as keyof typeof labels] || status;
  };

  // CRUD handlers
  const handleTeacherClick = (teacher: SchoolTeacher) => {
    setSelectedTeacher(teacher);
    setDetailsDialogOpen(true);
  };

  const handleAddTeacher = (newTeacher: Omit<SchoolTeacher, 'id'> & { id?: string }) => {
    const teacher: SchoolTeacher = {
      ...newTeacher,
      id: newTeacher.id || `TCH${(teachers.length + 1).toString().padStart(3, '0')}`,
    };
    setTeachers([...teachers, teacher]);
    toast.success('Teacher added successfully');
    setAddDialogOpen(false);
    setActiveTab('list');
  };

  const handleEditTeacher = (updatedTeacher: Omit<SchoolTeacher, 'id'> & { id?: string }) => {
    if (!updatedTeacher.id) return;
    setTeachers(teachers.map(t => 
      t.id === updatedTeacher.id ? { ...updatedTeacher as SchoolTeacher } : t
    ));
    toast.success('Teacher updated successfully');
    setEditDialogOpen(false);
    setDetailsDialogOpen(false);
  };

  const handleDeleteTeacher = () => {
    if (!selectedTeacher) return;
    setTeachers(teachers.filter(t => t.id !== selectedTeacher.id));
    toast.success('Teacher deleted successfully');
    setDeleteDialogOpen(false);
    setDetailsDialogOpen(false);
    setSelectedTeacher(null);
  };

  const openEditDialog = () => {
    setDetailsDialogOpen(false);
    setEditDialogOpen(true);
  };

  const openDeleteDialog = () => {
    setDetailsDialogOpen(false);
    setDeleteDialogOpen(true);
  };

  const handleSaveTimetable = (teacherId: string, slots: TimetableSlot[]) => {
    const existingIndex = timetables.findIndex(t => t.teacher_id === teacherId);
    const newTimetable: TeacherTimetable = {
      teacher_id: teacherId,
      slots,
      total_hours: slots.length,
      status: slots.length >= 20 ? 'assigned' : slots.length > 0 ? 'partial' : 'not_assigned',
      last_updated: new Date().toISOString().split('T')[0],
    };

    if (existingIndex >= 0) {
      setTimetables(prev => prev.map((t, idx) => idx === existingIndex ? newTimetable : t));
    } else {
      setTimetables(prev => [...prev, newTimetable]);
    }
  };

  const handleTimetableButtonClick = (teacherId: string) => {
    setActiveTab('timetables');
    setHighlightedTeacherId(teacherId);
    setTimeout(() => setHighlightedTeacherId(undefined), 3000);
  };

  // Calculate summary statistics
  const totalTeachers = teachers.length;
  const teachersOnLeave = teachers.filter(t => t.status === 'on_leave').length;
  const avgExperience = totalTeachers > 0 ? Math.round(
    teachers.reduce((sum, t) => sum + t.experience_years, 0) / totalTeachers
  ) : 0;
  const totalStudents = teachers.reduce((sum, t) => sum + t.total_students, 0);

  const nextEmployeeId = `TCH${(teachers.length + 1).toString().padStart(3, '0')}`;

  return (
    <Layout>
      <div className="space-y-6">
        {institution && (
          <InstitutionHeader 
            institutionName={institution.name}
            establishedYear={institution.established_year}
            location={institution.location}
            totalStudents={institution.total_students}
            academicYear={institution.academic_year}
            userRole="Management Portal"
            assignedOfficers={institution.assigned_officers.map(o => o.officer_name)}
          />
        )}
        
        <div>
          <h1 className="text-3xl font-bold">Teacher Management</h1>
          <p className="text-muted-foreground">Supervise and monitor teacher performance</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Teachers</p>
                  <p className="text-2xl font-bold">{totalTeachers}</p>
                </div>
                <Users className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">On Leave Today</p>
                  <p className="text-2xl font-bold">{teachersOnLeave}</p>
                </div>
                <UserCheck className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Experience</p>
                  <p className="text-2xl font-bold">{avgExperience} years</p>
                </div>
                <Award className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Students</p>
                  <p className="text-2xl font-bold">{totalStudents}</p>
                </div>
                <BookOpen className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Teaching Staff</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full md:w-[600px] grid-cols-3">
                <TabsTrigger value="list">List Teachers</TabsTrigger>
                <TabsTrigger value="add">Add Teacher</TabsTrigger>
                <TabsTrigger value="timetables">Manage Timetables</TabsTrigger>
              </TabsList>

              <TabsContent value="list" className="space-y-4 mt-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, employee ID, or subject..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                    <SelectTrigger className="w-full md:w-[200px]">
                      <SelectValue placeholder="Filter by Subject" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Subjects</SelectItem>
                      {SCHOOL_SUBJECTS.map((subject) => (
                        <SelectItem key={subject} value={subject}>
                          {subject}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  {filteredTeachers.map((teacher) => (
                    <Card 
                      key={teacher.id} 
                      className="cursor-pointer transition-colors hover:bg-accent/50"
                      onClick={() => handleTeacherClick(teacher)}
                    >
                      <CardContent className="pt-6">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          <div className="space-y-3 flex-1">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold text-lg">{teacher.name}</h3>
                                  <Badge variant="outline" className="text-xs">
                                    {teacher.employee_id}
                                  </Badge>
                                </div>
                                <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-2">
                                    <Mail className="h-3 w-3" />
                                    {teacher.email}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Phone className="h-3 w-3" />
                                    {teacher.phone}
                                  </div>
                                </div>
                              </div>
                              <Badge variant={getStatusBadge(teacher.status)}>
                                {getStatusLabel(teacher.status)}
                              </Badge>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {teacher.subjects.map((subject) => (
                                <Badge key={subject} variant="secondary">
                                  {subject}
                                </Badge>
                              ))}
                            </div>

                            <div className="flex flex-wrap gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <BookOpen className="h-4 w-4 text-primary" />
                                <span className="font-medium">Classes:</span>
                                <span className="text-muted-foreground">
                                  {teacher.classes_taught.join(', ')}
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                <span>{teacher.total_students} Students</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Award className="h-4 w-4" />
                                <span>{teacher.experience_years} years experience</span>
                              </div>
                              <div>
                                <span className="font-medium">Qualification:</span> {teacher.qualification}
                              </div>
                              <div>
                                <span className="font-medium">Attendance:</span> {teacher.average_attendance}%
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {filteredTeachers.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No teachers found matching your search criteria.</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="add" className="mt-6">
                <div className="flex items-center justify-center py-12">
                  <div className="text-center space-y-4">
                    <div className="flex justify-center">
                      <div className="rounded-full bg-primary/10 p-6">
                        <Plus className="h-12 w-12 text-primary" />
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold">Add a New Teacher</h3>
                    <p className="text-muted-foreground max-w-md">
                      Click the button below to open the form and add a new teacher to your institution.
                    </p>
                    <Button onClick={() => setAddDialogOpen(true)} size="lg">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Teacher
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="timetables" className="mt-6">
                <TimetableManagementTab 
                  teachers={teachers}
                  timetables={timetables}
                  onSaveTimetable={handleSaveTimetable}
                  highlightTeacherId={highlightedTeacherId}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Dialogs */}
        <TeacherDetailsDialog
          teacher={selectedTeacher}
          open={detailsDialogOpen}
          onOpenChange={setDetailsDialogOpen}
          onEdit={openEditDialog}
          onDelete={openDeleteDialog}
        />

        <AddEditTeacherDialog
          open={addDialogOpen}
          onOpenChange={setAddDialogOpen}
          onSave={handleAddTeacher}
          mode="add"
          nextEmployeeId={nextEmployeeId}
          institutionId={tenantId}
        />

        <AddEditTeacherDialog
          teacher={selectedTeacher}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSave={handleEditTeacher}
          mode="edit"
          institutionId={tenantId}
        />

        <DeleteTeacherDialog
          teacher={selectedTeacher}
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={handleDeleteTeacher}
        />
      </div>
    </Layout>
  );
};

export default Teachers;
