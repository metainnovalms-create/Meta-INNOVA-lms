import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Task {
  id: string;
  title: string;
  due_date: string;
  assigned_to_id: string;
  assigned_to_name: string;
  created_by_id: string;
  created_by_name: string;
  due_soon_notified: boolean;
  overdue_notified: boolean;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    console.log(`[check-task-reminders] Running at ${now.toISOString()}`);

    // Fetch tasks due within 24 hours that haven't been notified
    const { data: dueSoonTasks, error: dueSoonError } = await supabase
      .from('tasks')
      .select('id, title, due_date, assigned_to_id, assigned_to_name, created_by_id, created_by_name, due_soon_notified, overdue_notified')
      .not('status', 'in', '("completed","cancelled")')
      .lte('due_date', in24Hours.toISOString())
      .gt('due_date', now.toISOString())
      .eq('due_soon_notified', false);

    if (dueSoonError) {
      console.error('Error fetching due soon tasks:', dueSoonError);
    } else if (dueSoonTasks && dueSoonTasks.length > 0) {
      console.log(`Found ${dueSoonTasks.length} tasks due soon`);
      
      for (const task of dueSoonTasks as Task[]) {
        // Send notification to assignee
        await supabase.from('notifications').insert({
          recipient_id: task.assigned_to_id,
          recipient_role: 'officer',
          type: 'task_due_soon',
          title: 'Task Due Soon',
          message: `Task "${task.title}" is due within 24 hours`,
          link: `/officer/tasks`,
          metadata: { task_id: task.id, task_title: task.title }
        });

        // Update task to mark as notified
        await supabase
          .from('tasks')
          .update({ due_soon_notified: true })
          .eq('id', task.id);

        console.log(`Sent due-soon notification for task: ${task.id}`);
      }
    }

    // Fetch overdue tasks that haven't been notified
    const { data: overdueTasks, error: overdueError } = await supabase
      .from('tasks')
      .select('id, title, due_date, assigned_to_id, assigned_to_name, created_by_id, created_by_name, due_soon_notified, overdue_notified')
      .not('status', 'in', '("completed","cancelled")')
      .lt('due_date', now.toISOString())
      .eq('overdue_notified', false);

    if (overdueError) {
      console.error('Error fetching overdue tasks:', overdueError);
    } else if (overdueTasks && overdueTasks.length > 0) {
      console.log(`Found ${overdueTasks.length} overdue tasks`);
      
      for (const task of overdueTasks as Task[]) {
        // Send notification to assignee
        await supabase.from('notifications').insert({
          recipient_id: task.assigned_to_id,
          recipient_role: 'officer',
          type: 'task_overdue',
          title: 'Task Overdue',
          message: `Task "${task.title}" is now overdue`,
          link: `/officer/tasks`,
          metadata: { task_id: task.id, task_title: task.title }
        });

        // Also notify the creator
        await supabase.from('notifications').insert({
          recipient_id: task.created_by_id,
          recipient_role: 'system_admin',
          type: 'task_overdue',
          title: 'Task Overdue',
          message: `Task "${task.title}" assigned to ${task.assigned_to_name} is now overdue`,
          link: `/system-admin/task-management`,
          metadata: { task_id: task.id, task_title: task.title, assignee: task.assigned_to_name }
        });

        // Update task to mark as notified
        await supabase
          .from('tasks')
          .update({ overdue_notified: true })
          .eq('id', task.id);

        console.log(`Sent overdue notification for task: ${task.id}`);
      }
    }

    const summary = {
      checked_at: now.toISOString(),
      due_soon_notified: dueSoonTasks?.length || 0,
      overdue_notified: overdueTasks?.length || 0,
    };

    console.log('[check-task-reminders] Complete:', summary);

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: unknown) {
    console.error('[check-task-reminders] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
