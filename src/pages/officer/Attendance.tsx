import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Download, Clock, UserCheck, UserX, AlertCircle, Users, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useOfficerByUserId } from "@/hooks/useOfficerProfile";
import { 
  useOfficerClassAttendance, 
  useSaveClassAttendance, 
  useMarkSessionCompleted,
  AttendanceRecord 
} from "@/hooks/useClassSessionAttendance";
import { useReceivedAccessGrants } from "@/hooks/useOfficerClassAccess";
import { Skeleton } from "@/components/ui/skeleton";

interface ClassSession {
  id: string;
  timetable_assignment_id: string;
  title: string;
  className: string;
  classId: string;
  section: string;
  date: string;
  startTime: string;
  endTime: string;
  subject: string;
  periodLabel: string;
  accessType?: 'primary' | 'secondary' | 'backup' | 'delegated';
}

interface StudentRecord {
  id: string;
  student_name: string;
  roll_number: string;
  avatar?: string;
  status: "present" | "absent" | "late";
  check_in_time?: string;
}

const Attendance = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [availableSessions, setAvailableSessions] = useState<ClassSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>("");
  const [attendance, setAttendance] = useState<StudentRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  
  // Get officer profile from Supabase
  const { data: officerProfile, isLoading: isLoadingOfficer } = useOfficerByUserId(user?.id);
  const primaryInstitutionId = officerProfile?.assigned_institutions?.[0] || '';
  
  // Get saved attendance for today
  const { data: savedAttendance, isLoading: isLoadingAttendance } = useOfficerClassAttendance(
    officerProfile?.id,
    selectedDate
  );
  
  // Mutations
  const saveAttendanceMutation = useSaveClassAttendance();
  const markCompletedMutation = useMarkSessionCompleted();

  // Get delegated access grants for today
  const { data: accessGrants } = useReceivedAccessGrants(officerProfile?.id);

  // Load officer's timetable assignments from Supabase (including delegated classes)
  useEffect(() => {
    const loadTimetable = async () => {
      if (!officerProfile?.id || !primaryInstitutionId) return;
      
      const dayOfWeek = new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long' });
      const today = new Date().toISOString().split('T')[0];
      const isToday = selectedDate === today;
      
      // Fetch assignments where officer is primary, secondary, or backup
      const { data, error } = await supabase
        .from('institution_timetable_assignments')
        .select(`
          *,
          institution_periods!inner (
            label,
            start_time,
            end_time
          )
        `)
        .eq('institution_id', primaryInstitutionId)
        .eq('day', dayOfWeek)
        .or(`teacher_id.eq.${officerProfile.id},secondary_officer_id.eq.${officerProfile.id},backup_officer_id.eq.${officerProfile.id}`);
      
      if (error) {
        console.error('Error loading timetable:', error);
        return;
      }
      
      const sessions: ClassSession[] = (data || []).map(slot => {
        let accessType: ClassSession['accessType'] = 'primary';
        if (slot.teacher_id === officerProfile.id) {
          accessType = 'primary';
        } else if (slot.secondary_officer_id === officerProfile.id) {
          accessType = 'secondary';
        } else if (slot.backup_officer_id === officerProfile.id) {
          accessType = 'backup';
        }
        
        return {
          id: slot.id,
          timetable_assignment_id: slot.id,
          title: `${slot.subject} - ${slot.class_name}`,
          className: slot.class_name,
          classId: slot.class_id,
          section: 'A',
          date: selectedDate,
          startTime: (slot.institution_periods as any)?.start_time || '',
          endTime: (slot.institution_periods as any)?.end_time || '',
          subject: slot.subject,
          periodLabel: (slot.institution_periods as any)?.label || '',
          accessType,
        };
      });
      
      // Add delegated classes (only for today)
      if (isToday && accessGrants && accessGrants.length > 0) {
        for (const grant of accessGrants) {
          // Fetch timetable assignments for delegated class
          const { data: delegatedAssignments } = await supabase
            .from('institution_timetable_assignments')
            .select(`
              *,
              institution_periods!inner (
                label,
                start_time,
                end_time
              )
            `)
            .eq('class_id', grant.class_id)
            .eq('institution_id', primaryInstitutionId)
            .eq('day', dayOfWeek);
          
          if (delegatedAssignments) {
            for (const slot of delegatedAssignments) {
              // Check if this slot is already in sessions
              const exists = sessions.find(s => s.id === slot.id);
              if (!exists) {
                sessions.push({
                  id: slot.id,
                  timetable_assignment_id: slot.id,
                  title: `${slot.subject} - ${slot.class_name}`,
                  className: slot.class_name,
                  classId: slot.class_id,
                  section: 'A',
                  date: selectedDate,
                  startTime: (slot.institution_periods as any)?.start_time || '',
                  endTime: (slot.institution_periods as any)?.end_time || '',
                  subject: slot.subject,
                  periodLabel: (slot.institution_periods as any)?.label || '',
                  accessType: 'delegated',
                });
              }
            }
          }
        }
      }
      
      // Sort by start time
      sessions.sort((a, b) => a.startTime.localeCompare(b.startTime));
      
      setAvailableSessions(sessions);
      if (sessions.length > 0 && !selectedSession) {
        setSelectedSession(sessions[0].id);
      }
    };
    
    loadTimetable();
  }, [officerProfile?.id, primaryInstitutionId, selectedDate, accessGrants]);

  // Load students when session is selected
  useEffect(() => {
    const loadStudents = async () => {
      if (!selectedSession || !primaryInstitutionId) return;
      
      const session = availableSessions.find(s => s.id === selectedSession);
      if (!session) return;
      
      setIsLoadingStudents(true);
      
      try {
        // Load students for the selected class
        const { data: students, error } = await supabase
          .from('students')
          .select('id, student_name, roll_number, avatar')
          .eq('class_id', session.classId)
          .eq('institution_id', primaryInstitutionId)
          .eq('status', 'active');
        
        if (error) throw error;
        
        // Check if we have saved attendance for this session
        const savedRecord = savedAttendance?.find(
          a => a.timetable_assignment_id === selectedSession
        );
        
        // Initialize attendance records
        const attendanceRecords: StudentRecord[] = (students || []).map(student => {
          // Check if there's saved status for this student
          const savedStatus = savedRecord?.attendance_records?.find(
            (r: AttendanceRecord) => r.student_id === student.id
          );
          
          return {
            id: student.id,
            student_name: student.student_name,
            roll_number: student.roll_number || '',
            avatar: student.avatar || undefined,
            status: savedStatus?.status || "absent",
            check_in_time: savedStatus?.check_in_time,
          };
        });
        
        setAttendance(attendanceRecords);
      } catch (error) {
        console.error('Error loading students:', error);
        toast.error('Failed to load students');
      } finally {
        setIsLoadingStudents(false);
      }
    };
    
    loadStudents();
  }, [selectedSession, availableSessions, primaryInstitutionId, savedAttendance]);

  const handleMarkAttendance = (studentId: string, status: "present" | "absent" | "late") => {
    setAttendance(prev =>
      prev.map(record =>
        record.id === studentId
          ? {
              ...record,
              status,
              check_in_time: status !== "absent" ? format(new Date(), 'hh:mm a') : undefined,
            }
          : record
      )
    );
  };

  const handleMarkAllPresent = () => {
    setAttendance(prev =>
      prev.map(record => ({
        ...record,
        status: "present" as const,
        check_in_time: format(new Date(), 'hh:mm a'),
      }))
    );
    toast.success("Marked all students present");
  };

  const handleMarkAllAbsent = () => {
    setAttendance(prev =>
      prev.map(record => ({
        ...record,
        status: "absent" as const,
        check_in_time: undefined,
      }))
    );
    toast.success("Marked all students absent");
  };

  const handleSaveAttendance = async () => {
    if (!selectedSession || !officerProfile?.id || !primaryInstitutionId) return;

    const session = availableSessions.find(s => s.id === selectedSession);
    if (!session) return;

    try {
      const attendanceRecords: AttendanceRecord[] = attendance.map(record => ({
        student_id: record.id,
        student_name: record.student_name,
        roll_number: record.roll_number,
        status: record.status,
        check_in_time: record.check_in_time,
      }));
      
      await saveAttendanceMutation.mutateAsync({
        timetable_assignment_id: session.timetable_assignment_id,
        class_id: session.classId,
        institution_id: primaryInstitutionId,
        officer_id: officerProfile.id,
        date: selectedDate,
        period_label: session.periodLabel,
        period_time: `${session.startTime} - ${session.endTime}`,
        subject: session.subject,
        attendance_records: attendanceRecords,
      });

      toast.success("Attendance saved successfully!");
    } catch (error) {
      console.error("Failed to save attendance:", error);
      toast.error("Failed to save attendance. Please try again.");
    }
  };

  const handleMarkSessionCompleted = async () => {
    if (!selectedSession || !officerProfile?.id) return;
    
    // First save attendance
    await handleSaveAttendance();
    
    // Find the saved attendance record
    const savedRecord = savedAttendance?.find(
      a => a.timetable_assignment_id === selectedSession
    );
    
    if (savedRecord) {
      try {
        await markCompletedMutation.mutateAsync({
          attendanceId: savedRecord.id,
          officerId: officerProfile.id,
        });
        toast.success("Session marked as completed!");
      } catch (error) {
        console.error("Failed to mark session completed:", error);
        toast.error("Failed to mark session completed");
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "present":
        return <Badge className="bg-green-500 hover:bg-green-600"><UserCheck className="h-3 w-3 mr-1" /> Present</Badge>;
      case "late":
        return <Badge className="bg-yellow-500 hover:bg-yellow-600"><Clock className="h-3 w-3 mr-1" /> Late</Badge>;
      case "absent":
        return <Badge variant="destructive"><UserX className="h-3 w-3 mr-1" /> Absent</Badge>;
      default:
        return null;
    }
  };

  const filteredAttendance = attendance.filter(record =>
    record.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.roll_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: attendance.length,
    present: attendance.filter(r => r.status === "present").length,
    absent: attendance.filter(r => r.status === "absent").length,
    late: attendance.filter(r => r.status === "late").length,
  };
  
  const attendanceRate = stats.total > 0 
    ? ((stats.present + stats.late) / stats.total * 100).toFixed(1)
    : "0";

  const selectedSessionData = availableSessions.find(s => s.id === selectedSession);
  
  // Check if current session is already completed
  const isSessionCompleted = savedAttendance?.find(
    a => a.timetable_assignment_id === selectedSession
  )?.is_session_completed || false;

  const handleExportCSV = () => {
    if (!selectedSessionData) return;

    const csvContent = [
      ['Class', 'Section', 'Date', 'Time', 'Student Name', 'Roll Number', 'Status', 'Check-in Time'],
      ...attendance.map(record => [
        selectedSessionData.className,
        selectedSessionData.section,
        selectedSessionData.date,
        `${selectedSessionData.startTime}-${selectedSessionData.endTime}`,
        record.student_name,
        record.roll_number,
        record.status,
        record.check_in_time || '-'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance_${selectedSessionData.className}_${selectedSessionData.section}_${selectedSessionData.date}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
    toast.success("Attendance report exported");
  };

  if (isLoadingOfficer) {
    return (
      <Layout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-48 w-full" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Class Attendance</h1>
            <p className="text-muted-foreground">Mark student attendance for your scheduled classes</p>
          </div>
          <Button variant="outline" className="gap-2" onClick={handleExportCSV} disabled={!selectedSession || attendance.length === 0}>
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>

        {/* Date & Session Selector */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Select Date & Class Session
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Date</label>
              <Input 
                type="date" 
                value={selectedDate} 
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSelectedSession("");
                }}
                className="max-w-xs"
              />
            </div>
            
            {availableSessions.length > 0 ? (
              <div>
                <label className="text-sm font-medium mb-2 block">Class Session</label>
                <Select value={selectedSession} onValueChange={setSelectedSession}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a class session" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSessions.map((session) => (
                      <SelectItem key={session.id} value={session.id}>
                        <div className="flex items-center gap-2">
                          <span>{session.className} - {session.subject} ({session.startTime} - {session.endTime})</span>
                          {session.accessType === 'delegated' && (
                            <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded">Delegated</span>
                          )}
                          {session.accessType === 'secondary' && (
                            <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded">Secondary</span>
                          )}
                          {session.accessType === 'backup' && (
                            <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-1.5 py-0.5 rounded">Backup</span>
                          )}
                          {savedAttendance?.find(a => a.timetable_assignment_id === session.id)?.is_session_completed && (
                            <span className="text-xs text-green-600">✓ Completed</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
                <AlertCircle className="h-5 w-5 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No classes scheduled for this date</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Cards */}
        {selectedSession && attendance.length > 0 && (
          <div className="grid gap-4 md:grid-cols-5">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Present</CardTitle>
                <UserCheck className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">{stats.present}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Late</CardTitle>
                <Clock className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-500">{stats.late}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Absent</CardTitle>
                <UserX className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">{stats.absent}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{attendanceRate}%</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Attendance Table */}
        {selectedSession && (isLoadingStudents || isLoadingAttendance ? (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        ) : attendance.length > 0 ? (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle>Student Attendance - {selectedSessionData?.className}</CardTitle>
                  {isSessionCompleted && (
                    <Badge className="bg-green-500">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Session Completed
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleMarkAllPresent}>
                    <UserCheck className="h-4 w-4 mr-2" />
                    Mark All Present
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleMarkAllAbsent}>
                    <UserX className="h-4 w-4 mr-2" />
                    Mark All Absent
                  </Button>
                  <Input
                    placeholder="Search students..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="max-w-xs"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Roll Number</TableHead>
                    <TableHead>Check-in Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAttendance.length > 0 ? (
                    filteredAttendance.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={record.avatar} />
                              <AvatarFallback>{record.student_name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{record.student_name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{record.roll_number}</TableCell>
                        <TableCell>{record.check_in_time || "-"}</TableCell>
                        <TableCell>{getStatusBadge(record.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant={record.status === "present" ? "default" : "outline"}
                              onClick={() => handleMarkAttendance(record.id, "present")}
                              disabled={isSessionCompleted}
                            >
                              <UserCheck className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant={record.status === "late" ? "default" : "outline"}
                              onClick={() => handleMarkAttendance(record.id, "late")}
                              disabled={isSessionCompleted}
                            >
                              <Clock className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant={record.status === "absent" ? "destructive" : "outline"}
                              onClick={() => handleMarkAttendance(record.id, "absent")}
                              disabled={isSessionCompleted}
                            >
                              <UserX className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No students found matching "{searchQuery}"
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleSaveAttendance} 
                  disabled={saveAttendanceMutation.isPending || isSessionCompleted}
                >
                  {saveAttendanceMutation.isPending ? "Saving..." : "Save Attendance"}
                </Button>
                <Button 
                  onClick={handleMarkSessionCompleted} 
                  disabled={markCompletedMutation.isPending || isSessionCompleted}
                  className="gap-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {markCompletedMutation.isPending ? "Completing..." : "Mark Session Complete"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No students found for this class</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </Layout>
  );
};

export default Attendance;
