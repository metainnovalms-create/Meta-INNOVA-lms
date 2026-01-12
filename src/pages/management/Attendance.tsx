import { Layout } from "@/components/layout/Layout";
import { InstitutionHeader } from "@/components/management/InstitutionHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Users, GraduationCap, CalendarCheck, CheckCircle2, Clock, BarChart3 } from "lucide-react";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { OfficerAttendanceTab } from "@/components/attendance/OfficerAttendanceTab";
import { StudentAttendanceTab } from "@/components/attendance/StudentAttendanceTab";
import { ClassSessionAttendanceTab } from "@/components/attendance/ClassSessionAttendanceTab";
import { AttendanceStatisticsCharts } from "@/components/attendance/AttendanceStatisticsCharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { transformDbToApp } from "@/hooks/useInstitutions";
import { format, startOfDay, endOfDay } from "date-fns";

const Attendance = () => {
  const [activeTab, setActiveTab] = useState<'officers' | 'class-sessions' | 'students' | 'analytics'>('officers');
  
  // Get tenant slug from URL params
  const { tenantId } = useParams<{ tenantId: string }>();
  
  // Fetch institution directly by slug
  const { data: institution, isLoading } = useQuery({
    queryKey: ['institution-by-slug', tenantId],
    queryFn: async () => {
      if (!tenantId) return null;
      
      const { data, error } = await supabase
        .from('institutions')
        .select('*')
        .eq('slug', tenantId)
        .single();
      
      if (error) {
        console.error('[Attendance] Failed to fetch institution:', error);
        return null;
      }
      
      return transformDbToApp(data);
    },
    enabled: !!tenantId,
  });

  // Fetch actual student count from students table
  const { data: studentCount = 0 } = useQuery({
    queryKey: ['institution-student-count', institution?.id],
    queryFn: async () => {
      if (!institution?.id) return 0;
      
      const { count, error } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('institution_id', institution.id)
        .eq('status', 'active');
      
      if (error) {
        console.error('[Attendance] Failed to fetch student count:', error);
        return 0;
      }
      return count || 0;
    },
    enabled: !!institution?.id,
  });

  // Fetch today's quick stats
  const { data: todayStats } = useQuery({
    queryKey: ['attendance-today-stats', institution?.id],
    queryFn: async () => {
      if (!institution?.id) return null;
      
      const today = format(new Date(), 'yyyy-MM-dd');
      
      // Fetch today's class sessions
      const { data: sessions } = await supabase
        .from('class_session_attendance')
        .select('id, is_session_completed, students_present, students_late, total_students')
        .eq('institution_id', institution.id)
        .eq('date', today);
      
      // Fetch today's officer attendance
      const { data: officerAttendance } = await supabase
        .from('officer_attendance')
        .select('id, status')
        .eq('institution_id', institution.id)
        .eq('date', today);
      
      // Count officers assigned to this institution
      const { data: officers } = await supabase
        .from('officers')
        .select('id')
        .contains('assigned_institutions', [institution.id])
        .eq('status', 'active');
      
      const completedSessions = sessions?.filter(s => s.is_session_completed).length || 0;
      const totalSessions = sessions?.length || 0;
      const officersCheckedIn = officerAttendance?.filter(o => o.status === 'checked_in' || o.status === 'checked_out').length || 0;
      const totalOfficers = officers?.length || 0;
      
      return {
        completedSessions,
        totalSessions,
        officersCheckedIn,
        totalOfficers,
        hasAnyActivity: completedSessions > 0 || officersCheckedIn > 0,
      };
    },
    enabled: !!institution?.id,
  });
  
  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (!institution) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Institution not found
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="space-y-6">
        <InstitutionHeader 
          institutionName={institution.name}
          establishedYear={institution.established_year}
          location={institution.location}
          totalStudents={studentCount}
          academicYear="2024-25"
          userRole="Management Portal"
          assignedOfficers={[]}
        />
        
        <div>
          <h1 className="text-3xl font-bold">Attendance Management</h1>
          <p className="text-muted-foreground">Track attendance for officers, class sessions, and students</p>
        </div>

        {/* Today's Quick Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-l-4 border-l-primary">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Officers Today</p>
                  <p className="text-2xl font-bold">
                    {todayStats?.officersCheckedIn ?? 0} / {todayStats?.totalOfficers ?? 0}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {todayStats?.officersCheckedIn === 0 ? 'No check-ins yet' : 'checked in'}
                  </p>
                </div>
                <Users className="h-8 w-8 text-muted-foreground/50" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Sessions Completed Today</p>
                  <p className="text-2xl font-bold text-green-600">
                    {todayStats?.completedSessions ?? 0}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {todayStats?.completedSessions === 0 ? 'Awaiting first session' : 'classes marked'}
                  </p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-500/50" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-amber-500">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  {todayStats?.hasAnyActivity ? (
                    <>
                      <p className="text-2xl font-bold text-green-600">Active</p>
                      <p className="text-xs text-muted-foreground mt-1">Attendance being recorded</p>
                    </>
                  ) : (
                    <>
                      <p className="text-2xl font-bold text-amber-600">Awaiting</p>
                      <p className="text-xs text-muted-foreground mt-1">No activity recorded today</p>
                    </>
                  )}
                </div>
                {todayStats?.hasAnyActivity ? (
                  <CheckCircle2 className="h-8 w-8 text-green-500/50" />
                ) : (
                  <Clock className="h-8 w-8 text-amber-500/50" />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="grid w-full grid-cols-4 max-w-4xl">
            <TabsTrigger value="officers" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Innovation Officers
            </TabsTrigger>
            <TabsTrigger value="class-sessions" className="flex items-center gap-2">
              <CalendarCheck className="h-4 w-4" />
              Class Sessions
            </TabsTrigger>
            <TabsTrigger value="students" className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Students
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="officers" className="mt-6">
            <OfficerAttendanceTab institutionId={institution.id} />
          </TabsContent>
          
          <TabsContent value="class-sessions" className="mt-6">
            <ClassSessionAttendanceTab institutionId={institution.id} />
          </TabsContent>
          
          <TabsContent value="students" className="mt-6">
            <StudentAttendanceTab institutionId={institution.id} />
          </TabsContent>
          
          <TabsContent value="analytics" className="mt-6">
            <AttendanceStatisticsCharts institutionId={institution.id} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Attendance;