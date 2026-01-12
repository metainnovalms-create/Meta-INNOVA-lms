import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Task, TaskStatus, TaskPriority } from '@/types/task';
import { TaskStatsCards } from '@/components/task/TaskStatsCards';
import { TaskFilters } from '@/components/task/TaskFilters';
import { TaskCard } from '@/components/task/TaskCard';
import { TaskDetailDialog } from '@/components/task/TaskDetailDialog';
import { updateTaskInDb, addTaskComment, getTaskStatistics } from '@/services/task.service';
import { useRealtimeTasks } from '@/hooks/useRealtimeTasks';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { canAccessFeature } from '@/utils/permissionHelpers';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';

export default function Tasks() {
  const { user } = useAuth();

  if (!canAccessFeature(user, 'task_allotment')) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <Alert variant="destructive" className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>
              You do not have permission to view assigned tasks. Contact your administrator for access.
            </AlertDescription>
          </Alert>
        </div>
      </Layout>
    );
  }

  const { tasks, loading, refetch } = useRealtimeTasks(user?.id || '', 'assigned');
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [stats, setStats] = useState({ total: 0, pending: 0, in_progress: 0, completed: 0, overdue: 0 });

  useEffect(() => {
    if (user?.id) loadStats();
  }, [user?.id, tasks]);

  const loadStats = async () => {
    if (!user?.id) return;
    try {
      const statsData = await getTaskStatistics(user.id);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Sync selectedTask with realtime updates
  useEffect(() => {
    if (selectedTask) {
      const updatedTask = tasks.find(t => t.id === selectedTask.id);
      if (updatedTask) {
        setSelectedTask(updatedTask);
      }
    }
  }, [tasks, selectedTask?.id]);

  useEffect(() => {
    let filtered = tasks;
    if (statusFilter !== 'all') filtered = filtered.filter(task => task.status === statusFilter);
    if (priorityFilter !== 'all') filtered = filtered.filter(task => task.priority === priorityFilter);
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(query) || task.description.toLowerCase().includes(query)
      );
    }
    setFilteredTasks(filtered);
  }, [tasks, statusFilter, priorityFilter, searchQuery]);

  const handleUpdateStatus = async (taskId: string, status: TaskStatus, progress?: number) => {
    try {
      await updateTaskInDb(taskId, {
        status,
        progress_percentage: progress !== undefined ? progress : undefined,
        completed_at: status === 'completed' ? new Date().toISOString() : undefined,
      }, { changedByName: user?.name || '' });
      
      // Force refresh to ensure UI updates immediately
      await refetch();
      await loadStats();
      
      // Optimistic update for dialog
      if (selectedTask?.id === taskId) {
        setSelectedTask(prev => prev ? { 
          ...prev, 
          status, 
          progress_percentage: progress !== undefined ? progress : prev.progress_percentage 
        } : null);
      }
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    }
  };

  const handleAddComment = async (taskId: string, comment: string) => {
    try {
      await addTaskComment(taskId, user?.id || '', user?.name || '', comment);
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    }
  };

  const handleSubmitForApproval = async (taskId: string) => {
    try {
      await updateTaskInDb(taskId, {
        status: 'submitted_for_approval',
        submitted_at: new Date().toISOString(),
        progress_percentage: 100,
      }, { submitterName: user?.name || '' });
      
      // Force refresh to ensure UI updates immediately
      await refetch();
      await loadStats();
      
      if (selectedTask?.id === taskId) setSelectedTask(prev => prev ? { ...prev, status: 'submitted_for_approval' } : null);
      toast.success('Task submitted for approval');
    } catch (error) {
      console.error('Error submitting task:', error);
      toast.error('Failed to submit task');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Tasks</h1>
          <p className="text-muted-foreground mt-1">
            View and manage your assigned tasks
          </p>
        </div>

        <TaskStatsCards stats={stats} />

        <TaskFilters
          statusFilter={statusFilter}
          priorityFilter={priorityFilter}
          searchQuery={searchQuery}
          onStatusChange={setStatusFilter}
          onPriorityChange={setPriorityFilter}
          onSearchChange={setSearchQuery}
        />

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredTasks.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground">
                  {tasks.length === 0 
                    ? 'No tasks assigned to you yet'
                    : 'No tasks found matching your filters'
                  }
                </p>
              </div>
            ) : (
              filteredTasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onClick={() => setSelectedTask(task)}
                />
              ))
            )}
          </div>
        )}
      </div>

      {selectedTask && (
        <TaskDetailDialog
          open={!!selectedTask}
          onOpenChange={(open) => !open && setSelectedTask(null)}
          task={selectedTask}
          currentUserId={user?.id || ''}
          onUpdateStatus={handleUpdateStatus}
          onAddComment={handleAddComment}
          onSubmitForApproval={handleSubmitForApproval}
        />
      )}
    </Layout>
  );
}
