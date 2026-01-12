import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, BookOpen, FileText } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { getOfficerTimetable } from '@/data/mockOfficerTimetable';
import { OfficerTimetable, OfficerTimetableSlot } from '@/types/officer';
import { OfficerTimetablePreview } from '@/components/officer/OfficerTimetablePreview';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

const getDayName = (date: Date) => {
  return date.toLocaleDateString('en-US', { weekday: 'long' });
};

const getActivityIcon = (type: string) => {
  switch(type) {
    case 'workshop': return '🔧';
    case 'lab': return '🧪';
    case 'mentoring': return '👥';
    case 'project_review': return '📋';
    default: return '📚';
  }
};

const getActivityColor = (type: string) => {
  switch(type) {
    case 'workshop': return 'bg-blue-500/10 text-blue-500 border-blue-200 dark:border-blue-800';
    case 'lab': return 'bg-green-500/10 text-green-500 border-green-200 dark:border-green-800';
    case 'mentoring': return 'bg-yellow-500/10 text-yellow-500 border-yellow-200 dark:border-yellow-800';
    case 'project_review': return 'bg-purple-500/10 text-purple-500 border-purple-200 dark:border-purple-800';
    default: return 'bg-primary/10 text-primary';
  }
};

const getUpcomingSlots = (slots: OfficerTimetableSlot[], count: number = 10) => {
  const today = getDayName(new Date());
  const currentTime = new Date().toTimeString().slice(0, 5);
  const todayIndex = DAYS.indexOf(today as typeof DAYS[number]);
  
  const futureSlots = slots
    .filter(slot => {
      const slotDayIndex = DAYS.indexOf(slot.day);
      if (slotDayIndex === todayIndex) {
        return slot.start_time > currentTime;
      }
      return slotDayIndex > todayIndex;
    })
    .sort((a, b) => {
      const dayCompare = DAYS.indexOf(a.day) - DAYS.indexOf(b.day);
      if (dayCompare !== 0) return dayCompare;
      return a.start_time.localeCompare(b.start_time);
    });
  
  return futureSlots.slice(0, count);
};

export default function Sessions() {
  const { user } = useAuth();
  const { tenantId } = useParams();
  const [officerTimetable, setOfficerTimetable] = useState<OfficerTimetable | undefined>(undefined);
  const [activeTab, setActiveTab] = useState('week');
  
  // Load timetable from localStorage on mount and when user changes
  useEffect(() => {
    if (user?.id) {
      const timetable = getOfficerTimetable(user.id);
      setOfficerTimetable(timetable);
    }
  }, [user?.id]);
  
  const today = getDayName(new Date());
  const todaySlots = officerTimetable?.slots.filter(s => s.day === today).sort((a, b) => a.start_time.localeCompare(b.start_time)) || [];
  const upcomingSlots = getUpcomingSlots(officerTimetable?.slots || []);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">My Teaching Schedule</h1>
            <p className="text-muted-foreground">
              View your assigned timetable and manage class sessions
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-sm">
              {officerTimetable?.total_hours || 0} hours/week
            </Badge>
            <Badge 
              variant={officerTimetable?.status === 'assigned' ? 'default' : 'secondary'}
            >
              {officerTimetable?.status === 'assigned' ? 'Assigned' : 
               officerTimetable?.status === 'partial' ? 'Partial' : 'Not Assigned'}
            </Badge>
          </div>
        </div>

        {/* Stats Cards */}
        {officerTimetable && officerTimetable.slots.length > 0 && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Total Classes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{officerTimetable.slots.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {todaySlots.length} scheduled today
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Weekly Hours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{officerTimetable.total_hours}</div>
                <p className="text-xs text-muted-foreground mt-1">Teaching hours per week</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Activity Types
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Set(officerTimetable.slots.map(s => s.type)).size}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Different session types</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Classes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Set(officerTimetable.slots.map(s => s.class)).size}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Unique classes assigned</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabbed View */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="week">Weekly View</TabsTrigger>
            <TabsTrigger value="today">Today ({todaySlots.length})</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          </TabsList>

          {/* Weekly View Tab */}
          <TabsContent value="week" className="space-y-4">
            {!officerTimetable || officerTimetable.slots.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No Schedule Assigned</h3>
                  <p className="text-muted-foreground mb-4">
                    Contact your management team to get your teaching schedule assigned
                  </p>
                  <Badge variant="outline">Status: Not Assigned</Badge>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Weekly Timetable</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Your complete weekly teaching schedule
                  </p>
                </CardHeader>
                <CardContent>
                  <OfficerTimetablePreview slots={officerTimetable.slots} />
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Today Tab */}
          <TabsContent value="today" className="space-y-4">
            {todaySlots.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Clock className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No Classes Today</h3>
                  <p className="text-muted-foreground">You have no scheduled classes for {today}</p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                    {today}'s Schedule
                  </span>
                </div>
                {todaySlots.map(slot => (
                  <Card key={slot.id} className="border-l-4" style={{ borderLeftColor: 'hsl(var(--primary))' }}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={`p-3 rounded-lg border ${getActivityColor(slot.type)}`}>
                            <span className="text-2xl">{getActivityIcon(slot.type)}</span>
                          </div>
                          <div>
                            <CardTitle className="text-lg">{slot.subject}</CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                              {slot.class} • {slot.room}
                              {slot.batch && ` • ${slot.batch}`}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">
                                {slot.start_time} - {slot.end_time}
                              </span>
                              <Badge variant="outline" className="ml-2">{slot.type}</Badge>
                            </div>
                          </div>
                        </div>
                        <Button size="sm" asChild>
                          <Link to={`/tenant/${tenantId}/officer/attendance`}>
                            Start Session
                          </Link>
                        </Button>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </>
            )}
          </TabsContent>

          {/* Upcoming Tab */}
          <TabsContent value="upcoming" className="space-y-4">
            {upcomingSlots.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No Upcoming Classes</h3>
                  <p className="text-muted-foreground">
                    You have no scheduled classes for the rest of the week
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Showing your next {upcomingSlots.length} scheduled classes
                </p>
                {upcomingSlots.map(slot => (
                  <Card key={slot.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={`p-3 rounded-lg border ${getActivityColor(slot.type)}`}>
                            <span className="text-2xl">{getActivityIcon(slot.type)}</span>
                          </div>
                          <div>
                            <CardTitle className="text-lg">{slot.subject}</CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                              {slot.class} • {slot.room}
                              {slot.batch && ` • ${slot.batch}`}
                            </p>
                            <div className="flex items-center gap-4 mt-2">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{slot.day}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{slot.start_time} - {slot.end_time}</span>
                              </div>
                              <Badge variant="outline">{slot.type}</Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
