import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckSquare, Clock, AlertTriangle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format, isToday, isPast, parseISO } from 'date-fns';

interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  due_date: string | null;
}

interface TasksSummaryCardProps {
  tasks: Task[];
  isLoading?: boolean;
  tasksPath?: string;
  title?: string;
  className?: string;
}

import { cn } from '@/lib/utils';

export function TasksSummaryCard({
  tasks,
  isLoading = false,
  tasksPath = '/tasks',
  title = 'My Tasks',
  className,
}: TasksSummaryCardProps) {
  const getPriorityBadge = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
      case 'urgent':
        return <Badge variant="destructive" className="text-xs">High</Badge>;
      case 'medium':
        return <Badge variant="default" className="text-xs bg-yellow-500">Medium</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">Low</Badge>;
    }
  };

  const getDueDateStatus = (dueDate: string | null) => {
    if (!dueDate) return null;
    
    const date = parseISO(dueDate);
    if (isToday(date)) {
      return <span className="text-xs text-yellow-600 font-medium">Due Today</span>;
    }
    if (isPast(date)) {
      return <span className="text-xs text-red-600 font-medium">Overdue</span>;
    }
    return <span className="text-xs text-muted-foreground">{format(date, 'MMM d')}</span>;
  };

  if (isLoading) {
    return (
      <Card className={cn(className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-primary" />
            {title}
          </CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const dueTodayCount = tasks.filter(t => t.due_date && isToday(parseISO(t.due_date))).length;
  const overdueCount = tasks.filter(t => t.due_date && isPast(parseISO(t.due_date)) && !isToday(parseISO(t.due_date))).length;

  return (
    <Card className={cn(className)}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-primary" />
            {title}
          </CardTitle>
          <CardDescription>
            {tasks.length} pending task{tasks.length !== 1 ? 's' : ''}
            {dueTodayCount > 0 && ` • ${dueTodayCount} due today`}
            {overdueCount > 0 && ` • ${overdueCount} overdue`}
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link to={tasksPath}>
            View All
            <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">All caught up!</p>
            <p className="text-sm">No pending tasks at the moment</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <div 
                key={task.id} 
                className="flex items-start justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-sm truncate">{task.title}</p>
                    {getPriorityBadge(task.priority)}
                  </div>
                  {task.description && (
                    <p className="text-xs text-muted-foreground truncate">{task.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-2 shrink-0">
                  {task.due_date && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      {getDueDateStatus(task.due_date)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
