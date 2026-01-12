import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Task, TaskStatus, TaskPriority } from '@/types/task';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TaskStatsCards } from '@/components/task/TaskStatsCards';
import { TaskFilters } from '@/components/task/TaskFilters';
import { TaskCard } from '@/components/task/TaskCard';
import { CreateTaskDialog } from '@/components/task/CreateTaskDialog';
import { TaskDetailDialog } from '@/components/task/TaskDetailDialog';
import { Button } from '@/components/ui/button';
import { Plus, AlertCircle, Loader2 } from 'lucide-react';
import { 
  createTask, 
  updateTaskInDb, 
  deleteTaskFromDb, 
  addTaskComment,
  getTaskStatistics 
} from '@/services/task.service';
import { useRealtimeTasks } from '@/hooks/useRealtimeTasks';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { canAccessFeature } from '@/utils/permissionHelpers';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function TaskManagement() {
  const { user } = useAuth();

  // Check if user has task_management feature
  if (!canAccessFeature(user, 'task_management')) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <Alert variant="destructive" className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>
              You do not have permission to create or manage tasks. Contact your administrator for access.
            </AlertDescription>
          </Alert>
        </div>
      </Layout>
    );
  }

  // Use real-time tasks hook
  const { tasks, loading, refetch } = useRealtimeTasks(user?.id || '', 'all');
  
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'created' | 'pending'>('all');
  
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [stats, setStats] = useState({ total: 0, pending: 0, in_progress: 0, completed: 0, overdue: 0 });

  // Load stats on mount and when tasks change
  useEffect(() => {
    loadStats();
  }, [tasks]);

  const loadStats = async () => {
    try {
      const statsData = await getTaskStatistics();
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const pendingApprovalCount = tasks.filter(
    t => t.created_by_id === user?.id && t.status === 'submitted_for_approval'
  ).length;

  // Get unique assignees
  const assignees = Array.from(
    new Map(tasks.map(task => [task.assigned_to_id, { id: task.assigned_to_id, name: task.assigned_to_name }])).values()
  );

  // Sync selectedTask with realtime updates
  useEffect(() => {
    if (selectedTask) {
      const updatedTask = tasks.find(t => t.id === selectedTask.id);
      if (updatedTask) {
        setSelectedTask(updatedTask);
      }
    }
  }, [tasks, selectedTask?.id]);

  // Apply filters
  useEffect(() => {
    let filtered = tasks;

    // Tab-based filtering
    if (activeTab === 'created' && user?.id) {
      filtered = filtered.filter(task => task.created_by_id === user.id);
    } else if (activeTab === 'pending' && user?.id) {
      filtered = filtered.filter(
        task => task.created_by_id === user.id && task.status === 'submitted_for_approval'
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(task => task.status === statusFilter);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(task => task.priority === priorityFilter);
    }

    if (assigneeFilter !== 'all') {
      filtered = filtered.filter(task => task.assigned_to_id === assigneeFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(query) ||
        task.description.toLowerCase().includes(query)
      );
    }

    setFilteredTasks(filtered);
  }, [tasks, statusFilter, priorityFilter, assigneeFilter, searchQuery, activeTab, user?.id]);

  const handleCreateTask = async (taskData: {
    title: string;
    description: string;
    category: any;
    priority: any;
    assigned_to_id: string;
    assigned_to_name: string;
    assigned_to_position: string;
    assigned_to_role: string;
    due_date: string;
  }) => {
    try {
      await createTask({
        ...taskData,
        status: 'pending',
        created_by_id: user?.id || '',
        created_by_name: user?.name || '',
        created_by_position: user?.position_name || 'CEO',
        progress_percentage: 0,
      });
      // No need to refresh - real-time will update
      await loadStats();
      toast.success('Task created successfully');
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Failed to create task');
    }
  };

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
      // Comments update via real-time
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTaskFromDb(taskId);
      // Force refresh to ensure UI updates immediately
      await refetch();
      await loadStats();
      toast.success('Task deleted successfully');
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    }
  };

  const handleApproveTask = async (taskId: string, approvedById: string) => {
    try {
      await updateTaskInDb(taskId, {
        status: 'completed',
        completed_at: new Date().toISOString(),
        approved_by_id: approvedById,
        approved_by_name: user?.name || '',
        approved_at: new Date().toISOString(),
      }, { approverName: user?.name || '' });
      
      // Force refresh to ensure UI updates immediately
      await refetch();
      await loadStats();
      
      if (selectedTask?.id === taskId) {
        setSelectedTask(prev => prev ? { ...prev, status: 'completed' } : null);
      }
      toast.success('Task approved');
    } catch (error) {
      console.error('Error approving task:', error);
      toast.error('Failed to approve task');
    }
  };

  const handleRejectTask = async (taskId: string, reason: string) => {
    try {
      await updateTaskInDb(taskId, {
        status: 'rejected',
        rejection_reason: reason,
      }, { approverName: user?.name || '', rejectionReason: reason });
      
      // Force refresh to ensure UI updates immediately
      await refetch();
      await loadStats();
      
      if (selectedTask?.id === taskId) {
        setSelectedTask(prev => prev ? { ...prev, status: 'rejected' } : null);
      }
      toast.success('Task rejected');
    } catch (error) {
      console.error('Error rejecting task:', error);
      toast.error('Failed to reject task');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Task Management</h1>
            <p className="text-muted-foreground mt-1">
              Create, assign, and manage tasks across your organization
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Task
          </Button>
        </div>

        <TaskStatsCards stats={stats} />

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Tasks</TabsTrigger>
            <TabsTrigger value="created">Created by Me</TabsTrigger>
            <TabsTrigger value="pending">
              Pending Approval
              {pendingApprovalCount > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-orange-500 text-white rounded-full">
                  {pendingApprovalCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            <TaskFilters
              statusFilter={statusFilter}
              priorityFilter={priorityFilter}
              searchQuery={searchQuery}
              onStatusChange={setStatusFilter}
              onPriorityChange={setPriorityFilter}
              onSearchChange={setSearchQuery}
              showAssigneeFilter
              assigneeFilter={assigneeFilter}
              onAssigneeChange={setAssigneeFilter}
              assignees={assignees}
            />

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredTasks.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <p className="text-muted-foreground">No tasks found</p>
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
          </TabsContent>
        </Tabs>
      </div>

      <CreateTaskDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreateTask={handleCreateTask}
        currentUser={{
          id: user?.id || '',
          name: user?.name || '',
          position: user?.position_name || 'CEO',
        }}
      />

      {selectedTask && (
        <TaskDetailDialog
          open={!!selectedTask}
          onOpenChange={(open) => !open && setSelectedTask(null)}
          task={selectedTask}
          currentUserId={user?.id || ''}
          onUpdateStatus={handleUpdateStatus}
          onAddComment={handleAddComment}
          onDeleteTask={handleDeleteTask}
          onApproveTask={handleApproveTask}
          onRejectTask={handleRejectTask}
        />
      )}
    </Layout>
  );
}
