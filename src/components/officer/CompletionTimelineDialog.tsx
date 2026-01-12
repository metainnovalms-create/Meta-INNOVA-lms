import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { format, isSameDay, parseISO } from 'date-fns';
import { FileText, Video, Link as LinkIcon, Calendar as CalendarIcon } from 'lucide-react';
import type { CompletionTimelineItem } from '@/types/contentCompletion';

interface CompletionTimelineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  completions: CompletionTimelineItem[];
  courseTitle: string;
}

export function CompletionTimelineDialog({
  open,
  onOpenChange,
  completions,
  courseTitle,
}: CompletionTimelineDialogProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  // Get unique dates with completions
  const completionDates = completions.map(c => parseISO(c.completed_at));
  
  // Filter completions by selected date
  const filteredCompletions = selectedDate
    ? completions.filter(c => isSameDay(parseISO(c.completed_at), selectedDate))
    : completions;

  // Sort by time (most recent first)
  const sortedCompletions = [...filteredCompletions].sort(
    (a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
  );

  // Group by date
  const groupedByDate = sortedCompletions.reduce((acc, completion) => {
    const date = format(parseISO(completion.completed_at), 'MMMM d, yyyy');
    if (!acc[date]) acc[date] = [];
    acc[date].push(completion);
    return acc;
  }, {} as Record<string, CompletionTimelineItem[]>);

  const getContentIcon = (type: string) => {
    const iconClass = "h-4 w-4";
    switch (type) {
      case 'pdf':
      case 'ppt':
        return <FileText className={iconClass} />;
      case 'video':
      case 'youtube':
        return <Video className={iconClass} />;
      case 'link':
      case 'simulation':
        return <LinkIcon className={iconClass} />;
      default:
        return <FileText className={iconClass} />;
    }
  };

  const getContentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      pdf: 'PDF Document',
      video: 'Video',
      youtube: 'YouTube Video',
      ppt: 'Presentation',
      link: 'Link',
      simulation: 'Simulation',
    };
    return labels[type] || type;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Completion Timeline - {courseTitle}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {completions.length} items completed
          </p>
        </DialogHeader>

        <div className="flex gap-4 p-6 pt-0 overflow-hidden h-[calc(85vh-8rem)]">
          {/* Calendar */}
          <div className="flex-shrink-0">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              modifiers={{
                completed: completionDates,
              }}
              modifiersStyles={{
                completed: {
                  fontWeight: 'bold',
                  textDecoration: 'underline',
                  color: 'hsl(var(--primary))',
                },
              }}
              className="rounded-md border pointer-events-auto"
            />
          </div>

          {/* Timeline List */}
          <ScrollArea className="flex-1">
            <div className="space-y-6 pr-4">
              {Object.keys(groupedByDate).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No completions on this date</p>
                  <p className="text-sm mt-1">Select another date or start completing content</p>
                </div>
              ) : (
                Object.entries(groupedByDate).map(([date, items]) => (
                  <div key={date}>
                    <h3 className="font-semibold text-sm text-muted-foreground mb-3 flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      {date}
                    </h3>
                    <div className="space-y-3">
                      {items.map((item) => (
                        <div
                          key={`${item.content_id}-${item.completed_at}`}
                          className="flex gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex-shrink-0 mt-1">
                            {getContentIcon(item.content_type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h4 className="font-medium text-sm">{item.content_title}</h4>
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {format(parseISO(item.completed_at), 'h:mm a')}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">
                              {item.module_title}
                            </p>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">
                                {getContentTypeLabel(item.content_type)}
                              </Badge>
                              {item.watch_percentage && (
                                <Badge variant="outline" className="text-xs">
                                  {Math.round(item.watch_percentage)}% watched
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="border-t p-4 bg-muted/30">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
