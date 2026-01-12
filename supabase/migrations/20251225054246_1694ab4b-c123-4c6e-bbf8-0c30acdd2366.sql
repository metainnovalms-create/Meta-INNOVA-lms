-- Ensure UPSERT works for session completion marking
-- (Matches onConflict: 'student_id,content_id,class_assignment_id')
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'student_content_completions_unique_student_content_assignment'
  ) THEN
    ALTER TABLE public.student_content_completions
      ADD CONSTRAINT student_content_completions_unique_student_content_assignment
      UNIQUE (student_id, content_id, class_assignment_id);
  END IF;
END $$;

-- Helpful index for progress queries
CREATE INDEX IF NOT EXISTS idx_scc_assignment_student
  ON public.student_content_completions (class_assignment_id, student_id);

CREATE INDEX IF NOT EXISTS idx_scc_content
  ON public.student_content_completions (content_id);
