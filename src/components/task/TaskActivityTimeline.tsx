import { useEffect, useState } from 'react';
import { TaskActivity, TaskActivityType } from '@/types/task';
import { fetchTaskActivities } from '@/services/taskActivity.service';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  FileText, 
  MessageSquare, 
  Paperclip, 
  Send, 
  ThumbsDown, 
  ThumbsUp,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

interface TaskActivityTimelineProps {
  taskId: string;
}

const getActivityIcon = (actionType: TaskActivityType) => {
  switch (actionType) {
    case 'created':
      return <Circle className="h-4 w-4 text-primary" />;
    case 'status_changed':
      return <Clock className="h-4 w-4 text-blue-500" />;
    case 'priority_changed':
      return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    case 'progress_updated':
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    case 'comment_added':
      return <MessageSquare className="h-4 w-4 text-purple-500" />;
    case 'attachment_added':
      return <Paperclip className="h-4 w-4 text-cyan-500" />;
    case 'attachment_removed':
      return <Paperclip className="h-4 w-4 text-muted-foreground" />;
    case 'submitted':
      return <Send className="h-4 w-4 text-yellow-500" />;
    case 'approved':
      return <ThumbsUp className="h-4 w-4 text-green-500" />;
    case 'rejected':
      return <ThumbsDown className="h-4 w-4 text-red-500" />;
    default:
      return <FileText className="h-4 w-4 text-muted-foreground" />;
  }
};

const getActivityColor = (actionType: TaskActivityType): string => {
  switch (actionType) {
    case 'created':
      return 'bg-primary/10 border-primary/30';
    case 'status_changed':
      return 'bg-blue-500/10 border-blue-500/30';
    case 'priority_changed':
      return 'bg-orange-500/10 border-orange-500/30';
    case 'progress_updated':
      return 'bg-green-500/10 border-green-500/30';
    case 'comment_added':
      return 'bg-purple-500/10 border-purple-500/30';
    case 'attachment_added':
      return 'bg-cyan-500/10 border-cyan-500/30';
    case 'attachment_removed':
      return 'bg-muted border-muted-foreground/30';
    case 'submitted':
      return 'bg-yellow-500/10 border-yellow-500/30';
    case 'approved':
      return 'bg-green-500/10 border-green-500/30';
    case 'rejected':
      return 'bg-red-500/10 border-red-500/30';
    default:
      return 'bg-muted border-muted-foreground/30';
  }
};

export function TaskActivityTimeline({ taskId }: TaskActivityTimelineProps) {
  const [activities, setActivities] = useState<TaskActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadActivities = async () => {
      setLoading(true);
      const data = await fetchTaskActivities(taskId);
      setActivities(data);
      setLoading(false);
    };

    loadActivities();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`task-activity-${taskId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'task_activity_log',
          filter: `task_id=eq.${taskId}`,
        },
        (payload) => {
          const newActivity = payload.new as any;
          setActivities(prev => [{
            id: newActivity.id,
            task_id: newActivity.task_id,
            user_id: newActivity.user_id,
            user_name: newActivity.user_name,
            action_type: newActivity.action_type as TaskActivityType,
            old_value: newActivity.old_value || undefined,
            new_value: newActivity.new_value || undefined,
            description: newActivity.description,
            created_at: newActivity.created_at,
          }, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [taskId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No activity yet</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[300px] pr-4">
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
        
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <div key={activity.id} className="relative flex gap-4 pl-10">
              {/* Timeline dot */}
              <div className={`absolute left-2 p-1.5 rounded-full border ${getActivityColor(activity.action_type)}`}>
                {getActivityIcon(activity.action_type)}
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {activity.user_name}
                    </p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {activity.description}
                    </p>
                    {(activity.old_value || activity.new_value) && (
                      <div className="flex items-center gap-2 mt-1 text-xs">
                        {activity.old_value && (
                          <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground line-through">
                            {activity.old_value}
                          </span>
                        )}
                        {activity.old_value && activity.new_value && (
                          <span className="text-muted-foreground">→</span>
                        )}
                        {activity.new_value && (
                          <span className="px-2 py-0.5 rounded bg-primary/10 text-primary">
                            {activity.new_value}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <time className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                  </time>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}
