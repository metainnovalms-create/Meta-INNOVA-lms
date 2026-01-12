-- Add archived fields to notifications table for "mark as complete" functionality
ALTER TABLE public.notifications
ADD COLUMN IF NOT EXISTS archived boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS archived_at timestamptz,
ADD COLUMN IF NOT EXISTS read_at timestamptz;

-- Add index for faster queries on archived notifications
CREATE INDEX IF NOT EXISTS idx_notifications_archived ON public.notifications(recipient_id, archived);

-- Enable full replica identity for realtime UPDATE events
ALTER TABLE public.notifications REPLICA IDENTITY FULL;