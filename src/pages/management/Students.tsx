import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { StudentDetailsDialog } from "@/components/student/StudentDetailsDialog";
import { 
  getStatusColor, 
  calculateAge, 
  exportStudentsToCSV
} from "@/utils/studentHelpers";
import { Download, Search, Users, UserCheck, UserX, GraduationCap, Phone, ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Layout } from "@/components/layout/Layout";
import { InstitutionHeader } from "@/components/management/InstitutionHeader";
import { useCurrentUserInstitutionDetails } from "@/hooks/useCurrentUserInstitution";
import { useStudents, DbStudent } from "@/hooks/useStudents";
import { useClasses, ClassWithStudentCount } from "@/hooks/useClasses";
import { Student } from "@/types/student";

// Convert DbStudent to Student type for compatibility with existing components
function dbStudentToStudent(dbStudent: DbStudent, className?: string, section?: string): Student {
  return {
    id: dbStudent.id,
    student_id: dbStudent.student_id,
    student_name: dbStudent.student_name,
    roll_number: dbStudent.roll_number || '',
    admission_number: dbStudent.admission_number || '',
    class: className || 'Unassigned',
    section: section || '',
    date_of_birth: dbStudent.date_of_birth || '',
    gender: (dbStudent.gender || 'male') as 'male' | 'female' | 'other',
    blood_group: dbStudent.blood_group || '',
    avatar: dbStudent.avatar || '',
    admission_date: dbStudent.admission_date || '',
    previous_school: dbStudent.previous_school || '',
    parent_name: dbStudent.parent_name || '',
    parent_phone: dbStudent.parent_phone || '',
    address: dbStudent.address || '',
    email: dbStudent.email || '',
    status: (dbStudent.status || 'active') as 'active' | 'inactive' | 'transferred' | 'graduated',
    institution_id: dbStudent.institution_id,
    class_id: dbStudent.class_id || '',
    created_at: dbStudent.created_at || '',
  };
}

export default function Students() {
  // Fetch current user's institution
  const { institution, institutionId, isLoading: isLoadingInstitution } = useCurrentUserInstitutionDetails();
  
  // Fetch students and classes for the institution
  const { students: dbStudents, isLoading: isLoadingStudents } = useStudents(institutionId || undefined);
  const { classesWithCounts, isLoading: isLoadingClasses } = useClasses(institutionId || undefined);

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [expandedClasses, setExpandedClasses] = useState<Set<string>>(new Set());

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Create a map of class ID to class info
  const classMap = useMemo(() => {
    const map = new Map<string, ClassWithStudentCount>();
    classesWithCounts.forEach(cls => {
      map.set(cls.id, cls);
    });
    return map;
  }, [classesWithCounts]);

  // Convert DB students to Student type with class info
  const students = useMemo(() => {
    return dbStudents.map(dbStudent => {
      const classInfo = dbStudent.class_id ? classMap.get(dbStudent.class_id) : null;
      return dbStudentToStudent(
        dbStudent, 
        classInfo?.class_name, 
        classInfo?.section || undefined
      );
    });
  }, [dbStudents, classMap]);

  // Calculate statistics
  const totalStudents = students.length;
  const activeStudents = students.filter(s => s.status === 'active').length;
  const boys = students.filter(s => s.gender === 'male').length;
  const girls = students.filter(s => s.gender === 'female').length;
  const uniqueClasses = classesWithCounts.length;

  // Filter students
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const searchMatch = 
        searchQuery === '' ||
        student.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.roll_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.admission_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.parent_name.toLowerCase().includes(searchQuery.toLowerCase());
      
      const classMatch = classFilter === 'all' || student.class_id === classFilter;
      const sectionMatch = sectionFilter === 'all' || student.section === sectionFilter;
      const genderMatch = genderFilter === 'all' || student.gender === genderFilter;
      const statusMatch = statusFilter === 'all' || student.status === statusFilter;
      
      return searchMatch && classMatch && sectionMatch && genderMatch && statusMatch;
    });
  }, [students, searchQuery, classFilter, sectionFilter, genderFilter, statusFilter]);

  // Group students by class
  const studentsByClass = useMemo(() => {
    const grouped = new Map<string, { classInfo: ClassWithStudentCount | null; students: Student[] }>();
    
    // Initialize with all classes
    classesWithCounts.forEach(cls => {
      grouped.set(cls.id, { classInfo: cls, students: [] });
    });
    
    // Add unassigned group
    grouped.set('unassigned', { classInfo: null, students: [] });
    
    // Group filtered students
    filteredStudents.forEach(student => {
      const classId = student.class_id || 'unassigned';
      const group = grouped.get(classId);
      if (group) {
        group.students.push(student);
      } else {
        // Class might not exist anymore
        const unassigned = grouped.get('unassigned');
        if (unassigned) {
          unassigned.students.push(student);
        }
      }
    });
    
    // Convert to array and sort by display order
    return Array.from(grouped.entries())
      .map(([id, data]) => ({ id, ...data }))
      .filter(group => group.students.length > 0 || (group.classInfo && classFilter === 'all'))
      .sort((a, b) => {
        if (a.id === 'unassigned') return 1;
        if (b.id === 'unassigned') return -1;
        return (a.classInfo?.display_order || 0) - (b.classInfo?.display_order || 0);
      });
  }, [filteredStudents, classesWithCounts, classFilter]);

  // Toggle class expansion
  const toggleClass = (classId: string) => {
    setExpandedClasses(prev => {
      const next = new Set(prev);
      if (next.has(classId)) {
        next.delete(classId);
      } else {
        next.add(classId);
      }
      return next;
    });
  };

  // Expand all classes
  const expandAll = () => {
    setExpandedClasses(new Set(studentsByClass.map(g => g.id)));
  };

  // Handlers
  const handleStudentClick = (student: Student) => {
    setSelectedStudent(student);
    setDetailsDialogOpen(true);
  };

  const handleExportStudents = () => {
    exportStudentsToCSV(filteredStudents, `students-${institutionId}-${new Date().toISOString().split('T')[0]}.csv`);
    toast.success('Students exported successfully');
  };

  // Get unique sections from classes
  const sections = useMemo(() => {
    return [...new Set(classesWithCounts.map(c => c.section).filter(Boolean))] as string[];
  }, [classesWithCounts]);

  const isLoading = isLoadingInstitution || isLoadingStudents || isLoadingClasses;

  // Get institution settings for header
  const institutionSettings = institution?.settings as Record<string, any> || {};
  const institutionAddress = institution?.address as Record<string, any> || {};

  return (
    <Layout>
      <div className="container mx-auto py-6 space-y-6">
        {institution && (
          <InstitutionHeader 
            institutionName={institution.name}
            establishedYear={institutionSettings.established_year || new Date().getFullYear()}
            location={institutionAddress.location || ''}
            totalStudents={totalStudents}
            academicYear={institutionSettings.academic_year || '2024-25'}
            userRole="Management Portal"
            assignedOfficers={[]}
          />
        )}

        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Student Management</h1>
            <p className="text-muted-foreground">View and monitor student information by class</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={expandAll}>
              Expand All
            </Button>
            <Button variant="outline" onClick={handleExportStudents}>
              <Download className="h-4 w-4 mr-2" />
              Export Students
            </Button>
          </div>
        </div>

        {/* Info Card */}
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
          <CardContent className="flex items-start gap-3 py-4">
            <Users className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Student Management Access
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Adding and removing students is managed by the System Admin team. 
                You can view student details, export data, and monitor student information.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? '-' : totalStudents}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Students</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? '-' : activeStudents}</div>
              <p className="text-xs text-muted-foreground">
                {totalStudents > 0 ? ((activeStudents / totalStudents) * 100).toFixed(1) : 0}% of total
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Boys / Girls</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? '-' : `${boys} / ${girls}`}</div>
              <p className="text-xs text-muted-foreground">
                Gender distribution
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Classes</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? '-' : uniqueClasses}</div>
              <p className="text-xs text-muted-foreground">
                Active class sections
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Search and filter students</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, roll number, admission number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={classFilter} onValueChange={setClassFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classesWithCounts.map(cls => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.class_name} ({cls.student_count || 0})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={genderFilter} onValueChange={setGenderFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="All Genders" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Genders</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="transferred">Transferred</SelectItem>
                  <SelectItem value="graduated">Graduated</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-muted-foreground">
              Showing {filteredStudents.length} of {totalStudents} students
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-3 text-muted-foreground">Loading students...</span>
            </CardContent>
          </Card>
        )}

        {/* Class-wise Student List */}
        {!isLoading && (
          <div className="space-y-4">
            {studentsByClass.map((group) => (
              <Collapsible 
                key={group.id} 
                open={expandedClasses.has(group.id)}
                onOpenChange={() => toggleClass(group.id)}
              >
                <Card>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {expandedClasses.has(group.id) ? (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          )}
                          <div>
                            <CardTitle className="text-lg">
                              {group.classInfo 
                                ? group.classInfo.class_name
                                : 'Unassigned Students'
                              }
                            </CardTitle>
                            {group.classInfo?.room_number && (
                              <CardDescription>Room: {group.classInfo.room_number}</CardDescription>
                            )}
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-sm">
                          {group.students.length} students
                        </Badge>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      {group.students.length === 0 ? (
                        <p className="text-muted-foreground text-center py-4">
                          No students in this class
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {group.students.map(student => (
                            <Card 
                              key={student.id} 
                              className="cursor-pointer hover:shadow-lg transition-shadow"
                              onClick={() => handleStudentClick(student)}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-start gap-3">
                                  <Avatar className="h-12 w-12">
                                    <AvatarImage src={student.avatar} alt={student.student_name} />
                                    <AvatarFallback>{student.student_name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="min-w-0">
                                        <h3 className="font-semibold truncate">{student.student_name}</h3>
                                        <p className="text-xs text-muted-foreground">
                                          {student.roll_number || student.student_id}
                                        </p>
                                      </div>
                                      <Badge className={getStatusColor(student.status)} variant="secondary">
                                        {student.status}
                                      </Badge>
                                    </div>
                                    <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                                      <div className="flex items-center gap-1">
                                        <Users className="h-3 w-3" />
                                        <span>
                                          {student.gender === 'male' ? '👨' : student.gender === 'female' ? '👩' : '🧑'} {student.gender} 
                                          {student.blood_group && ` | 🩸 ${student.blood_group}`}
                                          {student.date_of_birth && ` | Age: ${calculateAge(student.date_of_birth)}`}
                                        </span>
                                      </div>
                                      {student.parent_phone && (
                                        <div className="flex items-center gap-1">
                                          <Phone className="h-3 w-3" />
                                          <span className="truncate">{student.parent_phone}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            ))}

            {studentsByClass.length === 0 && !isLoading && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <UserX className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">No students found</p>
                  <p className="text-sm text-muted-foreground">
                    {filteredStudents.length === 0 && students.length > 0 
                      ? 'Try adjusting your filters' 
                      : 'No students have been added to this institution yet'}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Dialog */}
        <StudentDetailsDialog
          isOpen={detailsDialogOpen}
          onOpenChange={setDetailsDialogOpen}
          student={selectedStudent}
          readOnly={true}
        />
      </div>
    </Layout>
  );
}
