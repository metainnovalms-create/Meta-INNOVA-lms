-- Add certificate_template_id to course_modules for module-level certificates
ALTER TABLE public.course_modules 
ADD COLUMN IF NOT EXISTS certificate_template_id text;

-- Remove category, difficulty, duration_weeks defaults to make them optional
-- Since these columns already have defaults, we just need to ensure they're nullable (they already are based on schema)
-- The courses table already has these as optional with defaults, so no schema change needed

-- Add comment to clarify certificate is at module level
COMMENT ON COLUMN public.course_modules.certificate_template_id IS 'Certificate template to award upon module completion';