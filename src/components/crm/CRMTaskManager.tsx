import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, User, AlertCircle, CheckCircle, Clock, RefreshCw, MessageSquare, DollarSign, Users } from "lucide-react";
import { CRMTask } from "@/hooks/useCRMTasks";
import { format, isPast } from "date-fns";

interface CRMTaskManagerProps {
  tasks: CRMTask[];
  onCompleteTask?: (task: CRMTask) => void;
  onEditTask?: (task: CRMTask) => void;
  onViewTask?: (task: CRMTask) => void;
}

const taskTypeIcons = {
  renewal_reminder: RefreshCw,
  follow_up: MessageSquare,
  payment_reminder: DollarSign,
  meeting_scheduled: Users,
  support_ticket: AlertCircle,
};

const taskTypeColors = {
  renewal_reminder: "bg-blue-500/10 text-blue-600",
  follow_up: "bg-purple-500/10 text-purple-600",
  payment_reminder: "bg-green-500/10 text-green-600",
  meeting_scheduled: "bg-orange-500/10 text-orange-600",
  support_ticket: "bg-red-500/10 text-red-600",
};

const priorityColors = {
  high: "bg-red-500/10 text-red-600",
  medium: "bg-yellow-500/10 text-yellow-600",
  low: "bg-blue-500/10 text-blue-600",
};

const statusColors = {
  pending: "bg-gray-500/10 text-gray-600",
  in_progress: "bg-blue-500/10 text-blue-600",
  completed: "bg-green-500/10 text-green-600",
  cancelled: "bg-red-500/10 text-red-600",
};

export function CRMTaskManager({ tasks, onCompleteTask, onEditTask, onViewTask }: CRMTaskManagerProps) {
  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const overdueTasks = tasks.filter(t => 
    (t.status === 'pending' || t.status === 'in_progress') && isPast(new Date(t.due_date))
  );

  const TaskCard = ({ task }: { task: CRMTask }) => {
    const TypeIcon = taskTypeIcons[task.task_type];
    const isOverdue = isPast(new Date(task.due_date)) && task.status !== 'completed';

    const handleCardClick = () => {
      onViewTask?.(task);
    };

    return (
      <Card 
        className={`hover:shadow-md transition-shadow cursor-pointer ${isOverdue ? 'border-red-500/50' : ''}`}
        onClick={handleCardClick}
      >
        <CardContent className="pt-6">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-start gap-3 flex-1">
              <div className={`p-2 rounded-lg ${taskTypeColors[task.task_type]}`}>
                <TypeIcon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-sm mb-1">{task.description}</h4>
                <p className="text-sm text-muted-foreground">{task.institution_name}</p>
              </div>
            </div>
            <div className="flex flex-col gap-2 items-end">
              <Badge variant="outline" className={priorityColors[task.priority]}>
                {task.priority.toUpperCase()}
              </Badge>
              <Badge variant="outline" className={statusColors[task.status]}>
                {task.status.replace(/_/g, ' ').toUpperCase()}
              </Badge>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span className={isOverdue ? "text-red-600 font-medium" : ""}>
                Due: {format(new Date(task.due_date), 'MMM dd, yyyy')}
                {isOverdue && " (Overdue)"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-4 w-4" />
              <span>Assigned to: {task.assigned_to}</span>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            {task.status !== 'completed' && (
              <Button
                size="sm"
                className="flex-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onCompleteTask?.(task);
                }}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark Complete
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                onEditTask?.(task);
              }}
            >
              Edit
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingTasks.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressTasks.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedTasks.length}</div>
          </CardContent>
        </Card>

        <Card className="border-red-500/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overdueTasks.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending">Pending ({pendingTasks.length})</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress ({inProgressTasks.length})</TabsTrigger>
          <TabsTrigger value="overdue">Overdue ({overdueTasks.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedTasks.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4 mt-6">
          {pendingTasks.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No pending tasks</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {pendingTasks.map(task => <TaskCard key={task.id} task={task} />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="in_progress" className="space-y-4 mt-6">
          {inProgressTasks.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No tasks in progress</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {inProgressTasks.map(task => <TaskCard key={task.id} task={task} />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="overdue" className="space-y-4 mt-6">
          {overdueTasks.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No overdue tasks</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {overdueTasks.map(task => <TaskCard key={task.id} task={task} />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4 mt-6">
          {completedTasks.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No completed tasks</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {completedTasks.map(task => <TaskCard key={task.id} task={task} />)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
