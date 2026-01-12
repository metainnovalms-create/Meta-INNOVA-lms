-- Add columns for manual assessment entry and question order persistence
-- is_manual: true if this attempt was manually entered for offline assessments
-- manual_notes: optional notes for manually entered assessments
-- question_order: stores the shuffled question order for persistence across page reloads

ALTER TABLE public.assessment_attempts 
ADD COLUMN IF NOT EXISTS is_manual boolean NOT NULL DEFAULT false;

ALTER TABLE public.assessment_attempts 
ADD COLUMN IF NOT EXISTS manual_notes text;

ALTER TABLE public.assessment_attempts 
ADD COLUMN IF NOT EXISTS question_order jsonb;

ALTER TABLE public.assessment_attempts 
ADD COLUMN IF NOT EXISTS conducted_at timestamp with time zone;

-- Add unique constraint on attempt_id and question_id for upsert in saveAnswer
ALTER TABLE public.assessment_answers 
DROP CONSTRAINT IF EXISTS assessment_answers_attempt_question_unique;

ALTER TABLE public.assessment_answers 
ADD CONSTRAINT assessment_answers_attempt_question_unique 
UNIQUE (attempt_id, question_id);