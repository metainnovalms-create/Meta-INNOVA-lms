import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TimetableSlot } from "@/types/teacher";
import { cn } from "@/lib/utils";

interface TimetablePreviewCardProps {
  slots: TimetableSlot[];
  className?: string;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

export function TimetablePreviewCard({ slots, className }: TimetablePreviewCardProps) {
  const slotsByDay = slots.reduce((acc, slot) => {
    if (!acc[slot.day]) acc[slot.day] = [];
    acc[slot.day].push(slot);
    return acc;
  }, {} as Record<string, TimetableSlot[]>);

  // Sort slots by time
  Object.keys(slotsByDay).forEach(day => {
    slotsByDay[day].sort((a, b) => a.start_time.localeCompare(b.start_time));
  });

  return (
    <Card className={cn("p-4", className)}>
      <div className="space-y-2">
        {DAYS.map(day => {
          const daySlots = slotsByDay[day] || [];
          if (daySlots.length === 0) return null;
          
          return (
            <div key={day} className="text-sm">
              <span className="font-semibold text-muted-foreground">{day.substring(0, 3)}:</span>
              <div className="ml-4 space-y-1">
                {daySlots.map(slot => (
                  <div key={slot.id} className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground">
                      {slot.start_time}-{slot.end_time.substring(0, 5)}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {slot.subject}
                    </Badge>
                    <span className="text-muted-foreground">({slot.class})</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
