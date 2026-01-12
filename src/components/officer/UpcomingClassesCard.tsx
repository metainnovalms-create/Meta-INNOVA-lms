/**
 * Card showing officer's upcoming classes with ability to transfer/delegate
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar, Users, ArrowRightLeft, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, addDays } from 'date-fns';
import { GrantClassAccessDialog } from './GrantClassAccessDialog';

interface UpcomingClassesCardProps {
  officerId: string;
  institutionId: string;
}

interface TimetableSlot {
  id: string;
  day: string;
  subject: string;
  class_id: string;
  class_name: string;
  room: string | null;
  period_id: string;
  period_label?: string;
  period_time?: string;
}

const getDayName = (date: Date) => {
  return date.toLocaleDateString('en-US', { weekday: 'long' });
};

export function UpcomingClassesCard({ officerId, institutionId }: UpcomingClassesCardProps) {
  const [selectedSlot, setSelectedSlot] = useState<TimetableSlot | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const today = new Date();
  const tomorrow = addDays(today, 1);
  const todayName = getDayName(today);
  const tomorrowName = getDayName(tomorrow);

  // Fetch officer's timetable assignments
  const { data: timetableSlots = [], isLoading } = useQuery({
    queryKey: ['officer-timetable-slots', officerId, institutionId],
    queryFn: async () => {
      // Fetch assignments where officer is primary, secondary, or backup
      const { data, error } = await supabase
        .from('institution_timetable_assignments')
        .select(`
          id,
          day,
          subject,
          class_id,
          class_name,
          room,
          period_id,
          institution_periods!inner(label, start_time, end_time)
        `)
        .eq('institution_id', institutionId)
        .or(`teacher_id.eq.${officerId},secondary_officer_id.eq.${officerId},backup_officer_id.eq.${officerId}`)
        .in('day', [todayName, tomorrowName]);

      if (error) throw error;
      
      return (data || []).map((slot: any) => ({
        id: slot.id,
        day: slot.day,
        subject: slot.subject,
        class_id: slot.class_id,
        class_name: slot.class_name,
        room: slot.room,
        period_id: slot.period_id,
        period_label: slot.institution_periods?.label,
        period_time: slot.institution_periods 
          ? `${slot.institution_periods.start_time} - ${slot.institution_periods.end_time}`
          : undefined,
      })) as TimetableSlot[];
    },
    enabled: !!officerId && !!institutionId,
  });

  // Get current time to filter past slots for today
  const currentTime = format(today, 'HH:mm');
  
  const todaySlots = timetableSlots
    .filter(slot => slot.day === todayName)
    .filter(slot => {
      // Only show future slots for today
      if (slot.period_time) {
        const startTime = slot.period_time.split(' - ')[0];
        return startTime > currentTime;
      }
      return true;
    })
    .sort((a, b) => (a.period_time || '').localeCompare(b.period_time || ''));

  const tomorrowSlots = timetableSlots
    .filter(slot => slot.day === tomorrowName)
    .sort((a, b) => (a.period_time || '').localeCompare(b.period_time || ''));

  const handleTransferClick = (slot: TimetableSlot) => {
    setSelectedSlot(slot);
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Classes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (todaySlots.length === 0 && tomorrowSlots.length === 0) {
    return null; // Don't show card if no upcoming classes
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Classes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Today's Remaining Classes */}
          {todaySlots.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                  Today ({format(today, 'MMM d')})
                </span>
              </div>
              <div className="space-y-2">
                {todaySlots.map(slot => (
                  <div 
                    key={slot.id} 
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{slot.subject}</p>
                        <p className="text-xs text-muted-foreground">
                          {slot.class_name} • {slot.period_label}
                        </p>
                        {slot.period_time && (
                          <div className="flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{slot.period_time}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleTransferClick(slot)}
                    >
                      <ArrowRightLeft className="h-3 w-3 mr-1" />
                      Transfer
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tomorrow's Classes */}
          {tomorrowSlots.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <span className="text-sm font-semibold text-blue-700 dark:text-blue-400">
                  Tomorrow ({format(tomorrow, 'MMM d')})
                </span>
              </div>
              <div className="space-y-2">
                {tomorrowSlots.map(slot => (
                  <div 
                    key={slot.id} 
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500/10 rounded-lg">
                        <Users className="h-4 w-4 text-blue-500" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{slot.subject}</p>
                        <p className="text-xs text-muted-foreground">
                          {slot.class_name} • {slot.period_label}
                        </p>
                        {slot.period_time && (
                          <div className="flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{slot.period_time}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleTransferClick(slot)}
                    >
                      <ArrowRightLeft className="h-3 w-3 mr-1" />
                      Transfer
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grant Access Dialog */}
      {selectedSlot && (
        <GrantClassAccessDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          grantingOfficerId={officerId}
          institutionId={institutionId}
          preselectedClassId={selectedSlot.class_id}
          preselectedTimetableAssignmentId={selectedSlot.id}
          defaultValidFrom={selectedSlot.day === todayName 
            ? format(today, 'yyyy-MM-dd') 
            : format(tomorrow, 'yyyy-MM-dd')}
          defaultValidUntil={selectedSlot.day === todayName 
            ? format(today, 'yyyy-MM-dd') 
            : format(tomorrow, 'yyyy-MM-dd')}
        />
      )}
    </>
  );
}
