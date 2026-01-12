import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { SchoolTeacher, TeacherTimetable, TimetableSlot } from "@/types/teacher";
import { TimetableAssignmentDialog } from "./TimetableAssignmentDialog";
import { TimetablePreviewCard } from "./TimetablePreviewCard";
import { Search, Calendar, Clock, CheckCircle, AlertCircle, XCircle, Edit, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimetableManagementTabProps {
  teachers: SchoolTeacher[];
  timetables: TeacherTimetable[];
  onSaveTimetable: (teacherId: string, slots: TimetableSlot[]) => void;
  highlightTeacherId?: string;
}

export function TimetableManagementTab({ 
  teachers, 
  timetables, 
  onSaveTimetable,
  highlightTeacherId 
}: TimetableManagementTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [selectedTeacher, setSelectedTeacher] = useState<SchoolTeacher | null>(null);
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const getTimetableForTeacher = (teacherId: string): TeacherTimetable | undefined => {
    return timetables.find(t => t.teacher_id === teacherId);
  };

  const getStatusInfo = (teacherId: string) => {
    const timetable = getTimetableForTeacher(teacherId);
    if (!timetable || timetable.slots.length === 0) {
      return { status: 'not_assigned', label: 'Not Assigned', variant: 'destructive', icon: XCircle };
    }
    if (timetable.total_hours < 20) {
      return { status: 'partial', label: 'Partial', variant: 'secondary', icon: AlertCircle };
    }
    return { status: 'assigned', label: 'Assigned', variant: 'default', icon: CheckCircle };
  };

  const filteredTeachers = teachers.filter(teacher => {
    const matchesSearch = 
      teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.employee_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.subjects.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const statusInfo = getStatusInfo(teacher.id);
    const matchesStatus = statusFilter === "all" || statusInfo.status === statusFilter;
    
    const matchesSubject = 
      subjectFilter === "all" || 
      teacher.subjects.includes(subjectFilter);
    
    return matchesSearch && matchesStatus && matchesSubject;
  });

  const handleOpenAssignment = (teacher: SchoolTeacher) => {
    setSelectedTeacher(teacher);
    setAssignmentDialogOpen(true);
  };

  const handleSaveTimetable = (slots: TimetableSlot[]) => {
    if (!selectedTeacher) return;
    onSaveTimetable(selectedTeacher.id, slots);
  };

  const toggleRowExpansion = (teacherId: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(teacherId)) {
        next.delete(teacherId);
      } else {
        next.add(teacherId);
      }
      return next;
    });
  };

  const totalTeachers = teachers.length;
  const assignedCount = teachers.filter(t => getStatusInfo(t.id).status === 'assigned').length;
  const pendingCount = teachers.filter(t => getStatusInfo(t.id).status === 'not_assigned').length;
  const avgHours = timetables.length > 0 
    ? (timetables.reduce((sum, t) => sum + t.total_hours, 0) / timetables.length).toFixed(1)
    : '0';

  const uniqueSubjects = Array.from(new Set(teachers.flatMap(t => t.subjects))).sort();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Manage Teacher Timetables</h2>
        <p className="text-muted-foreground">Assign and edit weekly schedules for all teachers</p>
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
              <Calendar className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Timetables Assigned</p>
                <p className="text-2xl font-bold">{assignedCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Assignment</p>
                <p className="text-2xl font-bold">{pendingCount}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Teaching Hours</p>
                <p className="text-2xl font-bold">{avgHours} hrs</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
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
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Filter by Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="assigned">Assigned</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
            <SelectItem value="not_assigned">Not Assigned</SelectItem>
          </SelectContent>
        </Select>
        <Select value={subjectFilter} onValueChange={setSubjectFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Filter by Subject" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            {uniqueSubjects.map(subject => (
              <SelectItem key={subject} value={subject}>{subject}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Teacher Timetable Table */}
      <div className="space-y-3">
        {filteredTeachers.map((teacher) => {
          const timetable = getTimetableForTeacher(teacher.id);
          const statusInfo = getStatusInfo(teacher.id);
          const StatusIcon = statusInfo.icon;
          const isExpanded = expandedRows.has(teacher.id);
          const isHighlighted = highlightTeacherId === teacher.id;

          return (
            <Card 
              key={teacher.id} 
              className={cn(
                "transition-all",
                isHighlighted && "ring-2 ring-primary shadow-lg"
              )}
            >
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Main Row */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-lg">{teacher.name}</h3>
                        <Badge variant="outline" className="text-xs">
                          {teacher.employee_id}
                        </Badge>
                        <Badge variant={statusInfo.variant as any}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusInfo.label}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {teacher.subjects.map(subject => (
                          <Badge key={subject} variant="secondary" className="text-xs">
                            {subject}
                          </Badge>
                        ))}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Classes: {teacher.classes_taught.join(', ')}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{timetable?.total_hours || 0}</div>
                        <div className="text-xs text-muted-foreground">hrs/week</div>
                      </div>
                      <div className="flex gap-2">
                        {timetable && timetable.slots.length > 0 ? (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => toggleRowExpansion(teacher.id)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              {isExpanded ? 'Hide' : 'View'}
                            </Button>
                            <Button 
                              size="sm"
                              onClick={() => handleOpenAssignment(teacher)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                          </>
                        ) : (
                          <Button 
                            size="sm"
                            onClick={() => handleOpenAssignment(teacher)}
                          >
                            <Calendar className="h-4 w-4 mr-1" />
                            Assign Timetable
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Preview */}
                  {isExpanded && timetable && timetable.slots.length > 0 && (
                    <div className="pt-4 border-t">
                      <TimetablePreviewCard slots={timetable.slots} />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filteredTeachers.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No teachers found matching your search criteria.</p>
          </div>
        )}
      </div>

      {/* Assignment Dialog */}
      <TimetableAssignmentDialog
        open={assignmentDialogOpen}
        onOpenChange={setAssignmentDialogOpen}
        teacher={selectedTeacher}
        existingSlots={selectedTeacher ? getTimetableForTeacher(selectedTeacher.id)?.slots : []}
        onSave={handleSaveTimetable}
      />
    </div>
  );
}
