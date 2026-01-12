-- ============================================
-- Meta-INNOVA LMS - Realtime Configuration
-- Enable realtime for required tables
-- ============================================

-- Enable realtime for attendance tracking
ALTER PUBLICATION supabase_realtime ADD TABLE public.officer_attendance;
ALTER PUBLICATION supabase_realtime ADD TABLE public.class_session_attendance;

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Enable realtime for gamification
ALTER PUBLICATION supabase_realtime ADD TABLE public.student_xp_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.student_badges;
ALTER PUBLICATION supabase_realtime ADD TABLE public.student_streaks;

-- Enable realtime for task management
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_activity_log;
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_attachments;

-- Enable realtime for CRM
ALTER PUBLICATION supabase_realtime ADD TABLE public.communication_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.communication_log_attachments;

-- Enable realtime for invoices
ALTER PUBLICATION supabase_realtime ADD TABLE public.invoices;

-- Enable realtime for CRM tasks
ALTER PUBLICATION supabase_realtime ADD TABLE public.crm_tasks;

-- Enable realtime for surveys
ALTER PUBLICATION supabase_realtime ADD TABLE public.surveys;
ALTER PUBLICATION supabase_realtime ADD TABLE public.survey_responses;
