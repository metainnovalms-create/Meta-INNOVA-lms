import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Task, TaskComment } from '@/types/task';
import { toast } from 'sonner';

type TaskMode = 'all' | 'assigned' | 'created';

interface UseRealtimeTasksResult {
  tasks: Task[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useRealtimeTasks(userId: string, mode: TaskMode = 'all'): UseRealtimeTasksResult {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const tasksRef = useRef<Task[]>([]);

  // Keep ref in sync with state
  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      
      let query = supabase.from('tasks').select('*').order('created_at', { ascending: false });

      if (mode === 'assigned') {
        query = query.eq('assigned_to_id', userId);
      } else if (mode === 'created') {
        query = query.eq('created_by_id', userId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Fetch comments for all tasks
      const tasksWithComments = await Promise.all(
        (data || []).map(async (task) => {
          const { data: comments } = await supabase
            .from('task_comments')
            .select('*')
            .eq('task_id', task.id)
            .order('created_at', { ascending: true });

          return { ...task, comments: comments || [] } as Task;
        })
      );

      setTasks(tasksWithComments);
      setError(null);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [userId, mode]);

  // Initial fetch
  useEffect(() => {
    if (userId) {
      fetchTasks();
    }
  }, [userId, fetchTasks]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!userId) return;

    // Use unique channel names per hook instance to prevent conflicts
    const channelId = `realtime-tasks:${mode}:${userId}:${Date.now()}`;
    console.log('[useRealtimeTasks] Setting up realtime subscriptions:', channelId);

    // Subscribe to task changes
    const tasksChannel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
        },
        (payload) => {
          console.log('[useRealtimeTasks] Task change received:', payload);

          if (payload.eventType === 'INSERT') {
            const newTask = payload.new as Task;
            
            // Filter based on mode
            if (mode === 'assigned' && newTask.assigned_to_id !== userId) return;
            if (mode === 'created' && newTask.created_by_id !== userId) return;

            setTasks(prev => {
              // Check if task already exists
              if (prev.find(t => t.id === newTask.id)) return prev;
              return [{ ...newTask, comments: [] }, ...prev];
            });

            // Show toast for new tasks assigned to user
            if (newTask.assigned_to_id === userId) {
              toast.info(`New task assigned: ${newTask.title}`);
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedTask = payload.new as Task;
            
            setTasks(prev => 
              prev.map(task => 
                task.id === updatedTask.id 
                  ? { ...updatedTask, comments: task.comments } 
                  : task
              )
            );
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as any).id;
            setTasks(prev => prev.filter(task => task.id !== deletedId));
          }
        }
      )
      .subscribe((status) => {
        console.log('[useRealtimeTasks] Tasks subscription status:', status);
      });

    // Subscribe to comment changes with unique channel name
    const commentsChannelId = `realtime-comments:${mode}:${userId}:${Date.now()}`;
    const commentsChannel = supabase
      .channel(commentsChannelId)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'task_comments',
        },
        (payload) => {
          console.log('[useRealtimeTasks] Comment added:', payload);
          const newComment = payload.new as TaskComment;

          setTasks(prev => 
            prev.map(task => {
              if (task.id === newComment.task_id) {
                // Check if comment already exists
                const existingComment = task.comments?.find(c => c.id === newComment.id);
                if (existingComment) return task;

                return {
                  ...task,
                  comments: [...(task.comments || []), newComment],
                };
              }
              return task;
            })
          );

          // Show toast for new comments (not from current user)
          if (newComment.user_id !== userId) {
            const task = tasksRef.current.find(t => t.id === newComment.task_id);
            if (task) {
              toast.info(`New comment on \"${task.title}\" from ${newComment.user_name}`);
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('[useRealtimeTasks] Comments subscription status:', status);
      });

    // Cleanup subscriptions
    return () => {
      console.log('[useRealtimeTasks] Cleaning up subscriptions');
      supabase.removeChannel(tasksChannel);
      supabase.removeChannel(commentsChannel);
    };
  }, [userId, mode]);

  return {
    tasks,
    loading,
    error,
    refetch: fetchTasks,
  };
}

// Hook for subscribing to comments on a specific task
export function useRealtimeTaskComments(
  taskId: string,
  initialComments: TaskComment[] = []
): {
  comments: TaskComment[];
  addComment: (comment: TaskComment) => void;
} {
  const [comments, setComments] = useState<TaskComment[]>(initialComments);

  // Sync with initial comments when they change
  useEffect(() => {
    setComments(initialComments);
  }, [initialComments]);

  // Subscribe to real-time comment updates for this task
  useEffect(() => {
    if (!taskId) return;

    console.log('[useRealtimeTaskComments] Setting up subscription for task:', taskId);

    const channel = supabase
      .channel(`task-comments-${taskId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'task_comments',
          filter: `task_id=eq.${taskId}`,
        },
        (payload) => {
          console.log('[useRealtimeTaskComments] New comment:', payload);
          const newComment = payload.new as TaskComment;

          setComments(prev => {
            // Prevent duplicates
            if (prev.find(c => c.id === newComment.id)) return prev;
            return [...prev, newComment];
          });
        }
      )
      .subscribe((status) => {
        console.log('[useRealtimeTaskComments] Subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [taskId]);

  const addComment = useCallback((comment: TaskComment) => {
    setComments(prev => {
      if (prev.find(c => c.id === comment.id)) return prev;
      return [...prev, comment];
    });
  }, []);

  return { comments, addComment };
}
