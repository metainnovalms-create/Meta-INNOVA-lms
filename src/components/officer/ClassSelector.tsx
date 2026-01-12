import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, BookOpen, Calendar, MapPin, Loader2, Play } from 'lucide-react';
import { useOfficerClasses } from '@/hooks/useOfficerClasses';

interface ClassSelectorProps {
  officerId: string;
  institutionId?: string;
  onClassSelect: (classId: string, className: string) => void;
  selectedClassId?: string;
}

export function ClassSelector({ 
  officerId, 
  institutionId, 
  onClassSelect, 
  selectedClassId 
}: ClassSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState<'all' | 'today'>('all');
  
  const { classes, todayClasses, todayDay, isLoading, hasClasses, hasTodayClasses } = useOfficerClasses(
    officerId,
    institutionId
  );

  // Get classes based on filter
  const displayClasses = classFilter === 'today' ? todayClasses : classes;

  // Filter by search query
  const filteredClasses = displayClasses.filter(c =>
    c.class_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.subjects.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Select a Class</h2>
          <p className="text-muted-foreground mt-1">
            Choose a class to start teaching or continue where you left off
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <Tabs value={classFilter} onValueChange={(v) => setClassFilter(v as 'all' | 'today')}>
        <TabsList>
          <TabsTrigger value="all" className="gap-2">
            <BookOpen className="h-4 w-4" />
            All Classes ({classes.length})
          </TabsTrigger>
          <TabsTrigger value="today" className="gap-2">
            <Calendar className="h-4 w-4" />
            Today's Classes ({todayClasses.length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Search */}
      <Input
        placeholder="Search classes or subjects..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="max-w-md"
      />

      {/* Classes Grid */}
      {!hasClasses ? (
        <Card className="p-12">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
                <BookOpen className="h-10 w-10 text-muted-foreground" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">No Classes Assigned</h3>
              <p className="text-sm text-muted-foreground">
                You don't have any classes assigned in the timetable yet.
              </p>
            </div>
          </div>
        </Card>
      ) : classFilter === 'today' && !hasTodayClasses ? (
        <Card className="p-12">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
                <Calendar className="h-10 w-10 text-muted-foreground" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">No Classes Today</h3>
              <p className="text-sm text-muted-foreground">
                You don't have any classes scheduled for {todayDay}.
              </p>
            </div>
          </div>
        </Card>
      ) : filteredClasses.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No classes found matching your search</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredClasses.map((classItem) => (
            <Card
              key={classItem.id}
              className={`cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] ${
                selectedClassId === classItem.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => onClassSelect(classItem.id, classItem.class_name)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{classItem.class_name}</CardTitle>
                    {classItem.room_number && (
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" />
                        {classItem.room_number}
                      </CardDescription>
                    )}
                  </div>
                  {classItem.days.includes(todayDay) && (
                    <Badge variant="default" className="bg-green-500/20 text-green-700 border-green-500/30">
                      Today
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{classItem.student_count} Students</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <BookOpen className="h-4 w-4" />
                    <span>
                      {classItem.subjects.length} {classItem.subjects.length === 1 ? 'Subject' : 'Subjects'}
                    </span>
                  </div>

                  {classItem.subjects.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-2">
                      {classItem.subjects.slice(0, 3).map((subject, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {subject}
                        </Badge>
                      ))}
                      {classItem.subjects.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{classItem.subjects.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}

                  {classItem.days.length > 0 && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground mb-1">Scheduled days:</p>
                      <div className="flex flex-wrap gap-1">
                        {classItem.days.map((day, idx) => (
                          <Badge 
                            key={idx} 
                            variant={day === todayDay ? "default" : "outline"} 
                            className="text-xs"
                          >
                            {day.slice(0, 3)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Start Teaching Button */}
                  <Button 
                    className="w-full mt-4" 
                    onClick={(e) => {
                      e.stopPropagation();
                      onClassSelect(classItem.id, classItem.class_name);
                    }}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start Teaching
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
